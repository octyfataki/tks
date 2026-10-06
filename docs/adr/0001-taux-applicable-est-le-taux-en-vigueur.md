# ADR-0001 : Le taux applicable est le taux en vigueur, et ne concerne que les montants en USD

**Statut** : Accepté
**Date** : 2026-10-06
**Dépend de** : ADR-0002
**Remplace** : une version antérieure de cet ADR, intitulée « Le taux de change est
figé au moment du paiement », qui décrivait deux choses incompatibles et a été
abandonnée.

## Contexte

Le distributeur négocie le taux `1 USD = X CDF` et le saisit manuellement, une
fois par jour. Une créance et un paiement portent chacun **une seule devise**.

La question est : quand on additionne des francs et des dollars pour obtenir un
reste à payer, **quel taux** employer ?

Deux réponses étaient envisagées :

- **Taux figé** — le taux est capturé à l'écriture et stocké avec elle. Une dette
  ne change jamais de valeur.
- **Taux en vigueur** — rien n'est stocké, tout est reconverti au taux du jour à
  chaque consultation.

La première version de cet ADR exposait un troisième cas, hybride : le paiement
imputé à son taux d'origine, la créance valorisée au taux du jour. **Ce cas est
abandonné** : il ne définit pas quel chiffre est celui qu'on réclame au client, et
ne peut donc pas servir de base à une logique de recouvrement.

## Décision

**Le taux applicable est le taux en vigueur au moment de la consultation. Il ne
concerne que les montants libellés en USD.**

En trois règles :

1. **Aucun taux n'est stocké sur une écriture.** Une créance porte un montant et
   une devise. Un paiement porte un montant et une devise. Pas de troisième champ.
2. **Une créance ou un paiement en CDF ne bouge jamais.** Sa valeur est son
   montant. Aucun taux n'intervient.
3. **Une créance ou un paiement en USD vaut, en CDF, le montant converti au taux
   en vigueur** au moment où on le regarde.

Autrement dit : **le taux n'a de prise que sur ce qui est libellé en dollars.**

### La conséquence opérationnelle qui en découle

Une dette en dollars **ne peut pas être durablement soldée en francs**.

- Un client qui doit 100 USD et paie 230 000 FC le 5 janvier, taux 2 300, est à
  zéro ce jour-là.
- Le 10 janvier, taux passé à 2 400, sa créance vaut 240 000 FC : il doit
  10 000 FC. Il n'a rien fait depuis, et personne ne l'en a informé.
- **La seule façon de clore une dette en USD définitivement est de la payer en
  USD.** Un paiement en dollars solde les dollars ; les deux bougent ensemble et
  le solde reste à zéro. Un paiement en francs ne règle que la position à la date
  du paiement, et repart dès le lendemain.

Ce n'est pas un défaut du modèle, c'est la conséquence directe d'une dette
libellée en dollars. Mais il doit être dit au client, parce qu'il change ce qu'on
peut promettre à un client : « vous êtes à jour **à ce jour** », et non « vous
êtes réglé ».

## Conséquences

**Positives**

- **Modèle simple.** Pas de champ taux sur les écritures, pas de taux d'origine à
  retrouver, pas de reconstruction lors d'un import ou d'une reprise de données.
  Une écriture contient exactement deux choses : un montant et une devise.
- **Le total en USD d'un client est une simple somme.** Aucune conversion
  n'intervient pour savoir combien de dollars il a dus ou payé.
- **Une dette en francs est une vraie dette en francs**, qui ne bougera jamais.
  C'est rassurant, et c'est le cas le plus courant d'un remboursement.
- **Cela décrit la réalité du métier** : il n'y a pas de contrat en francs, il y
  a un montant en dollars.

**Négatives**

- **Un client dont la dette est en USD ne peut jamais être durablement à jour.**
  Le reste à payer bouge avec le taux, sans action de sa part. Toute
  conversation sur « il est en retard » doit donc être datée et mentionner le
  taux utilisé.
- **La seule extinction définitive d'une dette en USD passe par un paiement en
  USD.** C'est une contrainte réelle pour un client qui n'a que des francs.
- **Toute saisie de taux a un effet rétroactif immédiat** sur la valeur de toutes
  les dettes en USD du portefeuille. Une faute de frappe sur le taux se corrige
  en resaisiant le taux du jour, mais l'erreur a été visible et a pu être
  facturée entre-temps. Le taux du jour doit donc être **vérifié avant tout
  encaissement** qui convertit un dollar.
- **Le taux doit rester stable sur la journée**, sinon deux encaissements du même
  client à la même heure donnent deux restes différents, et l'un des deux clients
  se plaint.
- **La position du distributeur en USD n'est pas figée non plus.** Sa trésorerie
  convertie vaut davantage ou moins selon le jour. C'est cohérent, mais ça veut
  dire que le solde global affiché est une photographie, pas une référence.

## Ce que l'interface doit afficher

Ces trois règles ne sont pas des finitions. Elles sont la lisibilité du modèle :

- **La date du taux à côté de tout montant converti.** « 100 USD ≈ 240 000 FC au
  taux du 10 janvier (2 400) ». Sans la date, le client compare avec le taux
  qu'il a entendu ailleurs et conteste un chiffre qui est juste.
- **Le montant natif en premier.** Un client qui doit 100 USD doit d'abord lire
  « 100 USD », et ensuite son équivalent en francs. L'inverse — afficher
  240 000 FC en premier — fait croire à une dette en francs, qui ne bougera pas,
  alors qu'elle bougera demain.
- **Le taux en vigueur est un taux de journée.** L'administrateur en saisit un
  pour la journée ; tout le reste s'y réfère. Un rapport portant sur une période
  passée se lit au taux de cette période, sinon il est faux.

## Point de vigilance

La question « ce client est-il en retard ? » n'a pas de réponse absolue : elle a
une réponse **à une date, à un taux**. Toute vue de retard, tout tableau de bord
de portefeuille et toute alerte de plafond doivent donc afficher le taux et la
date utilisés. Ce n'est pas un détail d'affichage : sans cela, deux personnes qui
regardent le même tableau le lendemain voient des chiffres différents, et aucune
des deux n'a tort.