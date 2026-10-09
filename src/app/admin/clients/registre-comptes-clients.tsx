"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { Cachet } from "../invitations/cachet";
import { cn } from "@/lib/utils";
import { dateCourte, nomAffiche } from "../list/affichage-admin";
import { joursAttente, texteAttente, detailAttente } from "./affichage-client";

export type LigneCompteClient = {
  id: string;
  nom: string | null;
  email: string;
  telephone: string;
  etat: string;
  inscritLe: Date;
  valideLe: Date | null;
  refuseMotif: string | null;
};

function cachetEtat(etat: string): {
  encre: "attente" | "fait" | "expire" | "revoque";
  libelle: string;
} {
  if (etat === "VALIDE") return { encre: "fait", libelle: "Validé" };
  if (etat === "REFUSE") return { encre: "expire", libelle: "Refusé" };
  if (etat === "REVOQUE") return { encre: "revoque", libelle: "Révoqué" };
  return { encre: "attente", libelle: "En attente" };
}

/**
 * Tableau des comptes clients, même dessin que le registre des invitations
 * agents : lignes dépliables, Cachet tamponné par état, chiffres en
 * tabulaires. Une ligne = une connexion (téléphone = clé du compte).
 * Aucune colonne d'argent : ni solde, ni dette, ni plafond, ni devise —
 * le dossier financier vit ailleurs (S4, tables inexistantes à ce jour).
 */
export function RegistreComptesClients({
  lignes,
  maintenant,
  page,
  totalPages,
}: {
  lignes: LigneCompteClient[];
  maintenant: number;
  page: number;
  totalPages: number;
}) {
  const [depliees, setDepliees] = React.useState<ReadonlySet<string>>(
    new Set(),
  );

  function basculer(id: string) {
    setDepliees((precedentes) => {
      const suivantes = new Set(precedentes);
      if (suivantes.has(id)) suivantes.delete(id);
      else suivantes.add(id);
      return suivantes;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Comptes clients, page {page} sur {totalPages}
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th scope="col" className="w-8 px-2 py-2.5">
              <span className="sr-only">Détail</span>
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Compte
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              État
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Inscrit le
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Attente
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">
              Validé le
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">
              Téléphone
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lignes.map((ligne) => {
            const depliee = depliees.has(ligne.id);
            const nom = nomAffiche({ nom: ligne.nom, email: ligne.email });
            const cachet = cachetEtat(ligne.etat);
            const enAttente = ligne.etat === "EN_ATTENTE_VALIDATION";
            const attente = joursAttente(ligne.inscritLe, maintenant);
            return (
              <React.Fragment key={ligne.id}>
                <tr className="transition-colors hover:bg-muted/30">
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => basculer(ligne.id)}
                      aria-expanded={depliee}
                      aria-label={
                        depliee ? "Replier le détail" : "Déplier le détail"
                      }
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRightIcon
                        className={cn(
                          "size-4 transition-transform",
                          depliee && "rotate-90",
                        )}
                      />
                    </button>
                  </td>
                  <td className="max-w-60 px-3 py-2.5">
                    <span className="block truncate font-medium">{nom}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {ligne.email}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Cachet encre={cachet.encre}>{cachet.libelle}</Cachet>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    {dateCourte(ligne.inscritLe)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 whitespace-nowrap tabular-nums",
                      enAttente && attente >= 7
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {enAttente ? texteAttente(ligne.inscritLe, maintenant) : "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">
                    {ligne.valideLe ? dateCourte(ligne.valideLe) : "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums lg:table-cell">
                    {ligne.telephone}
                  </td>
                </tr>
                {depliee ? (
                  <tr className="bg-muted/30">
                    <td />
                    <td colSpan={6} className="px-3 py-3">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Téléphone (clé du compte)
                          </dt>
                          <dd className="mt-0.5 font-medium tabular-nums">
                            {ligne.telephone}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Email
                          </dt>
                          <dd className="mt-0.5 truncate">{ligne.email}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Inscrit le
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {dateCourte(ligne.inscritLe)}
                            {enAttente
                              ? ` · ${detailAttente(ligne.inscritLe, maintenant)}`
                              : null}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Validé le
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {ligne.valideLe ? dateCourte(ligne.valideLe) : "—"}
                          </dd>
                        </div>
                        {ligne.refuseMotif ? (
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] text-muted-foreground">
                              Motif du refus
                            </dt>
                            <dd className="mt-0.5">{ligne.refuseMotif}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
