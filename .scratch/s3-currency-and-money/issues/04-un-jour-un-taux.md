# 04: Le taux en vigueur — historique, avertissement, et correction

**What to build:** Le distributeur peut consulter l'historique des taux, voir qui
a saisi quoi et quand, et repérer une saisie anormale. S'il saisit une valeur
loin de celle en vigueur (plus de 5 %), il est **averti** avant de créer une
incohérence, parce qu'un changement reconvertit immédiatement toutes les dettes
en USD. S'il s'est trompé, il **corrige** — par une nouvelle saisie datée et
tracée qui prend le relais, jamais en modifiant la saisie précédente.

**Blocked by:** 01 — Le taux du jour, et une créance qui porte sa devise

**Status:** ready-for-agent

- [ ] **Le taux est une séquence append-only, numérotée dans la base.** Une
      seconde saisie prend le relais ; **jamais la première n'est effacée**.
      Test : la valeur initiale reste consultable dans l'historique.
- [ ] **Le dernier saisi est en vigueur**, y compris les jours suivants sans
      nouvelle saisie. Une journée sans saisie n'a pas de taux manquant.
- [ ] Ressaisir **la valeur déjà en vigueur** est refusé sans rien écrire : le
      taux en vigueur est déjà celui-là.
- [ ] Le distributeur est **averti** avant un changement d'écart marquant (au-delà
      de 5 %) : la confirmation est explicite, la valeur en vigueur affichée à côté.
- [ ] **L'historique des taux est consultable**, et l'on peut **reconstituer ce
      qu'un client devait le mois dernier** au taux en vigueur fin de jour.
- [ ] On voit **qui a saisi un taux donné**, parce qu'on ne fait pas confiance à
      un chiffre qu'on ne peut pas rattacher.
- [ ] Corriger un taux erroné passe par une **saisie nouvelle datée et tracée**
      qui prend le relais, jamais par une modification de la saisie d'origine.
- [ ] Le journal conserve la saisie de taux comme **écriture métier** : qui,
      quand, quelle valeur. Un taux est un engagement, pas un réglage. Toute
      saisie exige **`taux.saisir`**.
