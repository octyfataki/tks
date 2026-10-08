import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  facteurs2faAdmin,
} from "@/lib/db/schema/s1-comptes";
import { BarreOutilsListe } from "./barre-outils";
import { CartesAdmins } from "./cartes-admins";
import { PaginationListe } from "./pagination-liste";
import { libelleRole, nomAffiche } from "./affichage-admin";
import { filtrerLignes, trierLignes } from "./filtrage";

const FILTRES_VALIDES = [
  "principal",
  "technique",
  "valide",
  "revoque",
  "sans-2fa",
] as const;
const TRIS_VALIDES = ["anciens", "nom-az", "nom-za"] as const;

/** Cartes par page de la grille. */
const CARTES_PAR_PAGE = 9;

/**
 * /admin/list — Comptes d'administration en cartes : administrateurs
 * principaux (le distributeur) et administrateurs techniques (diagnostic
 * et déblocage, aucun pouvoir métier). Les agents de service ont leur
 * propre liste.
 *
 * Filtrage (?q=, ?filtre=), tri (?tri=) et pagination (?page=)
 * appliqués côté serveur — le volume d'administrateurs reste dérisoire,
 * une seule lecture suffit. L'interrupteur de chaque carte révoque
 * (définitif, après confirmation), jamais le titulaire lui-même.
 */
export default async function ListeAdminsPage({
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
  const filtreDemande = (
    FILTRES_VALIDES as readonly string[]
  ).includes(filtres.filtre ?? "")
    ? (filtres.filtre as (typeof FILTRES_VALIDES)[number])
    : null;
  const triDemande = (TRIS_VALIDES as readonly string[]).includes(
    filtres.tri ?? "",
  )
    ? (filtres.tri as (typeof TRIS_VALIDES)[number])
    : null;
  const estFiltre = recherche !== "" || filtreDemande !== null;

  // Le nom vit dans better-auth (table user), le second facteur dans
  // facteurs_2fa_admin. Le créateur se résout en seconde requête : les
  // jointures aliasées sur la même table font s'effondrer le typage
  // Drizzle en never[]. La session démarre tôt (requêtes indépendantes).
  const entetes = await headers();
  const sessionPromise = auth.api.getSession({ headers: entetes });
  const lignesBrutes = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      telephone: comptesStaff.telephone,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
      creePar: comptesStaff.creePar,
      createdAt: comptesStaff.createdAt,
      nom: user.name,
      facteurActif: facteurs2faAdmin.actif,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .leftJoin(
      facteurs2faAdmin,
      eq(facteurs2faAdmin.compteStaffId, comptesStaff.id),
    )
    .where(inArray(comptesStaff.role, ["ADMIN_PRINCIPAL", "ADMIN_TECHNIQUE"]))
    .orderBy(desc(comptesStaff.createdAt));

  const idsCreateurs = [...new Set(lignesBrutes.map((l) => l.creePar).filter((v) => v !== null))];
  const createurs =
    idsCreateurs.length > 0
      ? await db
          .select({
            id: comptesStaff.id,
            email: comptesStaff.email,
            nom: user.name,
          })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsCreateurs))
      : [];
  const nomCreateur = new Map(
    createurs.map((c) => [c.id, c.nom?.trim() || c.email]),
  );

  const lignesFiltrees = filtrerLignes(lignesBrutes, recherche, filtreDemande);

  const lignesTriees = trierLignes(lignesFiltrees, triDemande);
  const total = lignesBrutes.length;

  // Pagination (?page=) : page validée puis bornée, hrefBase reconstruit
  // sans ?page= pour les liens du pied.
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
  const hrefBase = chaineConservee ? `/admin/list?${chaineConservee}` : "/admin/list";

  // Export CSV : toutes les lignes filtrées (pas seulement la page).
  const exportLignes = lignesTriees.map((ligne) => {
    const nom = nomAffiche(ligne);
    return {
      nom,
      email: ligne.email,
      telephone: ligne.telephone || "",
      role: libelleRole(ligne.role),
      etat: ligne.etat,
      facteur:
        ligne.facteurActif === null
          ? "Non configuré"
          : ligne.facteurActif
            ? "Actif"
            : "Remplacé",
      creePar:
        (ligne.creePar ? nomCreateur.get(ligne.creePar) : null) ||
        "Système (bootstrap)",
      creeLe: ligne.createdAt.toLocaleDateString("fr-FR"),
    };
  });

  // Interrupteur d'état : le titulaire ne révoque jamais son propre
  // compte — son identifiant staff est résolu depuis la session.
  const session = await sessionPromise;
  const lignesMoi = session?.user?.id
    ? await db
        .select({ id: comptesStaff.id })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, session.user.id))
        .limit(1)
    : [];
  const moiId = lignesMoi[0]?.id ?? null;

  const cartes = lignes.map((ligne) => {
    const nom = nomAffiche(ligne);
    return {
      id: ligne.id,
      nom,
      email: ligne.email,
      telephone: ligne.telephone,
      role: ligne.role,
      etat: ligne.etat,
      facteurActif: ligne.facteurActif,
      creeParNom:
        (ligne.creePar ? nomCreateur.get(ligne.creePar) : null) ||
        "Système (bootstrap)",
      creeLe: ligne.createdAt,
      estMoi: moiId !== null && ligne.id === moiId,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Équipe d&apos;administration
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {total === 0
            ? "Aucun compte pour le moment."
            : estFiltre
              ? `${lignesTriees.length} sur ${total} compte${total > 1 ? "s" : ""}.`
              : `${total} compte${total > 1 ? "s" : ""}.`}{" "}
          Administrateurs principaux (le distributeur) et techniques
          (diagnostic et déblocage, aucun pouvoir métier). Les agents de
          service ont leur propre liste.
        </p>
      </div>

      <Suspense>
        <BarreOutilsListe exportLignes={exportLignes} />
      </Suspense>

      {lignes.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {estFiltre
              ? "Aucun administrateur ne correspond aux filtres"
              : "Aucun administrateur pour le moment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {estFiltre ? (
              <Link
                href="/admin/list"
                className="underline-offset-4 hover:underline"
              >
                Réinitialiser les filtres
              </Link>
            ) : (
              "Créez le premier compte administrateur principal pour démarrer."
            )}
          </p>
        </div>
      ) : (
        <CartesAdmins cartes={cartes} />
      )}
      <PaginationListe page={page} totalPages={totalPages} hrefBase={hrefBase} />
    </div>
  );
}
