# 04: Un jour, un taux — historique, avertissement, et correction

**What to build:** Le distributeur peut consulter l'historique des taux, voir qui a
saisi quel jour, et repérer un jour anormal. S'il tente de saisir un second taux
différent pour un jour déjà enregistré, il est **averti** avant de créer une
incohérence. S'il s'est trompé, il **corrige** — mais par un taux d'ajustement daté
et tracé, jamais en modifiant le taux qu'il a mal saisi.

**Blocked by:** 01 — Le taux du jour, et une créance qui porte sa devise

**Status:** ready-for-agent

- [ ] **Un jour porte au plus un taux.** Deux saisies différentes sur la même date
      sont refusées ou journalisées comme ajustement. **Jamais la seconde n'écrase
      la première.** Test : la valeur initiale reste consultable.
- [ ] Le distributeur est **averti** avant d'enregistrer un second taux différent
      pour un jour déjà enregistré, avec la valeur déjà présente affichée à côté.
- [ ] **L'historique des taux est consultable**, et l'on peut **reconstituer ce
      qu'un client devait le mois dernier**.
- [ ] On voit **qui a saisi un taux donné**, parce qu'on ne fait pas confiance à un
      chiffre qu'on ne peut pas rattacher.
- [ ] Corriger un taux erroné passe par un **taux d'ajustement daté et tracé**,
      jamais par une modification de la valeur d'origine. Le taux du **lendemain**
      peut être préparé sans toucher aux écritures du jour.
- [ ] Une date **sans** taux enregistré est signalée à l'écran plutôt que traitée
      silencieusement par le taux le plus proche. Un calcul qui utilise un taux
      qu'on n'a pas saisi est un calcul faux qu'on ne voit pas.
- [ ] Le journal conserve la saisie de taux comme **écriture métier** : qui, quand,
      quelle valeur. Un taux est un engagement, pas un réglage. Toute saisie et tout
      ajustement exige **`taux.saisir`**.