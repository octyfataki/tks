# ADR-0002 : CDF pivot, USD devise de saisie

**Statut** : Accepté
**Date** : 2026-10-06

## Contexte

Le prototype Excel portait, sur chaque écriture financière, **deux colonnes** en
double : `Montant dette CDF` et `Montant dette USD`. Aucun taux de change
n'existait dans le classeur. Le résultat était que la formule de synthèse
`Reste à payer = detteCDF + detteUSD − paiement` **additionnait des francs et des
dollars**. La colonne était fausse.

Deux questions se posaient : une créance porte-t-elle un montant ou deux, et dans
quelle devise l'affichage se fait-il ?

## Décision

1. **CDF est la devise pivot.** Tout affichage destined à un humain se fait en
   CDF. Une dette de 100 USD s'affiche « 100 USD ≈ 230 000 FC au taux du jour ».
2. **Chaque écriture porte exactement une devise.** Une **créance** a un montant
   et une devise (`USD` ou `CDF`). Un **paiement** a un montant et une devise.
3. **Les colonnes en double disparaissent.** `Montant dette CDF` /
   `Montant dette USD` ne sont pas conservées sous une forme dégradée.
4. **Un client peut payer en CDF une créance libellée en USD.** C'est le cas
   d'usage principal : « 6 $ c'est plus simple » — le client règle en francs au
   taux du jour.

## Conséquences

**Positives**

- Le bug de la formule de synthèse devient structurellement impossible : on ne
  peut plus additionner deux devises dans une seule ligne.
- La conversion est un calcul dérivé, donc toujours reproductible et affichable.
- Un paiement en francs sur une dette en dollars devient un cas normal au lieu
  d'être une astuce.

**Négatives**

- Chaque écriture doit porter sa devise explicitement. Un oubli est un bug de
  type, pas de valeur : il faut la rendre impossible par le schéma.
- La conversion en CDF est nécessaire partout où l'on agrège. C'est un coût de
  calcul assumé.
- Le total en CDF d'un portefeuille n'est **pas** une réalité comptable, c'est
  une conversion au taux du jour. L'interface doit le dire.

## Hors périmètre

Une troisième devise n'est pas prévue. Si le client gère un jour du Rwanda ou du
Burundi, cette décision s'applique à un niveau supérieur (une table de devises
et de taux, au lieu d'une paire).
