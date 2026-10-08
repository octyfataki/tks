import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterrupteurEtat } from "./interrupteur-etat";
import { dateCourte, initiales, libelleRole } from "./affichage-admin";

export type CarteAdmin = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: string;
  etat: string;
  facteurActif: boolean | null;
  creeParNom: string;
  creeLe: Date;
  /** Le titulaire ne révoque jamais son propre compte. */
  estMoi: boolean;
};

/**
 * Grille de cartes des comptes d'administration : nom + email en tête,
 * initiales en logo, badges rôle/état/second facteur, traçabilité, puis
 * « Voir le profil » et l'interrupteur d'état (suspension réversible ou
 * révocation définitive, après confirmation).
 */
export function CartesAdmins({ cartes }: { cartes: CarteAdmin[] }) {
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
              <Badge variant="outline">{libelleRole(carte.role)}</Badge>
              <Badge
                variant={valide ? "secondary" : suspendu ? "default" : "destructive"}
              >
                {carte.etat}
              </Badge>
              {carte.facteurActif === null ? (
                <Badge variant="outline">2FA non configuré</Badge>
              ) : carte.facteurActif ? (
                <Badge variant="secondary">2FA actif</Badge>
              ) : (
                <Badge variant="destructive">2FA remplacé</Badge>
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
                href={`/admin/list/${carte.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Voir le profil
              </Link>
              <InterrupteurEtat
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
