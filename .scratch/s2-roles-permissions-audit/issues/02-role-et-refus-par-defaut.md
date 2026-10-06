# 02: Le rôle, et l'absence de permission vaut refus

**What to build:** Un compte porte un rôle fixé à sa création et immuable. Un agent
sans permission s'authentifie parfaitement et **ne peut rien faire** — la frontière
est réelle, pas consultative. L'agent peut voir ce qu'il a le droit de faire, pour
ne pas tenter une action et se faire refuser. L'administrateur technique peut lire
les données métier, mais aucune écriture métier ne lui est possible.

Cette tranche pose aussi la **liste fermée des permissions**, écrite dans le code
et non modifiable à l'exécution. Tous les noms métier sont **déclarés maintenant**,
alors que rien ne les implémente encore : écriture financière, trésorerie, plafond,
promotion, dossier client, grille tarifaire, preuve de paiement, commande,
réconciliation, journal. Personne ne les a, donc tout le monde se les voit refuser.
Les specs suivantes viendront brancher le comportement derrière le nom, et le
filtrage sera déjà en place.

**La liste a été complétée après S4 et S5**, parce que ces deux specs ont introduit
des actions métier — créer un dossier, poser un verrou, valider une preuve,
**servir une commande** — qu'aucun nom ne couvrait. Déclarer les cinq premiers noms et oublier le travail quotidien d'un agent aurait
produit un agent authentifié à la perfection et incapable de faire le métier. La
règle reste la même : une spec qui introduit une action métier nouvelle **ajoute
son nom ici**, elle ne contourne pas la liste.

**Blocked by:** 01 — Le journal d'audit existe et la base le rend immuable

**Status:** ready-for-agent

- [ ] Quatre rôles, exactement : `ADMIN_PRINCIPAL`, `ADMIN_TECHNIQUE`, `AGENT`,
      `CLIENT`. Aucun rôle supplémentaire, et une personne n'a qu'un rôle.
- [ ] **Le rôle est immuable** une fois le compte créé. Tenter de le modifier est
      refusé. Le seul chemin est révocation puis création d'un nouveau compte, et
      les deux gestes sont journalisés.
- [ ] **La liste des permissions est fermée et définie dans le code.** Elle n'est pas
      modifiable à l'exécution, pour qu'une permission invoquée ne puisse pas
      inexister. Test : le test utilise une permission inventée pour prouver que le
      défaut est à refus, et non à permission inconnue, donc passe.
- [ ] **La liste fermée contient les identifiants suivants, et eux seuls.** Ils sont
      déclarés **maintenant**, avant que les specs qui les implémentent n'arrivent.
      Chaque identifiant est celui que le code vérifiera, en toutes lettres. Une
      spec ultérieure qui introduit une action métier **nouvelle** ajoute son
      identifiant ici ; elle ne contourne pas la liste, elle l'étend.
      *Écriture financière* — `taux.saisir`, `creance.creer`, `paiement.creer`,
      `ecriture.corriger` : saisir un taux, créer une créance, enregistrer un
      paiement, corriger une écriture par son inverse.
      *Trésorerie* — `tresorerie.mouvement` : tout mouvement de caisse ou de
      mobile money.
      *Plafond* — `plafond.modifier` : fixer, modifier, diminuer un plafond.
      *Promotion* — `statut.modifier` : changer le statut d'un client.
      *Dossier client* — `dossier.creer`, `dossier.rattacher`, `dossier.detacher` :
      créer une fiche client, la rattacher à un compte, la défaire.
      *Grille tarifaire* — `grille.tarif` : saisir ou modifier un prix unitaire.
      *Preuve de paiement* — `preuve.valider` : valider ou refuser une preuve.
      *Commande* — `commande.creer`, `commande.prendre` (poser un verrou),
      `commande.servir`, `commande.annuler`.
      *Réconciliation* — `reconciliation.trancher` : trancher un dossier de
      synchronisation en conflit.
      *Journal* — `journal.consulter` : consulter le journal d'audit.
- [ ] **Test : un identifiant inventé vaut refus, et un identifiant omis aussi.**
      `commande.teleporter` est refusée comme toute autre inconnue. Mais surtout :
      **tous les identifiants de la liste sont testés un par un**, chacun dans une
      action de la spec qui l'implémente. Un nom déclaré qu'aucun test n'invoque est
      un nom qu'on croit couvrir sans l'être — et la liste fermée devient une liste
      de souhaits.
- [ ] **Test : un agent sans permission ne peut rien faire — y compris le travail
      ordinaire.** On tente avec un compte `AGENT` sans permission : saisir un
      prix, prendre une commande, valider une preuve, **servir une commande**. Un
      refus à chaque fois. C'est le symétrique du test de l'administrateur
      technique, et c'est ce test qui prouve que l'authentification et
      l'autorisation sont deux choses distinctes.
- [ ] **Un agent qui tient ses seules permissions peut faire exactement ce qui
      correspond à ses permissions, et rien d'autre.** Le test inverse : un agent
      doté de `commande.servir` **peut** servir une commande mais **ne peut pas**
      saisir un prix unitaire. Refuser par défaut ne suffit pas ; il faut prouver
      que l'octroi fonctionne aussi.
- [ ] **La liste n'est pas gelée pour l'éternité, seulement à l'exécution.** Elle
      est fermée dans le code, donc un nom inconnu est un refus et non une
      permission implicite — mais une spec ultérieure peut **ajouter** un nom, ce qui
      est une modification du code, visible, revue, tracée dans le journal de
      projet. Ce qui est interdit, c'est d'ajouter une permission sans que le code
      la déclare.
- [ ] **L'absence de permission vaut refus**, jamais à accès libre. C'est le sens
      par défaut, et il est non négociable.
- [ ] **Zéro permission par défaut** à la création d'un agent. Test : le test
      compte les permissions et attend **zéro**, pas « les permissions par défaut ».
      Un agent créé sans permission ne peut donc **pas** servir une commande tant
      que le distributeur ne lui a pas donné `commande.servir`. C'est délibéré :
      l'absence vaut refus, et l'octroi est un geste visible.
- [ ] **Test : l'administrateur technique ne peut pas déplacer d'argent.** On tente
      **chaque** écriture métier avec son compte et on attend un refus à chaque
      fois. Une liste de refus, testée. C'est le test le plus important de la spec,
      parce qu'une régression ici est **silencieuse** : rien ne casse, l'écran de
      support fonctionne, et l'argent a bougé.
- [ ] L'administrateur technique dispose de permissions de **lecture sur les données
      métier** et de **diagnostic technique** : état de synchronisation, journaux
      d'erreur, déblocage de compte.
- [ ] L'agent voit **quelles permissions il a réellement**, pour ne pas tenter une
      action et se faire refuser.
- [ ] Un client ne peut atteindre **aucun** écran de gestion, et ne voit que les
      siens.
- [ ] Parcours navigateur, un par profil, traversant l'interface réelle : le
      contrôle d'accès s'applique **à l'écran**, pas seulement en couche
      applicative.