# 03: L'administrateur valide ou refuse un compte client

**What to build:** L'administrateur voit la file des comptes en attente, avec leur
ancienneté. Il ouvre une pièce d'identité, et il valide ou il refuse. Un compte
validé cesse d'être bloqué. Un compte refusé montre son motif au client, qui peut
corriger et être validé plus tard. Tout ce qui se passe ici est journalisé : qui,
quand, quel compte, sur quelle pièce.

La fluidité de cette action est le **verrou du produit**. Si un compte met trois
jours à être validé, le client a essayé une fois et il est retourné au carnet. La
décision est juste, et la conception doit faire le reste.

**Blocked by:** 01 — Le client s'inscrit, et son compte ne peut rien faire ;
02 — L'administrateur se connecte, second facteur obligatoire

**Status:** ready-for-agent

- [ ] La file des comptes en attente existe, triée par **ancienneté**, avec la date
      d'inscription. Sans elle, personne ne sait qui attend.
- [ ] **Valider exige une pièce d'identité.** Aucun chemin dans l'application ne
      produit un compte `VALIDE` sans qu'un document ait été vu. Le test tente la
      validation par tous les chemins disponibles — écran, puis appel direct de la
      couche applicative — et attend un refus dans les deux cas. La validation sans
      document doit être **impossible à produire**, pas seulement masquée.
- [ ] Le client dépose sa pièce d'identité **depuis l'application**. L'artefact est
      compressé, conservé, et sa référence est celle que porte la validation.
- [ ] Valider et refuser sont deux actions distinctes. Le refus exige un **motif**,
      le motif est affiché au client, et le compte peut être validé plus tard sans
      ressaisir quoi que ce soit.
- [ ] La validation est journalisée : qui, quand, quel compte, sur quelle pièce.
- [ ] Un compte validé franchit la barrière que les autres ne franchissent pas. La
      barrière est **une seule vérification nommée**, celle que tous les écrans
      métier réutiliseront — c'est elle que S5 viendra consommer.
- [ ] Un compte validé mais **non rattaché** ne voit aucun dossier et aucun solde.
      Valider n'est pas rattacher : la validation dit « cette personne est un
      client », le rattachement dit « cette personne est *ce* client ». Le
      rattachement appartient à S4, qui possède la fiche dossier.
- [ ] Le client en attente reste connecté et **voit son état avancer** sans avoir à
      se réinscrire.
- [ ] **Dans cette tranche, seul un administrateur peut valider**, parce que c'est
      le seul acteur authentifié qui existe. Autoriser un agent à valider au
      comptoir dépend du contrôle de permission, qui arrive en S2 avec le défaut
      zéro permission. Ce ticket ne doit pas ouvrir cette porte par défaut.
- [ ] Test : deux inscriptions avec le même numéro — la seconde est refusée, et un
      compte ne peut pas être validé deux fois.