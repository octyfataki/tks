import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRightIcon } from "lucide-react";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { nomAffiche } from "@/components/clients/affichage-partage";
import { PaginationListe } from "../list/pagination-liste";
import { BarreOutilsClients } from "@/components/clients/barre-outils-clients";
import { RegistreComptesClients } from "@/components/clients/registre-comptes-clients";
import { joursAttente } from "@/components/clients/affichage-client";

const FILTRES_VALIDES = [
  "en-attente",
  "valide",
  "refuse",
  "revoque",
] as const;
const TRIS_VALIDES = ["anciens", "nom-az"] as const;

/** Lignes par page du registre. */
const LIGNES_PAR_PAGE = 10;

type FiltreCompte = (typeof FILTRES_VALIDES)[number];

const ETAT_PAR_FILTRE: Record<FiltreCompte, string> = {
  "en-attente": "EN_ATTENTE_VALIDATION",
  valide: "VALIDE",
  refuse: "REFUSE",
  revoque: "REVOQUE",
};

/**
 * /admin/clients — Registre des comptes clients (connexions).
 *
 * Un compte est une connexion (email + téléphone, le téléphone est la
 * clé). Le dossier financier vit ailleurs : ici aucun solde, aucune
 * dette, aucun plafond. Le bandeau de tête rappelle la file des comptes
 * en attente — un compte non validé ne peut rien faire.
 */
