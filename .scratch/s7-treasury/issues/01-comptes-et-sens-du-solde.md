# 01: Les comptes, et un solde qui descend aussi

**What to build:** Une vraie trésorerie : des comptes — la caisse, la monnaie
électronique — et un solde qui **remonte** quand l'argent sort autant qu'il monte
quand il entre. Le prototype ne le sait pas faire : ses tables `TCash` et
`T_Virtuel` n'acceptent que des montants positifs. Il n'y a donc pas de solde,
il y a un cumul de recettes sans histoire.

Le solde n'est **jamais stocké**, il est recalculé à partir des mouvements. Un
solde qu'on incrémente devient faux dès la première écriture manquée, et alors
plus rien ne l'explique.

**Blocked by:** les tickets S5 (servir une commande présentielle crée une entrée)

**Status:** ready-for-agent

- [ ] **Chaque mouvement porte un sens : entrée ou sortie.** C'est le défaut n° 1
      du prototype, rendu impossible : un tableau qui n'accepte que des positifs
      n'est pas une trésorerie.
- [ ] **Le solde d'un compte est calculé à partir de ses mouvements**, jamais
      incrémenté et stocké. Test structurel : la table des comptes **n'a pas de
      colonne solde**. Un solde stocké dérive ; un solde dérivé ne diverge pas.
- [ ] **Un solde calculé descend.** Test principal : enregistrer une sortie fait
      baisser le solde, et le solde après est **exactement** la somme des entrées
      moins la somme des sorties, au centime.
- [ ] **La caisse et la monnaie électronique sont des comptes distincts**, avec
      des soldes distincts. Les confondre, c'est ne pas savoir où est l'argent.
- [ ] **On voit le solde de chaque compte**, caisse et monnaie électronique, sans
      navigation.
- [ ] **On voit le solde d'ouverture et tous les mouvements du compte.** Rien ne
      disparaît entre l'ouverture et aujourd'hui.
- [ ] **Un compte s'ouvre hors-ligne.** Un agent qui démarre sa journée sans
      réseau doit pouvoir encaisser. C'est le cas d'usage, pas le compromis.
- [ ] **Ouvrir un compte exige un solde d'ouverture.** Un solde initial absent se
      révèle plus tard par un écart qu'on ne saura pas expliquer — d'où
      l'obligation au départ.
- [ ] **Toute sortie d'argent est enregistrable.** Retrait en caisse, achat payé,
      salaire, tout mouvement sortant a une place.
- [ ] **Une catégorie est obligatoire.** Un mouvement sans catégorie est **refusé**
      (histoire 23). Le prototype cumule un retrait bancaire et une vente dans la
      même colonne, ce qui rend le vrai total inexploitable.
- [ ] **Les totaux par catégorie sur une période sont produits par S7**, pas par
      S9. Voir les décisions de S9 : un périmètre qui affiche une catégorie doit
      les avoir. S9 ne fait que les afficher.
- [ ] **On peut comparer le solde affiché avec le comptage réel**, et l'écart se
      voit immédiatement (histoire 26). La comparaison est **manuelle** : pas
      d'inventaire physique, pas de session de régularisation — hors périmètre,
      c'est écrit dans la spec. Le logiciel affiche, il ne juge pas le comptage.
- [ ] **La description saisie est enregistrée.** Le prototype l'**efface** sans
      jamais la conserver : `Enregistrer_Cash` et `Enregistrer_Virtuel` vident le
      champ Description après validation, et toute saisie est perdue. Test :
      description saisie, relue après enregistrement, identique.
- [ ] Chaque mouvement est **journalisé** : qui, quand, quel compte, quel sens,
      quel montant. Invariant 5 du glossaire.
- [ ] Un mouvement porte un **identifiant généré sur l'appareil** et un
      horodatage local, et s'enregistre **sans réseau**.
- [ ] Créer un compte ou enregistrer un mouvement exige **`tresorerie.mouvement`**
      — une seule permission pour ce périmètre, et l'absence vaut refus.
- [ ] Test navigateur mince : un agent sans cette permission ne voit ni le
      formulaire de mouvement ni celui d'ouverture de compte.
