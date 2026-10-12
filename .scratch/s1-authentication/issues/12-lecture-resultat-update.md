# 12 : Une seule lecture du résultat d'un UPDATE mysql2

**Status:** resolved

**Sévérité :** basse (aucun bug en production — c'est une dette et un piège
qui a déjà coûté une fonctionnalité entière, cf. ticket 10)

**Portée :** `S1-authentication` — `src/lib/s1-comptes/resultat-mysql.ts`,
`src/lib/s1-comptes/staff.ts`.

## Contexte

Sous mysql2, `db.update(...).set(...).where(...)` ne renvoie pas l'en-tête
SQL mais le tableau `[ResultSetHeader, FieldPacket[]]`. Lire `affectedRows`
à la racine donne `undefined` — donc « zéro ligne écrite » — donc un refus
à tort.

Le dépôt paie deux fois ce piège :

- `src/lib/s1-comptes/staff.ts:1127-1133` porte le commentaire
  *« mysql2 renvoie [ResultSetHeader, ...] : affectedRows vit en [0] »* et
  contourne le problème **en ligne**, dans la fonction ;
- le ticket 10 a réécrit le même contournement ailleurs, en oubliant le
  premier. La fonctionnalité a alors échoué à chaque tentative pendant une
  session entière, sans que la suite de tests ne le voie.

`lignesEcrites()` existe désormais dans `resultat-mysql.ts`. Reste à
l'appliquer là où le contournement est écrit à la main.

## Décisions

1. **`lignesEcrites()` devient l'unique lecture** du résultat d'un UPDATE.
   La fonction en ligne de `staff.ts` disparaît au profit de l'appel.
2. **Aucune autre réécriture** du même motif dans le dépôt.

## Critères d'acceptation

- [ ] `staff.ts` appelle `lignesEcrites()` ; plus aucune lecture directe
      de `affectedRows` dans le code applicatif.
- [ ] Le comportement est identique : une ligne non écrite lève toujours
      `StaffError("NON_AUTORISE", …)`.
- [ ] `grep affectedRows src/` ne renvoie que le module canonique et ses
      tests.
- [ ] Tests existants verts, aucun test supprimé.

## Comments