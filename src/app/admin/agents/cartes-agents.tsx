import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterrupteurAgent } from "./interrupteur-agent";
import { dateCourte, initiales } from "../list/affichage-admin";

export type CarteAgent = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  etat: string;
  nbPermissions: number;
  creeParNom: string;
  creeLe: Date;
  estMoi: boolean;
};

/**
 * Grille de cartes des agents de service : nom + email en tête, badges
 * état/permissions, traçabilité, puis « Voir la fiche » et l'interrupteur
 * d'état (suspension réversible ou révocation définitive, après
 * confirmation).
 */
export function CartesAgents({ cartes }: { cartes: CarteAgent[] }) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cartes.map((carte) => {
        const valide = carte.etat === "VALIDE";
        const suspendu = carte.etat === "SUSPENDU";
        return (
          <article
            key={carte.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium">{carte.nom}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {carte.email}
                  {carte.telephone ? ` · ${carte.telephone}` : null}
                </p>
              </div>
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary"
              >
                {initiales(carte.nom)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">Agent de service</Badge>
              <Badge variant={valide ? "secondary" : suspendu ? "default" : "destructive"}>
                {carte.etat}
              </Badge>
              {carte.nbPermissions === 0 ? (
                <Badge variant="outline">Sans permission</Badge>
              ) : (
                <Badge variant="secondary">
                  {carte.nbPermissions} permission{carte.nbPermissions > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Créé par {carte.creeParNom} · le {dateCourte(carte.creeLe)}.
              {valide
                ? " Le rôle est immuable (S2)."
                : suspendu
                  ? " Suspendu : connexion refusée, levée possible."
                  : " Révoqué définitivement."}
            </p>

            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
              <Link
                href={`/admin/agents/${carte.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Voir la fiche
              </Link>
              <InterrupteurAgent
                id={carte.id}
                nom={carte.nom}
                etat={suspendu ? "SUSPENDU" : valide ? "VALIDE" : "REVOQUE"}
                desactive={carte.estMoi}
                motifDesactive="Vous ne pouvez pas suspendre ni révoquer votre propre compte."
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
