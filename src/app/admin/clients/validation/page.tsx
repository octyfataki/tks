import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesClients } from "@/lib/db/schema/s1-comptes";

/**
 * /admin/clients/validation — File des comptes clients en attente.
 *
 * S1-01 : triée par ancienneté (les plus anciens d'abord), avec la date
 * d'inscription et les jours d'attente — personne ne reste coincé sans
 * qu'on le voie. La validation et le refus eux-mêmes (pièce obligatoire,
 * journalisation) arrivent en S1-03 : cette page montre la file, elle ne
 * décide encore rien.
 */
export default async function ValidationComptesClientsPage() {
  const lignes = await db
    .select({
      id: comptesClients.id,
      email: comptesClients.email,
      telephone: comptesClients.telephone,
      createdAt: comptesClients.createdAt,
      nom: user.name,
    })
    .from(comptesClients)
    .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
    .where(eq(comptesClients.etat, "EN_ATTENTE_VALIDATION"))
    .orderBy(asc(comptesClients.createdAt));

  // Horloge lue une fois par requête (composant serveur) : stable pendant
  // le rendu, pas de re-rendu imprévisible côté serveur.
  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();
  const attenteJours = (inscritLe: Date) =>
    Math.max(
      0,
      Math.floor((maintenant - inscritLe.getTime()) / (24 * 60 * 60 * 1000)),
    );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès · Comptes clients
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Validation</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Comptes <code>EN_ATTENTE_VALIDATION</code> avec leur ancienneté. Un
          compte non validé ne peut rien faire : ni dossier, ni solde, ni
          commande.{" "}
          {lignes.length === 0
            ? "File vide."
            : `${lignes.length} compte${lignes.length > 1 ? "s" : ""} en attente.`}
        </p>
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">Aucun compte en attente</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Retour à la{" "}
            <Link href="/admin/clients" className="underline underline-offset-4">
              liste des comptes
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
                {attenteJours(ligne.createdAt) === 0
                  ? "aujourd'hui"
                  : `en attente depuis ${attenteJours(ligne.createdAt)} j`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
