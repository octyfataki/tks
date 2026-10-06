# 02: L'import — clients, dettes en cours, devise, statut, plafond

**What to build:** Le fichier est bon. On importe : **les clients**, et pour
chacun **le montant qu'il doit**, **la devise de cette dette**, **son statut**, et
**son plafond de crédit**. Les clients reconnus existent déjà dans l'application
— l'import ne les réinvente pas.

C'est ici que se joue le point que l'interview a tranché : **on ne repart pas de
zéro.** Repartir de zéro n'est pas un choix de propreté, c'est une perte d'argent :
la créance disparaît des livres, et le plafond devient faux dès le premier jour.

**Blocked by:** 01 — La simulation — un rapport exact, et aucune écriture ; les
tickets S4 (le dossier, le statut, le plafond), les tickets S3 (la devise de la
créance)

**Status:** ready-for-agent

- [ ] **Import des clients** (histoire 4) : ils existent dans l'application, avec
      leur dossier.
- [ ] **Import du montant dû par client** (histoire 5) : on sait qui doit quoi.
- [ ] **Import de la devise de chaque dette** (histoire 6) : une dette sans devise
      n'est pas une dette, c'est un nombre. C'est le défaut même du prototype —
      une colonne de paiement sans devise, et une formule qui additionnait des
      francs et des dollars.
- [ ] **Import du statut de chaque client** (histoire 7) : les clients privilégiés
      **conservent leur accès**, et ne se retrouvent pas à `EN_EVALUATION` le
      jour de la bascule. Un statut perdu signifie des commandes crédit refusées
      le premier matin.
- [ ] **Import du plafond de crédit** (histoire 8) : les limites sont réalistes
      dès le premier jour. Sans import du plafond, chaque client repart au plafond
      par défaut, ce qui autorise exactement ce que le distributeur interdisait la
      veille.
- [ ] **Un numéro déjà pris comme identifiant de compte ne déclenche aucun contact
      avec ce compte** (histoire 9) : l'import n'a **rien à dire sur les comptes**,
      parce qu'il n'en crée pas. Il ne touche pas à un compte existant, ne le
      fusionne pas, ne le modifie pas. Le refus est **nommé** et n'arrête pas le
      reste du fichier.
- [ ] **Un numéro de contact partagé par plusieurs lignes ne refuse rien.** Deux
      clients qui partagent un téléphone sont deux clients — le dossier accepte un
      numéro non unique. Si on confondait les deux cas, un ménage partageant un
      téléphone serait importé à moitié.
- [ ] **Un numéro correspondant à plusieurs dossiers est signalé, jamais tranché.**
      L'import ne désigne jamais un dossier par son numéro seul. C'est la règle de
      S4, et c'est ici qu'elle serait la plus facile à outrepasser : l'import a
      le fichier sous les yeux et l'envie naturelle de résoudre.
- [ ] **L'import crée des dossiers, jamais des comptes.** Un **compte** ne naît
      que de l'inscription puis de la validation humaine (S1), **jamais par
      import**. C'est la garantie qu'un compte ne peut pas apparaître par la porte
      de la bascule. Le débat jusqu'ici ouvert — qui valide en masse les comptes
      des clients déjà connus — a donc sa réponse : **personne**. La bascule fait
      le travail lourd sur les dossiers ; chaque client qui vient se connecter
      passe par la validation normale, avec son document d'identité, comme n'importe
      quel nouvel inscrit.
- [ ] **Le rattachement d'un compte à un dossier reste une décision humaine**
      (S4), et l'import ne le fait pas à la place de l'administrateur. Un
      rattachement automatique à partir d'un numéro serait exactement la désignation
      de dossier par numéro que la règle interdit.
- [ ] **Les lignes refusées sont listées avec leur motif** (histoire 10), pour
      corriger la source. Un refus sans motif est une ligne qu'on ne peut pas
      corriger.
- [ ] **Le total des dettes importées est affiché** (histoire 11), à comparer au
      chiffre du distributeur. Un écart se voit **ici**, avant qu'il ne devienne
      une contestation de client.
- [ ] **L'import est unitaire par client** : échouer sur un client n'annule pas les
      autres. Un import tout-ou-rien sur une source réelle échouera toujours, et
      forcera à recommencer de zéro.
- [ ] **Un client importé porte la trace de l'import** — voir l'histoire 15 et le
      ticket 03. Dès cette tranche, le lien est posé : l'import écrit l'attribution
      en même temps que la donnée. L'ajouter après signifierait relire tous les
      clients déjà importés.
- [ ] **L'identité d'une ligne source vient de son contenu** — client, date,
      montant, devise — et **jamais du numéro de ligne du fichier**. Un fichier
      réorganisé contient les mêmes faits, et ils doivent être reconnus. C'est la
      clé de l'idempotence du ticket 03 : une clé tirée de la position deviendrait
      fausse au premier tri du tableur, et produirait des doublons au moment
      précis où l'on est sûr de ne pas en faire.
- [ ] **Un client déjà existant est mis à jour, pas dupliqué.** Deux passes ne
      doivent pas produire deux dossiers pour la même personne.
- [ ] **La simulation et l'import partagent le même parseur.** Deux parseurs
      différents produisent deux résultats, et alors la simulation ne prouve plus
      rien de ce qui arrivera. C'est le point structurel qui rend le ticket 01
      utile.
- [ ] **L'import exige la permission `dossier.creer`** — il crée des dossiers,
      c'est le même geste répété. Une porte spéciale serait une porte qu'on
      n'aurait pas pensée à fermer.
- [ ] Test navigateur mince : le rapport d'import rejoue le rapport de simulation
      ligne à ligne, et un client importé est visible avec son dossier, son statut
      et son plafond.
