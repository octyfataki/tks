# 05: Les photos — compression, file d'attente, envoi en tâche de fond

**What to build:** Le client prend la photo de son reçu **dans l'application**, pas
dans un autre cahier d'applications. Sans réseau, la photo est enregistrée
**localement** et **lui dit**. Plus tard, elle part **toute seule**.

L'administrateur, lui, doit pouvoir **voir la photo sur son téléphone** pour
valider depuis n'importe où, et **savoir qu'une photo n'est jamais arrivée** —
parce qu'attendre une preuve qui ne viendra pas, c'est une vente perdue.

**Blocked by:** 02 — Écrire sans réseau — la file d'attente durable ; 03 —
Synchroniser — succès, échec, et réémission sans doublon

**Status:** ready-for-agent

- [ ] **La photo est prise dans l'application** (histoire 26) : pas de va-et-vient
      entre deux applications, ni de fichier perdu quelque part.
- [ ] **La photo prise sans réseau est enregistrée localement** (histoire 27), et
      **le client le sait** — un message clair, pas un spinner qui tourne. Une
      photo « qui part » sans réseau finit par être reprise.
- [ ] **Compression obligatoire et plafond de taille**, appliqués **avant** la mise
      en file. Si la photo est refusée pour cette raison, un message lisible le
      dit — jamais une erreur technique. Le téléphone d'un agent n'a pas besoin
      d'un fichier de 8 mégaoctets.
- [ ] **La compression ne détruit pas la lisibilité du reçu.** C'est la part du
      compromis qu'il faut tester avec des données réelles : une preuve
      illisible rend l'étape de validation inutile.
- [ ] **Un upload qui échoue est signalé** (histoire 29). L'administrateur ne doit
      pas attendre une preuve qui n'arrive pas. L'échec se voit **à l'endroit où
      la photo est attendue**, pas dans un journal technique.
- [ ] **La photo se téléverse d'elle-même** (histoire 30), sans geste manuel,
      quand la connexion revient — sur la file du ticket 02, avec les mêmes
      règles de réémission.
- [ ] **La réémission d'une photo est idempotente** comme toute écriture : la
      couper au milieu de l'envoi puis réémettre produit **une** photo, pas deux.
- [ ] **L'administrateur voit la photo sur son téléphone** (histoire 28), pour
      valider depuis n'importe où. Un visuel qu'on ne peut pas voir n'est pas une
      preuve.
- [ ] **L'ancienne photo reste consultable** quand une nouvelle est envoyée :
      jamais d'écrasement. Voir S5 ticket 03 — deux endroits pour la même règle,
      un seul mécanisme.
- [ ] **La photo et sa validation sont liées** : valider porte sur une version
      précise, pas sur « la photo actuelle » qui peut avoir changé depuis.
- [ ] **Le compteur de photo en attente est visible**, comme les autres écritures
      de la file, pour que l'agent sache ce qu'il expose encore.
- [ ] **La photo n'est pas un obstacle à l'écriture métier** : enregistrer la
      photo et enregistrer la commande sont deux écritures indépendantes ; une
      photo qui bloque la commande retarderait le client pour une raison qui n'est
      pas la sienne.
- [ ] **Les métadonnées sensibles de la photo sont retirées** à la compression —
      position, appareil, heure exacte. Une photo de reçu transporte de l'information
      que personne n'a demandée à partager.
- [ ] La validation de la photo exige **`preuve.valider`**, déjà déclarée — c'est
      ici que la permission se vérifie sur le chemin réel et pas seulement sur la
      fiche de S5.
- [ ] Test navigateur mince : la photo se prend, se compresse et s'insère dans la
      file sans quitter l'écran, et l'échec d'envoi se lit sur la photo elle-même.
