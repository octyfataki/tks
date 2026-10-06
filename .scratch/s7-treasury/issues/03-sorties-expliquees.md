# 03: Les sorties expliquées — catégories, totaux, attribution

**What to build:** Le chef veut savoir **combien il a retiré** et **combien il a
vendu**. Le prototype ne le peut pas : aucun mot de catégorie n'apparaît
nulle part. Un retrait en banque et une vente se cumulent dans la même colonne.

Ici chaque sortie a un motif, les totaux se font **par catégorie et par période**,
et l'on sait **qui a dépensé quoi, sur quel compte**. C'est là que le chiffre
d'affaires devient une information et pas un cumul.

**Blocked by:** 01 — Les comptes, et un solde qui descend aussi

**Status:** ready-for-agent

- [ ] **Les sorties en monnaie électronique existent**, comme les sorties en
      espèces. Un réseau sur lesquels l'argent ne peut qu'entrer est un réseau
      qu'on ne peut pas vider.
- [ ] **Les dépenses ont un compte et un motif**, les deux obligatoires. Une
      dépense sans motif est refusée — c'est la même exigence que pour un
      mouvement sans catégorie.
- [ ] **On sait qui a dépensé sur quel compte.** L'attribution est visible, pas
      déduit. Un agent qui dépense sans que son nom suive l'argent a un avantage
      qui ne se rattrape pas.
- [ ] **Les totaux par catégorie sur une période sont en place.** C'est le morceau
      que le prototype ne produit pas du tout : la décision de la spec S9 est
      explicite, les totaux vivent ici, S9 ne fait que les afficher.
- [ ] **On filtre la période**, pour comparer un mois à l'autre. Les totaux figés
      sont exactement la faiblesse du dashboard du prototype : deux graphiques
      fixes et des plages bornées.
- [ ] **Les totaux séparent entrées et sorties.** Un total net qui mélange les deux
      ne dit pas si le chiffre d'affaires a monté ou si l'on a dépensé moins.
- [ ] **Le total des sorties par catégorie est exact, quelle que soit la taille de
      l'historique** — pas de plage limitée à 200 lignes. Si une limite est
      nécessaire pour des raisons techniques, elle est **explicite et signalée**,
      jamais silencieuse. C'est le défaut n° 2 du dashboard.
- [ ] **Chaque total affiche sa période** et sa **provenance**, pour qu'un chiffre
      soit vérifiable. Un total sans période est un total qu'on ne peut pas
      contester.
- [ ] **Un mouvement ne peut pas être enregistré sans catégorie** — test de refus,
      pas seulement test de saisie. Le refus est ce qui garantit que le total par
      catégorie est complet ; un total sur des catégories facultatives est un
      total faux.
- [ ] **Les mouvements sont consultables avec leur sens**, pour qu'on puisse
      distinguer d'un coup d'œil ce qui entre et ce qui sort.
- [ ] **La liste des mouvements est consultable hors-ligne**, sur les données
      embarquées, et la date d'actualisation est affichée.
- [ ] Corriger un mouvement exige **`ecriture.corriger`** et enregistrer un
      mouvement **`tresorerie.mouvement`** — les deux restent distinctes.
- [ ] Test navigateur mince : le motif et le compte sont obligatoires à l'écran,
      avec un message clair quand ils manquent.
