# 01: Le matin du chef — du jour en cours au portefeuille de dettes

**What to build:** Le chef ouvre l'application et voit **ce qui est entré
aujourd'hui** — en caisse et en monnaie électronique séparément, par agent, par
réseau — puis **combien ses clients lui doivent**, trié par montant, avec les
retards et ceux qui approchent de leur plafond.

C'est la lecture qu'il fait chaque matin, et le prototype la rend impossible en
exigeant qu'on **colle la liste des clients à la main** en colonne A avant que le
moindre total apparaisse. Ici, rien ne se colle.

**Blocked by:** les tickets S5 (les ventes), S6 (le portefeuille de dettes), S7
(les comptes)

**Status:** ready-for-agent

- [ ] **Le chiffre du jour est visible d'un coup d'œil** (histoire 1) — c'est la
      première question, et elle se répond sans navigation.
- [ ] **Caisse et monnaie électronique sont affichées séparément** (histoire 2).
      Les fondre, c'est ne pas savoir quel compte a bougé.
- [ ] **Les ventes du jour par agent** (histoire 3) et **par réseau** (histoire 4)
      : deux axes différents, tous les deux disponibles. Ils ne se remplacent pas.
- [ ] **Le mois courant comparé au mois précédent** (histoire 5) — la comparaison
      est le sens du chiffre, pas le chiffre seul.
- [ ] **La caisse du jour, telle qu'on peut la compter** (histoire 6) — pour
      comparer au comptage réel.
- [ ] **Le total de ce que les clients doivent** (histoire 7), calculé au taux
      en vigueur et **affiché avec ce taux et sa date**. C'est l'exemple de
      référence du glossaire qui vient le prouver : dette 100 USD à 2 300,
      paiements de 50 000 CDF puis de 50 USD, reste **65 000 CDF**, total des
      dettes **230 000 CDF**. Chaque agrégat converti porte son taux et sa date —
      sans cela, le total n'est pas vérifiable.
- [ ] **Le portefeuille est trié par montant** (histoire 8) — on relance d'abord
      celui qui doit le plus.
- [ ] **Les clients au-delà du seuil de retard** (histoire 9), avec un seuil
      **configurable**. La règle de retard est celle de S6 : l'ancienneté se
      mesure sur la date de la **créance**, pas sur celle du dernier paiement.
- [ ] **Les clients proches de leur plafond** (histoire 10) — anticiper le refus
      plutôt que le subir. La comparaison se fait **dans la devise du plafond,
      sans conversion** : c'est une décision, pas un fait.
- [ ] **Un total du jour est calculé sur le jour du serveur**, pas sur l'heure de
      l'appareil. Les deux horloges diffèrent, et un « jour » qui dépend de la
      poche de quelqu'un ne se compare pas.
- [ ] **Aucune plage bornée.** Aucun « jusqu'à la ligne 201 ». Une limite
      nécessaire doit être **explicite et signalée** — jamais silencieuse. C'est
      le défaut n° 2 du dashboard du prototype, et celui qui se cache le mieux.
- [ ] **Lire un tableau de bord n'exige aucune permission particulière** au-delà
      du rôle : le distributeur voit tout, l'agent voit les siens, le client voit
      les siens. Écrire reste protégé.
- [ ] **Un dashboard n'écrit rien.** Aucune donnée d'agrégation n'est stockée : si
      elle l'était, elle deviendrait fausse au premier changement, et personne ne
      saurait que le chiffre est vieux. Test structurel : les tables d'agrégat
      n'existent pas.
- [ ] Test navigateur mince : le premier écran montre le chiffre du jour, et un
      total cliquable mène aux lignes qui le composent.
