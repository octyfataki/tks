import type { ReactNode } from "react";

/**
 * Encart d'écran à venir dans l'espace agent. La page existe et la
 * navigation y mène, mais la fonction métier arrive avec sa spec (S4 à
 * S6) : l'encart dit quoi, et ce qui viendra. Aucune action métier, aucun
 * appel réseau, aucune lecture BDD — affichage seul.
 *
 * Vocabulaire : GLOSSARY (dossier client, commande, preuve de paiement,
 * paiement, créance — jamais shop, vente, réalisation, facture).
 */
export function AgentBientot({
  icone,
  titre,
  texte,
  suite,
}: {
  icone: ReactNode;
  titre: string;
  texte: string;
  /** Ce qui viendra, et avec quelle spec. */
  suite: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          {icone}
        </span>
        <h1 className="mt-4 text-base font-semibold tracking-tight">{titre}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {texte}
        </p>
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {suite}
        </p>
      </div>
    </div>
  );
}
