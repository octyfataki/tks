# 03: Le distributeur accorde et retire une permission, une par une

**What to build:** L'administrateur principal ouvre la fiche d'un agent et lui
accorde une permission précise, ou la lui retire, sans toucher au reste. Il voit en
permanence ce que l'agent peut faire. Un **profil de rôle prédéfini** sert de
raccourci pour une embauche, mais il ne verrouille rien : l'administrateur peut
retirer une permission à un agent qui a le profil complet, et c'est ce retrait qui
fait foi. Chaque attribution, chaque retrait, chaque consultation de la liste est
tracée.

**Blocked by:** 01 — Le journal d'audit existe et la base le rend immuable ;
02 — Le rôle, et l'absence de permission vaut refus

**Status:** ready-for-agent

- [ ] Une permission s'accorde **à un agent précis**, et se retire de la même façon.
      Révoquer tout l'accès d'un agent est une autre décision, pas la seule
      disponible.
- [ ] L'administrateur voit **la liste exacte** des permissions d'un agent.
- [ ] **Le profil prédéfini est un raccourci, pas une contrainte.** Test : un agent
      reçoit le profil complet, l'administrateur lui retire une permission,
      l'agent perd cette action. Le test vérifie que le profil **n'a aucun pouvoir
      propre** — il ne réaccorde pas tout derrière le dos de l'administrateur.
- [ ] **Le retrait prend effet à la synchronisation**, jamais avant. Un appareil déjà
      hors-ligne dont la session n'a pas expiré peut encore écrire localement ; ces
      écritures sont **conservées** et produisent un conflit traité par réconciliation.
      Elles ne sont jamais perdues, et jamais appliquées en silence. Test : on compte
      les écritures avant et après le retrait, et on vérifie qu'aucune n'a disparu.
- [ ] Une **attribution faite hors-ligne en conflit** — parce qu'une autre
      attribution de la même permission a été propagée entre-temps — produit un
      dossier de réconciliation contenant **les deux versions**, sans qu'aucune ne
      soit appliquée en silence. On n'écrase pas un retrait par un accord
      concurrent, ni l'inverse.
- [ ] **Qui a changé quelle permission, et quand** est consultable.
- [ ] Le distributeur voit la **liste des comptes par rôle**, pour savoir qui tient
      quoi.
- [ ] Test navigateur mince : retirer une permission retire réellement l'action de
      l'écran de l'agent, pas seulement l'échec du côté serveur.

**Le contrôle d'accès au journal lui-même ne s'applique pas aux actions de
l'administrateur technique.** Tout ce qu'il fait reste visible par le chef dans le
journal, sans filtre. C'est une exception volontaire à « tous les rôles perdent le
droit d'écrire dans le journal » : ce n'est pas le même chose qu'écrire dedans.