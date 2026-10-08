import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { permissionsAgents } from "@/lib/db/schema/s2-autorisations";
import { BarreOutilsAgents } from "./barre-outils";
import { CartesAgents } from "./cartes-agents";
import { PaginationListe } from "../list/pagination-liste";
import { nomAffiche } from "../list/affichage-admin";

const FILTRES_VALIDES = ["valide", "suspendu", "revoque", "sans-permission"] as const;
const TRIS_VALIDES = ["anciens", "nom-az", "nom-za"] as const;

/** Cartes par page de la grille. */
const CARTES_PAR_PAGE = 9;

export type FiltreAgent = (typeof FILTRES_VALIDES)[number];

/**
 * /admin/agents — Agents de service en cartes : identité, état, nombre de
 * permissions, traçabilité. Recherche (?q=), filtre (?filtre=), tri (?tri=)
 * et pagination (?page=) côté serveur.
 *
 * Le badge « sans permission » est le point d'entrée d'embauche : un agent
 * créé n'a rien (S2 zéro par défaut), le distributeur lui accorde ensuite
 * une par une depuis la fiche ou la matrice globale.
 */
export default async function ListeAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    filtre?: string;
    tri?: string;
    page?: string;
  }>;
}) {
  const filtres = await searchParams;
  const recherche = (filtres.q ?? "").trim().toLowerCase();
  const filtreDemande = (FILTRES_VALIDES as readonly string[]).includes(
    filtres.filtre ?? "",
  )
    ? (filtres.filtre as FiltreAgent)
    : null;
  const triDemande = (TRIS_VALIDES as readonly string[]).includes(filtres.tri ?? "")
    ? (filtres.tri as (typeof TRIS_VALIDES)[number])
    : null;
  const estFiltre = recherche !== "" || filtreDemande !== null;

  const entetes = await headers();
  const sessionPromise = auth.api.getSession({ headers: entetes });
  const lignesBrutes = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      telephone: comptesStaff.telephone,
      etat: comptesStaff.etat,
      creePar: comptesStaff.creePar,
      createdAt: comptesStaff.createdAt,
      nom: user.name,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.role, "AGENT"))
    .orderBy(desc(comptesStaff.createdAt));

  const idsAgents = lignesBrutes.map((l) => l.id);
  const lignesPermissions =
    idsAgents.length > 0
      ? await db
          .select({ agentId: permissionsAgents.agentId })
          .from(permissionsAgents)
          .where(inArray(permissionsAgents.agentId, idsAgents))
      : [];
  const nbPermissions = new Map<string, number>();
  for (const ligne of lignesPermissions) {
    nbPermissions.set(ligne.agentId, (nbPermissions.get(ligne.agentId) ?? 0) + 1);
  }

  const idsCreateurs = [...new Set(lignesBrutes.map((l) => l.creePar).filter((v) => v !== null))];
  const createurs =
    idsCreateurs.length > 0
      ? await db
          .select({ id: comptesStaff.id, email: comptesStaff.email, nom: user.name })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsCreateurs))
      : [];
  const nomCreateur = new Map(
    createurs.map((c) => [c.id, c.nom?.trim() || c.email]),
  );

  const q = recherche;
  const lignesFiltrees = lignesBrutes.filter((ligne) => {
    if (filtreDemande === "valide" && ligne.etat !== "VALIDE") return false;
    if (filtreDemande === "suspendu" && ligne.etat !== "SUSPENDU") return false;
    if (filtreDemande === "revoque" && ligne.etat !== "REVOQUE") return false;
    if (filtreDemande === "sans-permission" && (nbPermissions.get(ligne.id) ?? 0) > 0)
      return false;
    if (q) {
      const nom = (ligne.nom?.trim() || ligne.email).toLowerCase();
      const telephone = (ligne.telephone || "").toLowerCase();
      if (
        !nom.includes(q) &&
        !ligne.email.toLowerCase().includes(q) &&
        !telephone.includes(q)
      )
        return false;
    }
    return true;
  });

  const lignesTriees = [...lignesFiltrees].sort((a, b) => {
    if (triDemande === "anciens") return a.createdAt.getTime() - b.createdAt.getTime();
    if (triDemande === "nom-az")
      return nomAffiche(a).localeCompare(nomAffiche(b), "fr");
    if (triDemande === "nom-za")
      return nomAffiche(b).localeCompare(nomAffiche(a), "fr");
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const total = lignesBrutes.length;

  const totalPages = Math.max(1, Math.ceil(lignesTriees.length / CARTES_PAR_PAGE));
  const pageDemandee = Math.floor(Number(filtres.page));
  const page =
    Number.isFinite(pageDemandee) && pageDemandee >= 1
      ? Math.min(pageDemandee, totalPages)
      : 1;
  const lignes = lignesTriees.slice(
    (page - 1) * CARTES_PAR_PAGE,
    page * CARTES_PAR_PAGE,
  );
  const conserves = new URLSearchParams();
  if (recherche) conserves.set("q", filtres.q?.trim() ?? "");
  if (filtreDemande) conserves.set("filtre", filtreDemande);
  if (triDemande) conserves.set("tri", triDemande);
  const chaineConservee = conserves.toString();
  const hrefBase = chaineConservee ? `/admin/agents?${chaineConservee}` : "/admin/agents";

  const exportLignes = lignesTriees.map((ligne) => ({
    nom: nomAffiche(ligne),
    email: ligne.email,
    telephone: ligne.telephone || "",
    role: "Agent de service",
    etat: ligne.etat,
    facteur: `${nbPermissions.get(ligne.id) ?? 0} permission(s)`,
    creePar:
      (ligne.creePar ? nomCreateur.get(ligne.creePar) : null) || "Lien d'invitation",
    creeLe: ligne.createdAt.toLocaleDateString("fr-FR"),
  }));

  const session = await sessionPromise;
  const lignesMoi = session?.user?.id
    ? await db
        .select({ id: comptesStaff.id })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, session.user.id))
        .limit(1)
    : [];
  const moiId = lignesMoi[0]?.id ?? null;

  const cartes = lignes.map((ligne) => ({
    id: ligne.id,
    nom: nomAffiche(ligne),
    email: ligne.email,
    telephone: ligne.telephone,
    etat: ligne.etat,
    nbPermissions: nbPermissions.get(ligne.id) ?? 0,
    creeParNom:
      (ligne.creePar ? nomCreateur.get(ligne.creePar) : null) || "Lien d'invitation",
    creeLe: ligne.createdAt,
    estMoi: moiId !== null && ligne.id === moiId,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Agents de service
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {total === 0
            ? "Aucun agent pour le moment."
            : estFiltre
              ? `${lignesTriees.length} sur ${total} agent${total > 1 ? "s" : ""}.`
              : `${total} agent${total > 1 ? "s" : ""}.`}{" "}
          Employés du distributeur sur le terrain. Zéro permission par défaut :
          un agent sans permission s&apos;authentifie mais ne peut rien faire.
        </p>
      </div>

      <Suspense>
        <BarreOutilsAgents exportLignes={exportLignes} />
      </Suspense>

      {lignes.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {estFiltre
              ? "Aucun agent ne correspond aux filtres"
              : "Aucun agent pour le moment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {estFiltre ? (
              <Link href="/admin/agents" className="underline-offset-4 hover:underline">
                Réinitialiser les filtres
              </Link>
            ) : (
              "Créez la première fiche ou envoyez un lien d'invitation."
            )}
          </p>
        </div>
      ) : (
        <CartesAgents cartes={cartes} />
      )}
      <PaginationListe page={page} totalPages={totalPages} hrefBase={hrefBase} />
    </div>
  );
}
