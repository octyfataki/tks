import Link from "next/link";
import { Suspense } from "react";
import { desc, eq, inArray } from "drizzle-orm";
import { EyeIcon } from "lucide-react";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  facteurs2faAdmin,
} from "@/lib/db/schema/s1-comptes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarreOutilsListe } from "./barre-outils";
import { PaginationListe } from "./pagination-liste";

const LIBELLE_ROLE: Record<string, string> = {
  ADMIN_PRINCIPAL: "Administrateur principal",
  ADMIN_TECHNIQUE: "Administrateur technique",
};

function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join("");
  return lettres || "AD";
}

function dateCourte(valeur: Date): string {
  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const FILTRES_VALIDES = [
  "principal",
  "technique",
  "valide",
  "revoque",
  "sans-2fa",
] as const;
const TRIS_VALIDES = ["anciens", "nom-az", "nom-za"] as const;

/** Lignes par page du tableau. */
const LIGNES_PAR_PAGE = 10;

/**
 * /admin/list — Liste des comptes d'administration : administrateurs
 * principaux (le distributeur) et administrateurs techniques (diagnostic
 * et déblocage, aucun pouvoir métier). Les agents de service ont leur
 * propre liste. Lecture seule : le rôle est immuable (S2 : révocation +
 * recréation), l'état ne connaît que VALIDE et REVOQUE.
 *
 * Filtrage (?q=, ?du=, ?au=, ?role=, ?etat=, ?facteur=) appliqué côté
 * serveur sur les lignes lues — le volume d'administrateurs reste
 * dérisoire, une seule lecture suffit.
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
  // Drizzle en never[].
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

  const lignesFiltrees = lignesBrutes.filter((ligne) => {
    if (filtreDemande === "principal" && ligne.role !== "ADMIN_PRINCIPAL")
      return false;
    if (filtreDemande === "technique" && ligne.role !== "ADMIN_TECHNIQUE")
      return false;
    if (filtreDemande === "valide" && ligne.etat !== "VALIDE") return false;
    if (filtreDemande === "revoque" && ligne.etat !== "REVOQUE") return false;
    if (filtreDemande === "sans-2fa" && ligne.facteurActif !== null)
      return false;
    if (recherche) {
      const nom = (ligne.nom?.trim() || ligne.email).toLowerCase();
      const telephone = (ligne.telephone || "").toLowerCase();
      if (
        !nom.includes(recherche) &&
        !ligne.email.toLowerCase().includes(recherche) &&
        !telephone.includes(recherche)
      )
        return false;
    }
    return true;
  });

  const nomAffiche = (ligne: (typeof lignesBrutes)[number]) =>
    ligne.nom?.trim() || ligne.email.split("@")[0] || "Administrateur";
  const lignesTriees = [...lignesFiltrees].sort((a, b) => {
    if (triDemande === "anciens")
      return a.createdAt.getTime() - b.createdAt.getTime();
    if (triDemande === "nom-az")
      return nomAffiche(a).localeCompare(nomAffiche(b), "fr");
    if (triDemande === "nom-za")
      return nomAffiche(b).localeCompare(nomAffiche(a), "fr");
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const total = lignesBrutes.length;

  // Pagination (?page=) sur les lignes filtrées et triées : page
  // validée puis bornée, hrefBase reconstruit sans ?page=.
  const totalPages = Math.max(1, Math.ceil(lignesTriees.length / LIGNES_PAR_PAGE));
  const pageDemandee = Math.floor(Number(filtres.page));
  const page =
    Number.isFinite(pageDemandee) && pageDemandee >= 1
      ? Math.min(pageDemandee, totalPages)
      : 1;
  const lignes = lignesTriees.slice(
    (page - 1) * LIGNES_PAR_PAGE,
    page * LIGNES_PAR_PAGE,
  );
  const conserves = new URLSearchParams();
  if (recherche) conserves.set("q", filtres.q?.trim() ?? "");
  if (filtreDemande) conserves.set("filtre", filtreDemande);
  if (triDemande) conserves.set("tri", triDemande);
  const chaineConservee = conserves.toString();
  const hrefBase = chaineConservee ? `/admin/list?${chaineConservee}` : "/admin/list";

  // Export CSV : toutes les lignes filtrées (pas seulement la page).
  const exportLignes = lignesTriees.map((ligne) => {
    const nom =
      ligne.nom?.trim() || ligne.email.split("@")[0] || "Administrateur";
    return {
      nom,
      email: ligne.email,
      telephone: ligne.telephone || "",
      role: LIBELLE_ROLE[ligne.role] ?? ligne.role,
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
                Tout effacer
              </Link>
            ) : (
              "Créez le premier compte administrateur principal pour démarrer."
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-200 text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Administrateur
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Téléphone
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Rôle
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  État
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Second facteur
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Créé par
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Créé le
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => {
                const nom =
                  ligne.nom?.trim() ||
                  ligne.email.split("@")[0] ||
                  "Administrateur";
                const createur =
                  (ligne.creePar ? nomCreateur.get(ligne.creePar) : null) ||
                  "Système (bootstrap)";
                return (
                  <tr
                    key={ligne.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                        >
                          {initiales(nom)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{nom}</p>
                          <p className="truncate text-muted-foreground">
                            {ligne.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {ligne.telephone || "—"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Badge variant="outline">
                        {LIBELLE_ROLE[ligne.role] ?? ligne.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Badge
                        variant={
                          ligne.etat === "VALIDE" ? "secondary" : "destructive"
                        }
                      >
                        {ligne.etat}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {ligne.facteurActif === null ? (
                        <Badge variant="outline">Non configuré</Badge>
                      ) : ligne.facteurActif ? (
                        <Badge variant="secondary">Actif</Badge>
                      ) : (
                        <Badge variant="destructive">Remplacé</Badge>
                      )}
                    </td>
                    <td className="max-w-44 truncate px-4 py-2.5 text-muted-foreground">
                      {createur}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {dateCourte(ligne.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/admin/list/${ligne.id}`} />}
                        aria-label={`Voir le profil de ${nom}`}
                      >
                        <EyeIcon />
                        Voir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PaginationListe page={page} totalPages={totalPages} hrefBase={hrefBase} />
    </div>
  );
}
