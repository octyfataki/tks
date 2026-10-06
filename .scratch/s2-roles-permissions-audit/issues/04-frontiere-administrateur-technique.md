# 04: La frontière de l'administrateur technique

**What to build:** L'administrateur technique diagnostique et débloque. Il lit les
données métier pour comprendre un problème signalé. **Il n'écrit aucune donnée
métier** : ni taux, ni plafond, ni promotion de client, ni écriture financière, ni
mouvement de trésorerie. Il ne peut pas s'accorder une permission lui-même. Il ne
voit ni mot de passe ni second facteur. Et tout ce qu'il fait reste visible par le
distributeur dans le journal, sans filtre.

C'est la décision contre-intuitive de la spec : on donne un accès large pour que
le support soit efficace, et ce même accès est le risque.

**Blocked by:** 01 — Le journal d'audit existe et la base le rend immuable ;
02 — Le rôle, et l'absence de permission vaut refus

**Status:** ready-for-agent

- [ ] **Aucune permission d'écriture métier** pour l'administrateur technique. Test
      : on tente **chaque** écriture métier avec son compte et on attend un refus
      à chaque fois. Une liste de refus, testée. C'est le test le plus important de
      la spec, parce qu'une régression ici est **silencieuse**.
- [ ] **Il ne peut pas s'accorder une permission.** Toute tentative est refusée **et
      journalisée** : c'est précisément le genre d'action qui doit laisser une
      trace. Test : la tentative apparaît dans le journal comme un refus, avec son
      motif.
- [ ] **Il ne peut ni voir ni modifier les secrets d'authentification** : ni mot de
      passe, ni second facteur. Un compte de support qui peut lire un secret de
      session est un compte qui peut se faire passer pour quelqu'un.
- [ ] Il **peut** déverrouiller un compte bloqué et lire les journaux d'erreur et
      l'état de synchronisation, **sans** voir les montants dans son outil de
      diagnostic. Voir une synchronisation sans tenir les chiffres métier.
- [ ] **Tout ce qu'il fait est visible par le distributeur dans le journal, sans
      filtre.** Le contrôle d'accès au journal ne s'applique pas à ses propres
      actions — ce n'est pas le même chose qu'écrire dedans, qu'il ne peut pas.
- [ ] **Ses consultations de données sensibles sont journalisées.** Lire les dettes
      de tous les clients est une action. C'est peu habituel dans un logiciel de
      gestion, et c'est pourtant ce qui rend vérifiable la promesse « mes données ne
      sont pas consultées en douce ».
- [ ] Test navigateur mince : le parcours de support fonctionne jusqu'au bout, et
      l'écriture métier échoue visiblement. L'écran de support ne doit pas ressembler
      à une impasse — il doit expliquer la limite.

**Ce que le client doit valider ici, avant tout le reste** : si la frontière lui
paraît trop stricte, la question à lui poser n'est pas « combien de droits lui
donner » mais « quelles opérations métier un diagnostic peut-il nécessiter ». La
réponse est presque toujours : aucune.