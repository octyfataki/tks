import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesClients } from "@/lib/db/schema/s1-comptes";

const FILTRES_VALIDES = [
  "en-attente",
  "valide",
  "refuse",
  "revoque",
] as const;

type FiltreCompte = (typeof FILTRES_VALIDES)[number];

const ETIQUETTES: Record<FiltreCompte, string> = {
  "en-attente": "En attente",
  valide: "Validés",
  refuse: "Refusés",
  revoque: "Révoqués",
};

const ETAT_PAR_FILTRE: Record<FiltreCompte, string> = {
  "en-attente": "EN_ATTENTE_VALIDATION",
  valide: "VALIDE",
  refuse: "REFUSE",
  revoque: "REVOQUE",
};

/**
 * /admin/clients — Liste des comptes clients (connexions).
 *
 * S1-01 : la table `comptes_clients` existe — on liste les comptes réels,
 * avec leur état. Le dossier financier vit ailleurs (Clients et crédit) :
 * ici on n'affiche aucun solde, aucun nom de dossier.
 */
export default async function ListeComptesClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string }>;
}) {
  const filtres = await searchParams;
  const recherche = (filtres.q ?? "").trim().toLowerCase();
  const filtre = (FILTRES_VALIDES as readonly string[]).includes(
    filtres.filtre ?? "",
  )
    ? (filtres.filtre as FiltreCompte)
    : null;

  const conserve = new URLSearchParams();
  if (recherche) conserve.set("q", filtres.q?.trim() ?? "");
  const lienFiltre = (valeur: FiltreCompte | null) => {
    const parametres = new URLSearchParams(conserve);
    if (valeur) parametres.set("filtre", valeur);
    const chaine = parametres.toString();
    return chaine ? `/admin/clients?${chaine}` : "/admin/clients";
  };

  const lignesBrutes = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      etat: comptesClients.etat,
      createdAt: comptesClients.createdAt,
      nom: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .orderBy(desc(comptesClients.createdAt));

  const lignes = lignesBrutes.filter((ligne) => {
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

  const total = lignesBrutes.length;

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
          Connexions des clients (email + mot de passe, téléphone clé métier).
          États : <code>EN_ATTENTE_VALIDATION</code>, <code>VALIDE</code>,{" "}
          <code>REFUSE</code>, <code>REVOQUE</code>.{" "}
          {total === 0
            ? "Aucun compte pour le moment."
            : `${total} compte${total > 1 ? "s" : ""}.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href={lienFiltre(null)}
          aria-current={filtre === null ? "page" : undefined}
          className="rounded-md border px-2 py-1 underline-offset-4 hover:underline"
        >
          Tous
        </Link>
        {FILTRES_VALIDES.map((valeur) => (
          <Link
            key={valeur}
            href={lienFiltre(valeur)}
            aria-current={filtre === valeur ? "page" : undefined}
            className="rounded-md border px-2 py-1 underline-offset-4 hover:underline"
          >
            {ETIQUETTES[valeur]}
          </Link>
        ))}
        {filtre !== null || recherche !== "" ? (
          <Link
            href="/admin/clients"
            className="px-2 py-1 text-muted-foreground underline underline-offset-4"
          >
            Réinitialiser
          </Link>
        ) : null}
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">
            {filtre !== null || recherche !== ""
              ? "Aucun compte ne correspond aux filtres"
              : "Aucun compte client pour le moment"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            La file des comptes à valider est sur la page{" "}
            <Link href="/admin/clients/validation" className="underline underline-offset-4">
              Validation
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lignes.map((ligne) => (
            <li
              key={ligne.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {ligne.nom?.trim() || ligne.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ligne.email} · {ligne.telephone} · inscrit le{" "}
                  {ligne.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className="rounded-md border px-2 py-1 text-xs font-medium">
                {ligne.etat}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
