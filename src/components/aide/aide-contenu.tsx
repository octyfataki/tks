import { WifiOff } from "lucide-react";
import { AideExplorer } from "@/components/aide/aide-explorer";
import { Separator } from "@/components/ui/separator";
import { AIDE_SECTIONS, type AideNiveau } from "@/lib/aide-content";

/**
 * Contenu commun de la page d'aide : hero, annuaire, mémos.
 * Synchrone et sans session : testable tel quel. `niveau` verrouille
 * l'annuaire sur un seul niveau (pages d'aide des espaces) ; absent,
 * les trois niveaux s'affichent avec le filtre.
 */
export function AideContenu({ niveau }: { niveau?: AideNiveau }) {
  return (
    <>
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          TKS · crédit airtime en RDC
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Perdu ? Trouvez le raccourci
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aide Client, Aide Agent, Aide Admin : chaque rubrique ne liste que
          les pages de son niveau qui existent. Le reste est marqué
          « Bientôt », sans lien mort. Astuce clavier : Ctrl+K ouvre la
          palette de recherche partout dans l’app.
        </p>
      </div>

      <AideExplorer sections={AIDE_SECTIONS} niveauFixe={niveau} />

      <Separator />

      <section
        id="memo"
        aria-labelledby="memo-titre"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-5">
          <h2 id="memo-titre" className="text-base font-semibold">
            Mémo : les mots justes
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Dire « client » et jamais « shop », « commande » et jamais
            « réalisation », « preuve de paiement » et jamais « facture » :
            c’est ainsi qu’on ne mélange ni les dettes ni les dossiers.
            « Virtuel », « e-money », « objectif airtime » : n’existent pas
            ici.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-base font-semibold">
            Mémo : le calcul (normatif)
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF.
            Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF.{" "}
            <strong className="font-semibold text-foreground">
              Reste à payer : 65 000 CDF.
            </strong>
          </p>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <WifiOff aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              Sans réseau, l’app continue : écritures en file d’attente,
              synchronisation sans doublon au retour.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
