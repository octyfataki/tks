# 11 : Le client retire une pièce refusée

**Status:** resolved

**Sévérité :** basse (confort d'usage — la boucle « refusé → nouveau dépôt »
fonctionne déjà, elle empile juste les documents)

**Portée :** `S1-authentication` — `pieces_identite_clients`,
`src/components/clients/actions.ts`, `src/app/clients/profil/page.tsx`,
`src/components/profil/`.

## Contexte

Ticket 10 : un compte `VALIDE` peut remplacer sa pièce, et le distributeur
la statue. Une fois le refus fait, le client voit le motif et redépose. Mais
chaque refus laisse une pièce refusée dans sa liste : après trois allers-
retours, sa page Profil affiche trois documents rejetés en dessous du
courant. L'historique ne gêne que lui — le distributeur, lui, a besoin de
le garder.

## Décisions

1. Le retrait est **explicite**, client ou distributeur, jamais automatique :
   on ne masque pas un document que quelqu'un a pu regarder.
2. Le client ne retire **que** une pièce `REFUSEE`. Une pièce `EN_ATTENTE`
   disparaît de sa portée : on ne retire pas ce qu'un humain est en train
   de juger, ce serait fui devant la validation.
3. **Aucune suppression.** La pièce passe en `RETIREE`, son fichier reste
   sur le disque, son statut reste lisible sur la fiche distributeur.
   Invariant 10 respecté : retirer ajoute une trace, ça n'efface rien.
4. Le retrait est **journalisé** (`piece.retirer`, qui / quand / quel
   compte / quelle pièce), dans la même transaction que l'écriture.

## Écarts assumés

- `RETIREE` est un quatrième statut, absent de la liste du ticket 10 : il
  décrit un geste que la validation n'a pas, il fallait bien le nommer.
- Comme les autres décisions S1, l'action est **en ligne uniquement**.

## Critères d'acceptation

- [ ] Un client connecté peut retirer **une de ses pièces refusées**, et
      seulement si elle est `REFUSEE`.
- [ ] Le retrait demande confirmation explicite (le geste est définitif
      pour le client : il ne peut pas annuler).
- [ ] La pièce passe `RETIREE`, la ligne et le fichier restent.
- [ ] `piece.retirer` est journalisé ; journal indisponible = rien n'est
      écrit.
- [ ] Le distributeur ne voit **pas** de bouton de retrait : son travail
      est de juger, pas de faire le ménage chez le client.
- [ ] Une pièce `EN_ATTENTE`, `ACCEPTEE` ou `REFUSEE` déjà retirée n'est
      plus retirable.
- [ ] Côté profil client : « Retirée » et la pièce disparaît de la lecture
      courante ; côté fiche distributeur : statut et motif restent lisibles.
- [ ] Tests : règles pures, garde d'éligibilité, refus motivé côté
      formulaire, rendu des trois/quatre états.

## Comments