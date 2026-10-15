# ADR-0008 : Les tests vivent dans `tests/`, jamais dans `src/`

**Statut** : Accepté
**Date** : 2026-10-14
**Complète** : ADR-0007 (squelette Next.js). Ne modifie aucun ADR métier
(0001 à 0005) ni ADR-0006 (stack technique).
**Contredit** : la phase F de `REORGANISATION-TKS.md`, qui proposait de
re-colocaliser les tests unitaires. Voir §5.

## Contexte

Le dépôt contenait 61 fichiers de tests, répartis dans `src/app/`,
`src/components/` et `src/lib/` — c'est-à-dire **à l'intérieur** du code
livré. Deux défauts en découlaient, et aucun n'était une bonne raison de
les garder là :

- `src/app/` est l'arborescence du routeur Next.js. Quatorze fichiers
  `*.test.tsx` y cohabitaient avec les pages, sans raison.
- Les garde-fous d'architecture (`src/socole/architecture/`) mesurent la
  dette du dépôt. En comptant aussi des tests, ils comptaient des fichiers
  qui ne sont pas du produit : 19 tests vivaient sous `lib/s1-…` et
  `lib/s2-…` et gonflaient la mesure. Le plancher `cheminsNumerotes`
  était de 59 alors que le code de production n'en compte que 40.

## Décision

1. **Aucun fichier de test dans `src/`.** `src/` ne contient que du code
   livré.
2. **`tests/` reproduit l'arborescence de `src/`.** Le chemin dit à lui seul
   ce qui est testé : `tests/components/ui/sidebar.test.tsx` teste
   `src/components/ui/sidebar.tsx`.
3. **Les tests importent le code par l'alias `@/`, jamais par un chemin
   relatif.** Un test n'est plus le voisin de son sujet : il doit le nommer.
4. **La règle est vérifiée par un test**, dans
   `tests/socole/architecture/architecture.test.ts`. Ce n'est pas une
   recommandation : un test déposé dans `src/` fait échouer la suite.

## Alternatives écartées

- **La co-location** — les tests à côté de leur sujet, la convention de
  Vitest, Jest et Testing Library. Son argument est bon : la co-location
  rend difficile d'orpheliner un test. **Il a été écarté quand même**,
  parce que le porteur préfère que `src/` ne contienne que du produit, et
  parce que la mesure de dette y perdait en justesse. Le coût est réel et
  connu : un test est à deux écrans de son sujet au lieu d'être à côté.
- **Une séparation par nature** — tests unitaires colocalisés, tests
  système dans `tests/`. C'était la recommandation avant que la décision ne
  soit prise. Elle a été écartée : une seule règle est plus simple à
  tenir qu'une règle qui dépend de ce qu'on écrit dans le test.

## Conséquences

**Positives**

- `src/` ne contient que du produit. La question « qu'est-ce que je livre ? »
  se lit dans l'arborescence.
- Les 14 tests qui vivaient dans l'arbre de routage en sont sortis.
- **La mesure de dette est enfin juste** : les garde-fous ne comptent plus
  de tests dans leurs totaux. C'est l'argument le plus fort en faveur de
  la décision.
- La règle est mécanique. Impossible d'en revenir sans faire échouer la
  suite, et sans que quelqu'un doive en prendre conscience.

**Négatives**

- Un test n'est plus dans le panneau latéral de l'éditeur quand on modifie
  son sujet. Sur un fichier de 700 lignes comme `components/ui/sidebar.tsx`,
  le test est à un autre endroit du dépôt.
- Un import relatif devient un alias : `@/components/ui/sidebar`. C'est
  plus long à écrire, et ça casse l'auto-complétion de chemin relatif.
- `vitest.config.ts` n'a pas de champ `include` ; il s'appuie sur le motif
  par défaut, qui couvre déjà `tests/`. Toute configuration future de
  `include` devra garder les deux emplacements.

## 5. Conflit avec `REORGANISATION-TKS.md`

Ce document, écrit le même jour à partir de `MAP.md` **sans lecture du
code**, propose en phase F de *déplacer les tests unitaires de `tests/`
vers `src/`*, c'est-à-dire de faire exactement l'inverse.

La règle du document lui-même tranche : « Si le dépôt contredit ce
document, le dépôt a raison. » Ici, c'est une décision du porteur,
prise explicitement, qui prime sur une recommandation de ce document.
**La phase F est annulée.**

## 6. Les deux seules traces admises

`src/modules/clients/dossier.test.ts` et
`src/modules/clients/table-structure.test.ts` sont les seuls fichiers de
test tolérés dans `src/`. Ils viennent d'un chantier parallèle et doivent
partir en allant dans `tests/modules/clients/`.

Si un jour cette liste doit être vide, c'est que la décision a été
renversée — et alors cet ADR est la première chose à réécrire.
