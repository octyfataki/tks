# 09: Le suivi du client — voir ses commandes, et annuler avant validation

**What to build:** Le client ouvre « Commandes » et voit ses commandes, leur
état en français, leur prix figé, et ses preuves avec les motifs de refus. Tant
que sa preuve n'est pas validée, il peut retirer sa commande lui-même. Après,
c'est un agent. Il ne voit **rien** des coulisses : ni l'agent, ni le verrou, ni
la réconciliation, ni ses étiquettes.

**Blocked by:** 07 — La commande côté client ; 08 — La preuve côté client.

**Status:** ready-for-agent

- [ ] L'entrée « Commandes » de la navigation client donne accès à **Nouvelle
      commande** et **Suivi des commandes**. Aucune destination « Statut et
      plafond » : le disponible vit dans le contexte de la commande et dans
      « Dette et reste à payer ».
- [ ] La liste montre **les commandes du seul profil autorisé** du compte, les
      plus récentes d'abord, avec leur état.
- [ ] Le détail montre : réseau, unités, prix figé, montant USD, équivalent
      francs **daté**, canal, type, et la suite des événements sous forme lisible.
- [ ] Les états s'affichent **en français**, jamais en valeur technique : preuve
      attendue, en attente de service, en cours de service, servie, annulée.
- [ ] Le client voit **ses preuves**, y compris refusées, avec leur motif et
      l'ancienne version. Il ne voit pas les preuves d'un autre profil.
- [ ] Le client **ne voit jamais** : le nom de l'agent qui traite, le verrou, un
      dossier de réconciliation, ni ses propres étiquettes.
- [ ] **Annulation avant validation de la preuve** : le client retire sa
      commande lui-même, et l'acte est tracé (qui, quand, pourquoi).
- [ ] **Annulation refusée après validation** : une commande entrée en file ne
      se retire plus par le client ; c'est un agent qui annule, avec
      `commande.annuler`.
- [ ] **Aucune expiration automatique** : une commande sans preuve reste ouverte
      après un délai injecté. C'est l'humain qui tranche, pas l'horloge.
- [ ] Une **créance** correspondant à une commande servie reste lisible par le
      client en USD d'abord, avec sa date de taux.
- [ ] Le suivi se lit **hors-ligne** sur les données embarquées, et la fraîcheur
      est indiquée quand la dernière synchronisation est ancienne.
- [ ] Test navigateur mince : les deux chemins d'annulation (autorisé,
      refusé) et l'absence de toute donnée de coulisses à l'écran.
