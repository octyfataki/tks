# 07: La commande côté client — réseau, unités ou montant, et le disponible qui bloque

**What to build:** Un client ouvre son application, choisit un réseau, dit
« 50 unités » ou « 100 USD », voit le prix en vigueur, voit s'il peut mettre en
dette ou non, et confirme. La commande est créée dans son profil, en USD, avec
son prix figé. **Aucune permission n'est exigée de lui** : il a un accès actif à
son profil, c'est tout.

**Blocked by:** 01 — La grille tarifaire ; 02 — La commande et le plafond ;
`.scratch/english-identifiers/issues/01-table-de-correspondance.md` ;
l'accès `compte client → profil client` (reliquat S4) ; la table des créances
(S3-01), sans laquelle le disponible n'existe pas.

**Status:** ready-for-agent

- [ ] Un compte client `VALIDE` **et autorisé sur un profil** ouvre l'écran de
      commande. Un compte validé **sans accès** n'ouvre rien : pas de commande,
      pas de solde, pas de plafond. Test dans les deux sens.
- [ ] Le formulaire tient **sur un écran**, sans navigation : réseau, unités ou
      montant, devise de saisie, prépayé ou dette.
- [ ] **Unités et montant sont équivalents** au même prix : `10 unités × 3 500`
      et `35 000` en devise de la grille donnent la même commande, mêmes unités,
      même montant.
- [ ] **Le prix est figé sur la commande.** Test : créer une commande, changer la
      grille, vérifier que les unités **et** le montant de la commande n'ont pas
      bougé.
- [ ] **La commande est en USD.** Le client peut saisir dans l'autre devise ;
      l'équivalent franc est un affichage **converti et daté** au taux du jour,
      et **aucun taux n'est écrit** sur la commande. Test structurel : la table
      `orders` n'a pas de colonne taux, et le test échoue si on l'ajoute.
- [ ] À la confirmation, une phrase dit la conséquence : la dette est en dollars,
      son équivalent en francs bouge avec le taux (ADR-0001).
- [ ] **Le disponible engage** : `plafond − créances − commandes crédit en
      attente non annulées`, par devise. Deux commandes crédit de 100 USD sur une
      ligne de 100 USD : la première passe, la seconde est refusée.
- [ ] **Le refus de plafond est préventif** et nomme le disponible restant.
      Aucune dérogation.
- [ ] L'option **dette** est **visible** et **désactivée** quand le disponible
      est nul, avec sa raison en clair. Elle n'est jamais absente en silence, et
      elle n'est jamais cliquable pour échouer ensuite.
- [ ] **Le prépayé échappe au plafond** : la même commande en prépayé passe là où
      la dette est refusée.
- [ ] Une commande ne peut être créée que pour **le profil du compte** : le
      compte A ne voit ni ne crée rien pour le profil B.
- [ ] **Le plafond par défaut vaut zéro** : un profil neuf ne peut pas mettre en
      dette tant que l'administrateur principal n'a pas accordé de ligne.
- [ ] La commande porte un **identifiant généré sur l'appareil** et un
      horodatage local : elle se crée **hors-ligne**.
- [ ] Hors-ligne, la vérification du plafond est **indicative** et l'écran le
      dit ; elle fait autorité à la synchronisation.
- [ ] L'état n'est **jamais** un champ écrit : il se déduit des événements de la
      commande. Test : reconstruire l'état depuis les événements donne le même
      résultat que la lecture.
- [ ] La commande n'est visible **que** par les agents (file, ticket `04`) et par
      le client propriétaire du profil. Aucune étiquette client n'apparaît côté
      client.
- [ ] Test navigateur mince : le formulaire tient sans navigation, et le refus de
      plafond s'affiche à l'écran avec le disponible.
