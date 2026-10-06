# 04: L'administrateur invite un agent, l'agent s'inscrit par le lien

**What to build:** L'administrateur principal génère un lien d'invitation à usage
unique, avec une date d'expiration qu'il choisit. L'agent qui reçoit le lien y
entre, choisit son email et son mot de passe, et un compte d'agent est créé avec le
rôle que le lien avait fixé. Un lien expiré, ou un lien déjà utilisé, ne crée rien
— et l'échec est journalisé, parce qu'un lien qui traîne dans la nature est un
risque, pas un détail.

**Blocked by:** 01 — Le client s'inscrit, et son compte ne peut rien faire ;
02 — L'administrateur se connecte, second facteur obligatoire

**Status:** ready-for-agent

- [ ] Le lien porte un jeton **à usage unique** et une **date d'expiration** choisie
      par l'administrateur principal, avec une valeur par défaut configurable.
- [ ] Le lien ne crée **qu'un** compte d'agent, avec le rôle fixé par le lien. Il
      n'existe aucun moyen de choisir son rôle au moment de s'inscrire.
- [ ] Un lien expiré ne crée pas de compte, et l'échec est journalisé. Le test
      injecte l'horodatage — il n'attend pas que la date passe.
- [ ] **Usage unique** : un même jeton présenté deux fois ne crée pas deux comptes.
- [ ] **Le cas réel est testé** : invitation acceptée hors-ligne, puis consommation
      du jeton à la synchronisation, de façon idempotente.
- [ ] Un agent inscrit se connecte et se voit refuser tout écran métier. Le contrôle
      de permission arrive en S2 ; ce ticket vérifie seulement qu'une session
      d'agent n'ouvre rien par elle-même.
- [ ] L'invitation est **réplicable hors-ligne** : elle porte un identifiant généré
      sur l'appareil et un horodatage local, jamais réécrits par le serveur.
- [ ] L'agent choisit son email au moment de s'inscrire. Le lien fixe le rôle, pas
      l'identifiant.