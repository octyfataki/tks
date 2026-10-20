# ADR-0003 : Le taux en vigueur est le dernier taux saisi, et il survit aux jours

**Statut** : Accepté
**Date** : 2026-10-20
**Dépend de** : ADR-0001, ADR-0002
**Modifie** : la phrase « le taux en vigueur est un taux de journée » d'ADR-0001. Le reste d'ADR-0001 — aucun taux stocké sur une écriture, la prise sur l'USD seule, la conversion à la consultation — n'est pas touché.

## Contexte

ADR-0001 a posé que le taux applicable est le taux **en vigueur au moment de la consultation**, et que la saisie est manuelle et négociée. L'implémentation en avait tiré une règle de plus que décide : « un jour civil porte au plus un taux ». La table était indexée sur `jour`, une seconde saisie au même jour était refusée (`DEJA_DEFINI`), et un jour sans saisie n'avait **aucun taux** — bloquant toute conversion en USD, alors que le marché n'avait parfois pas bougé.

Trois frictions réelles sont apparues :

1. **Le jour sans saisie** : si l'administrateur ne saisit pas le taux du jour, rien ne se convertit pendant toute la journée.
2. **Le changement intra-journier** : quand le taux négocié bouge en cours de journée (revente, hausse de la distribution), l'administrateur ne peut pas le remettre à jour — le distributeur absorbe l'écart.
3. **La contradiction ADR ↔ code** : ADR-0001 dit qu'une faute de frappe se corrige en ressaisissant le taux du jour ; le code refusait toute seconde saisie.

## Décision

**Le taux en vigueur est la saisie la plus récente, ordonnée à la suite. Il survit d'un jour à l'autre.**

1. **Le taux est une séquence, pas un paramètre daté.** Chaque saisie est un engagement append-only, numéroté (`numero` de séquence tracé dans la base), journalisé. L'ordre du numéro fait foi, pas le jour civil ni l'horodatage de l'appareil.
2. **Le taux en vigueur est le dernier numéro.** Tant qu'aucune nouvelle saisie n'arrive, il reste en vigueur — y compris sur les jours suivants. Un jour sans saisie n'est plus un jour sans taux : le taux continue de faire foi.
3. **Une nouvelle saisie prend le relais, elle n'écrase rien.** La valeur antérieure reste consultable dans l'historique, avec saisi par qui, et quand.
4. **Ressaisir la valeur déjà en vigueur est refusé doucement** : le taux en vigueur est déjà celui-là, rien ne change, rien n'est écrit.
5. **Un changement d'écart marquant exige une confirmation explicite** à l'écran (seuil : 5 %). Tout changement reconvertit immédiatement les dettes en USD (ADR-0001), soit un acte conscient et non un glissement de souris.
6. **Un rapport sur une date passée se lit au taux en vigueur fin de ce jour** : la dernière saisie dont le jour est antérieur ou égal à la fin de journée J. C'est le taux qui était réellement en service à cette date.

## Conséquences

**Positives**

- Plus aucun jour mort : le taux persiste jusqu'à remplacement explicite.
- Le distributeur peut coller au taux négocié plusieurs fois par jour, aussi vite qu'il change.
- La correction d'erreur devient possible et tracée, comme ADR-0001 le supposait déjà.
- L'historique complet fournit au rapport S9 son taux d'époque, sans reconstruction.

**Négatives**

- L'ancien « 1 jour = 1 taux » garantissait un chiffre constant toute la journée ; désormais, une seconde saisie fait bouger le reste à payer des dettes en USD **dans la même journée**. C'est la conséquence demandée — elle impose l'information de la date de saisie à côté de tout montant converti.
- La date affichée à côté du taux est la date de **saisie**, qui peut dater de plusieurs jours : elle doit être présentée comme « en vigueur depuis le … », jamais comme « taux du jour ».
- Un taux vieux d'une semaine qui reste en vigueur est un choix d'affaires explicite, pas un oubli. La lisibilité de la date de saisie est alors la seule défense contre une conversion à un taux périmé.

## Vocabulaire

- **Taux en vigueur** : le dernier taux saisi, en service jusqu'à remplacement.
- **Saisie de taux** : un engagement daté, numéroté, tracé.
- « Taux du jour » cesse d'être un champ daté : c'est du langage courant, pas du vocabulaire normatif.
