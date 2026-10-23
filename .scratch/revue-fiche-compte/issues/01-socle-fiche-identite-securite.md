# 01: Le socle de la fiche — identité complète, données dédupliquées, pastilles explicites

**What to build:** La fiche « Mon compte » du personnel cesse de se répiter.
La bannière porte l'identité complète — photo, nom, rôle, état du compte,
matricule copiable, date de création — et chaque donnée n'existe qu'à un seul
endroit. Le bloc « Coordonnées » ne montre plus que ce qui se corrige. Chaque
bloc annonce s'il est modifiable ou en lecture seule, par une **pastille
textuelle** : le crayon, qui signifiait « modifiable » partout ailleurs, ne
dit plus qu'un bloc est figé. Les sessions sont nommées par un libellé
lisible, pas par un user-agent brut.

Le composant `ProfilUtilisateur` est partagé par les trois fiches (admin,
agent, client) : le socle change une fois, les trois pages en héritent. Le
client garde ses blocs propres (pièce d'identité, profil client), l'agent
garde son bloc « Mission de terrain ».

**Blocked by:** aucun

**Status:** ready-for-agent

- [ ] La bannière affiche photo, nom, rôle, état du compte, matricule
      copiable et date de création. Aucune donnée n'apparaît deux fois dans
      la fiche.
- [ ] Le bloc « Coordonnées » n'affiche plus que le nom affiché et le
      téléphone contact. Les lignes « Matricule », « Identifiant » et
      « Espace » du bandeau disparaissent.
- [ ] Les blocs verrouillés redondants (adresse email, rôle) disparaissent :
      ces données sont en bannière.
- [ ] Chaque bloc porte une pastille textuelle « Lecture seule » ou
      « Modifiable ». Un bloc qui ne porte ni donnée modifiable ni donnée
      verrouillée reste sans pastille.
- [ ] Le crayon n'annonce plus une lecture seule ; il ne reste que là où il
      ouvre une action.
- [ ] Un second facteur jamais activé s'affiche « Non activé ».
- [ ] La date de création n'a qu'une seule formulation dans la fiche.
- [ ] La carte « Administration » disparaît de la fiche du personnel ; le
      rôle reste en bannière.
- [ ] Chaque session porte un libellé lisible (« Chrome sur Windows »,
      « Session serveur ») ; l'adresse loopback IPv6 est normalisée en
      `127.0.0.1` ; le user-agent brut reste accessible en infobulle.
- [ ] La session courante reste marquée « Cet appareil ».
- [ ] `SectionModifiable` n'est plus importé depuis une page d'application
      par le socle des fiches : il rejoint `components/`.
- [ ] Les tests du composant `ProfilUtilisateur` suivent la nouvelle
      structure ; les tests qui portaient sur les doublons sont réécrits.