export default async function ListeComptesClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const filtres = await searchParams;
  const recherche = (filtres.q ?? "").trim().toLowerCase();
  const filtre = (FILTRES_VALIDES as readonly string[]).includes(
    filtres.filtre ?? "",
  )
    ? (filtres.filtre as FiltreCompte)
    : null;
  const tri = (TRIS_VALIDES as readonly string[]).includes(filtres.tri ?? "")
    ? (filtres.tri as (typeof TRIS_VALIDES)[number])
    : null;
  const estFiltre = recherche !== "" || filtre !== null;

  const lignesBrutes = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      etat: comptesClients.etat,
      createdAt: comptesClients.createdAt,
      valideLe: comptesClients.valideLe,
      refuseMotif: comptesClients.refuseMotif,
      nom: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .orderBy(desc(comptesClients.createdAt));

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();

  const enAttente = lignesBrutes.filter(
    (ligne) => ligne.etat === "EN_ATTENTE_VALIDATION",
  );
  const plusAncien = Math.max(
    0,
    ...enAttente.map((ligne) => joursAttente(ligne.createdAt, maintenant)),
  );

  const lignesFiltrees = lignesBrutes.filter((ligne) => {
    if (filtre !== null && ligne.etat !== ETAT_PAR_FILTRE[filtre]) return false;
    if (recherche) {
      const nom = (ligne.nom?.trim() || ligne.email).toLowerCase();
      if (
        !nom.includes(recherche) &&
        !ligne.email.toLowerCase().includes(recherche) &&
        !ligne.telephone.toLowerCase().includes(recherche)
      )
        return false;
    }
    return true;
  });

  const lignesTriees = [...lignesFiltrees].sort((a, b) => {
    if (tri === "anciens") return a.createdAt.getTime() - b.createdAt.getTime();
    if (tri === "nom-az")
      return nomAffiche(a).localeCompare(nomAffiche(b), "fr");
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = lignesBrutes.length;
  const totalPages = Math.max(
    1,
    Math.ceil(lignesTriees.length / LIGNES_PAR_PAGE),
  );
  const pageDemandee = Math.floor(Number(filtres.page));
  const page =
    Number.isFinite(pageDemandee) && pageDemandee >= 1
      ? Math.min(pageDemandee, totalPages)
      : 1;
  const conserves = new URLSearchParams();
  if (recherche) conserves.set("q", filtres.q?.trim() ?? "");
  if (filtre) conserves.set("filtre", filtre);
  if (tri) conserves.set("tri", tri);
  const chaineConservee = conserves.toString();
  const hrefBase = chaineConservee
    ? `/admin/clients?${chaineConservee}`
    : "/admin/clients";

  const exportLignes = lignesTriees.map((ligne) => ({
    nom: nomAffiche(ligne),
    email: ligne.email,
    telephone: ligne.telephone,
    etat: ligne.etat,
    inscritLe: ligne.createdAt.toLocaleDateString("fr-FR"),
    attenteJours:
      ligne.etat === "EN_ATTENTE_VALIDATION"
        ? String(joursAttente(ligne.createdAt, maintenant))
        : "—",
    valideLe: ligne.valideLe
      ? ligne.valideLe.toLocaleDateString("fr-FR")
      : "—",
    motifRefus: ligne.refuseMotif ?? "—",
  }));

  const lignes = lignesTriees
    .slice((page - 1) * LIGNES_PAR_PAGE, page * LIGNES_PAR_PAGE)
    .map((ligne) => ({
      id: ligne.id,
      nom: ligne.nom,
      email: ligne.email,
      telephone: ligne.telephone,
      etat: ligne.etat,
      inscritLe: ligne.createdAt,
      valideLe: ligne.valideLe,
      refuseMotif: ligne.refuseMotif,
    }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Comptes clients
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {total === 0
            ? "Aucun compte pour le moment."
            : estFiltre
              ? `${lignesTriees.length} sur ${total} compte${total > 1 ? "s" : ""}.`
              : `${total} compte${total > 1 ? "s" : ""}.`}{" "}
          Une connexion par ligne : le téléphone est la clé du compte. Le
          dossier financier vit ailleurs — ici aucun solde.
        </p>
      </div>

      {enAttente.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
          />
          <span>File de validation vide — aucun compte bloqué.</span>
          <Link
            href="/admin/clients/validation"
            className="ml-auto inline-flex items-center rounded-full border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Voir la file
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-card px-3 py-2 text-xs">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-amber-600"
          />
          <span className="font-medium">
            {enAttente.length} compte{enAttente.length > 1 ? "s" : ""} en
            attente
          </span>
          <span className="text-muted-foreground">
            — plus ancien{" "}
            {plusAncien === 0
              ? "arrivé aujourd'hui"
              : plusAncien === 1
                ? "arrivé hier"
                : `en attente depuis ${plusAncien} jours`}{" "}
            · pièce d&apos;identité exigée.
          </span>
          {/* Ticket de guichet : le libellé d'un côté, le numéro de la
              file de l'autre, séparés par un pointillé perforé. Le compteur
              quitte le texte et devient le numéro du ticket. */}
          <Link
            href="/admin/clients/validation"
            aria-label={`Ouvrir la file de validation, ${enAttente.length} compte${enAttente.length > 1 ? "s" : ""} en attente`}
            className="group ml-auto inline-flex items-center overflow-hidden rounded-full border border-primary/50 bg-transparent text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="py-1.5 pr-2 pl-3.5 text-xs font-medium">
              Ouvrir la file
            </span>
            <span
              aria-hidden
              className="h-4 w-px border-l border-dashed border-primary/40"
            />
            <span className="flex items-center gap-1 py-1.5 pr-3 pl-2 text-xs font-semibold tabular-nums">
              {enAttente.length}
              <ArrowUpRightIcon className="size-3.5 transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px" />
            </span>
          </Link>
        </div>
      )}

      <Suspense>
        <BarreOutilsClients exportLignes={exportLignes} />
      </Suspense>

      {lignes.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {estFiltre
              ? "Aucun compte ne correspond aux filtres"
              : "Aucun compte client pour le moment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {estFiltre ? (
              <Link
                href="/admin/clients"
                className="underline-offset-4 hover:underline"
              >
                Réinitialiser les filtres
              </Link>
            ) : (
              "Les inscriptions des clients apparaîtront ici dès leur première connexion."
            )}
          </p>
        </div>
      ) : (
        <RegistreComptesClients
          lignes={lignes}
          maintenant={maintenant}
          page={page}
          totalPages={totalPages}
        />
      )}
      <PaginationListe page={page} totalPages={totalPages} hrefBase={hrefBase} />
    </div>
  );
}
