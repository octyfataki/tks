# 02: Écrire sans réseau — la file d'attente durable

**What to build:** L'agent encaisse, sert, valide une preuve, prend une commande
— **sans réseau**. Chaque écriture part dans une **file locale**, durable, et
attend. L'agent voit combien d'écritures attendent et il choisit **quand**
synchroniser.

C'est la tranche la plus importante de S8, et elle conditionne S1 à S7 : une
écriture qui exige le réseau invalide toute la chaîne. Voir ADR-0003.

**Blocked by:** les tickets S5, S6 (les écritures métier qu'on reproduit hors-ligne)

**Status:** ready-for-agent

- [ ] **Un comptoir est encaissé sans réseau** (histoire 1) — le client n'est pas
      mis en attente pendant qu'on cherche un signal.
- [ ] **Une commande est servie sans réseau** (histoire 2) : l'agent sert là où le
      client est, quel que soit le signal.
- [ ] **Une preuve est validée hors-ligne** (histoire 3) : l'agent ne revient pas
      plus tard pour un geste qu'il peut faire maintenant.
- [ ] **Un paiement est enregistré hors-ligne** (histoire 4), et le client voit
      son solde mis à jour **immédiatement**.
- [ ] **Un client passe une commande hors-ligne** (histoire 9), y compris avec sa
      preuve de paiement (histoire 10) — la coupure de couverture n'arrête pas la
      commande.
- [ ] **Chaque écriture porte un identifiant généré sur l'appareil** et un
      horodatage **local**, conservé et jamais remplacé par le serveur. C'est la
      condition de toute la suite, et elle est **structurelle** : test sur le
      schéma, pas seulement sur le comportement.
- [ ] **La file d'attente est durable** : elle survit à la fermeture de
      l'application et au redémarrage. Test : écrire, tuer le processus,
      redémarrer, la file est intacte.
- [ ] **L'agent voit combien d'écritures attendent de synchroniser** (histoire 12),
      pour savoir s'il travaille à risque. Un compteur invisible, c'est un
      risque invisible.
- [ ] **L'agent est prévenu avant qu'une synchronisation n'efface son travail en
      attente** (histoire 15). Aucune perte silencieuse — c'est le scénario qu'un
      agent n'oubliera jamais s'il lui arrive une fois.
- [ ] **La synchronisation est manuelle** (histoire 16) : l'agent choisit quand il
      consomme du réseau. La synchronisation automatique en arrière-plan est le
      réglage par défaut plus tard si elle se révèle nécessaire, mais le
      contrôle reste à l'agent.
- [ ] **L'ordre des écritures d'un même client est conservé.** Un paiement qui
      arriverait avant la créance qu'il règle produirait un solde momentanément
      absurde. L'ordre logique prime sur l'ordre d'arrivée.
- [ ] **La file n'a pas de taille fixe.** Aucun plafond silencieux : une file qui
      se remplit ne doit pas perdre la queue. Une limite, si elle existe pour des
      raisons techniques, est **explicite et signalée**.
- [ ] **Les écritures de la file sont consultables** : l'agent voit ce qui attend,
      avec leur nature, leur date et leur état.
- [ ] **Une écriture de la file peut être supprimée par son auteur**, après
      confirmation explicite, et la suppression est **journalisée**. Laisser un
      brouillon piégé sans pouvoir le retirer le rend dangereux.
- [ ] **Les quatre écritures métier de S5, S6 et S7 sont réplicables** et sont
      testées une par une : commande, preuve, paiement, mouvement de trésorerie.
      Une seule non réplicable invalide sa spec.
- [ ] **Aucune écriture ne modifie la base du serveur depuis le client** : le
      client propose, la file transmet, le serveur décide. C'est la frontière
      structurelle qui rend la synchronisation auditable.
- [ ] Test navigateur mince : le compteur de file est visible pendant tout le
      parcours, et la coupe du réseau pendant une saisie ne perd rien.
