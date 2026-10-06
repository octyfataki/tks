# 02: Le rattachement — un compte validé, un dossier, jamais deux

**What to build:** Un client s'est inscrit, son compte a été validé, mais il ne voit
toujours rien : son dossier ne lui est pas rattaché. Le distributeur — ou un agent
au comptoir — ouvre le dossier, désigne le compte validé, et le client voit enfin sa
dette.

Ce ticket est **le rattachement que S1 avait laissé à S4**, parce que S4 possède la
fiche. Il tient la promesse que S1 fait au client depuis sa tranche 03 : un compte
validé qui n'est rattaché à rien ne montre aucun dossier et aucun solde.

**Blocked by:** 01 — Le dossier client, et deux homonymes qui restent deux clients ;
les tickets S1 (le compte validé existe avant le rattachement)

**Status:** ready-for-agent

- [ ] **Un compte porte au plus un dossier, un dossier porte au plus un compte.** La
      relation est 1:1, garantie par la base, pas seulement par l'interface.
- [ ] **Le dossier se désigne par son nom, jamais par son seul numéro.** Confirmer
      « par son nom » est délibéré : c'est ce qui empêche un numéro mal saisi de
      faire afficher la dette d'un client à un autre. Test : aucun raccourci « rattache
      au dossier de ce numéro » n'existe.
- [ ] **La recherche affiche nom, adresse et solde avant que l'agent confirme.** Un
      agent qui reconnaît le client au comptoir doit voir de suite que c'est le bon
      dossier.
- [ ] **Rattacher donne accès, et c'est tracé.** Le journal contient qui a rattaché
      quoi, quand, et sur quelle pièce d'identité. Le rattachement est un acte
      traçable, comme toute écriture métier.
- [ ] **Un rattachement ne peut pas être fait deux fois sur le même compte.** Le
      second est refusé.
- [ ] **Un rattachement erroné se détecte et se défait.** Un client signale qu'il ne
      voit pas sa dette : il faut pouvoir lister les rattachements faits récemment
      et les défaire. C'est ce qui rend une erreur de rattachement **réparable**
      plutôt que définitive.
- [ ] **La pièce d'identité n'est pas redemandée.** L'artefact appartient à S1, le
      dossier le **référence**. Un dossier peut donc être rattaché à un compte déjà
      validé sans que le client dépose une nouvelle pièce. Une pièce, deux usages.
- [ ] **Un client qui perd son téléphone** réinscrit un compte ; l'ancien est
      **révoqué**, et le dossier se rattache au nouveau. La dette ne bouge pas.
- [ ] **Rattacher ne crée pas de créance et ne modifie aucun solde.** Le rattachement
      est une connexion, pas un mouvement d'argent.
- [ ] **Rattacher exige `dossier.rattacher`, défaire exige `dossier.detacher`.** Un
      client ne rattache **jamais** lui-même son compte à un dossier : c'est le
      geste qui donnerait à un inconnu la dette d'autrui.
- [ ] Test navigateur mince : après rattachement, le client voit son dossier et **sa**
      dette, et rien d'autre.