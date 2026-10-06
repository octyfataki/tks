# 04: Les conflits — un dossier de réconciliation, jamais un écrasement

**What to build:** Deux agents ont servi la même commande hors-ligne. La
synchronisation voit deux exécutions concurrentes. **Elle ne choisit pas.** Elle
conserve les deux, crée un dossier de réconciliation, et l'administrateur tranche.

Le premier enregistrement est gardé (ADR-0005) — non pas parce qu'il a raison,
mais parce que choisir serait silencieux. Ce qui est refusé, c'est l'**écrasement** :
la seconde écriture disparaître sans laisser de trace.

**Blocked by:** 03 — Synchroniser — succès, échec, et réémission sans doublon

**Status:** ready-for-agent

- [ ] **Tout conflit est signalé** (histoire 19) : aucun conflit ne passe
      inaperçu. Un conflit non signalé est un double crédit permanent.
- [ ] **Les deux côtés du conflit sont visibles** (histoire 20), l'un à côté de
      l'autre : les mêmes données, les deux exécutions, avec leurs auteurs et
      leurs horodatages locaux.
- [ ] **L'administrateur décide** (histoire 21) : la décision est humaine et
      explicite. Le logiciel propose, il ne tranche pas.
- [ ] **Un conflit exige une action délibérée** (histoire 22) : il ne peut pas
      être clos par inadvertance. Un conflit fermé par erreur est un conflit dont
      on a perdu la trace.
- [ ] **On voit les agents et les clients concernés** (histoire 23), pour
      reconnaître un motif et pas seulement un incident isolé.
- [ ] **On voit depuis combien de temps un conflit est ouvert** (histoire 24), pour
      que les urgents remontent.
- [ ] **On sait si un client cause des conflits de façon répétée** (histoire 25),
      pour traiter l'organisation et pas seulement le cas.
- [ ] **Les deux exécutions sont journalisées, l'une comme l'autre.** Rien n'est
      écrasé, donc rien n'est perdu. Aucune exécution ne peut être supprimée du
      journal.
- [ ] **La décision de réconciliation est elle-même journalisée** — qui a tranché,
      quand, et dans quel sens. Une réconciliation anonyme est une réconciliation
      impossible à défendre.
- [ ] **Après la décision, la commande reste `SERVIE`** et le résultat est
      unique : une commande, une créance, un mouvement. C'est le test le plus
      important du projet entier — il doit exister, **même échouant**, avant toute
      ligne de code de synchronisation. Il relie ADR-0004, ADR-0005 et les invariants
      2 et 3 du glossaire en un seul décompte.
- [ ] **Un conflit n'est pas une erreur de synchronisation.** Ils se distinguent à
      l'écran et dans le journal : l'un demande une décision humaine, l'autre
      demande une reconnexion. Les confondre ferait croire qu'une reconnexion
      suffit.
- [ ] **Une modification concurrente de tarif ou de plafond n'est pas un conflit
      de données, c'est une décision** : S3 et S4 tiennent leur propre historique,
      et une modification concurrente d'un **taux de change** n'est **jamais**
      traitée comme un conflit. Voir la décision explicite de S8 — elle est écrite
      là pour ne pas être « oubliée » au rang de cas particulier. C'est le seul
      endroit où un même événement peut ressembler à un conflit sans en être un.
- [ ] **Un dossier de réconciliation est consultable hors-ligne**, et sa décision
      se prend aussi hors-ligne, puis se synchronise comme une écriture ordinaire.
- [ ] Trancher exige **`reconciliation.trancher`** — un identifiant déjà déclaré
      dans la liste fermée de S2, et c'est ici qu'il est invoqué pour la première
      fois.
- [ ] Test navigateur mince : les deux exécutions sont visibles sur un écran, et
      la clôture demande une confirmation explicite.
