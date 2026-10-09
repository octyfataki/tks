// Type résultat unique des server actions : succès (charge utile typée
// en paramètre) ou échec avec libellé français affichable tel quel.
// Toute nouvelle action l'utilise ; les types locaux existants en
// dérivent sous leur nom historique (zéro changement côté formulaires).

export type EchecAction = { ok: false; erreur: string };

export type ResultatAction<T extends object = object> =
  | ({ ok: true } & T)
  | EchecAction;
