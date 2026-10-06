# 01: La simulation — un rapport exact, et aucune écriture

**What to build:** Avant quoi que ce soit, on charge le fichier d'origine, on
l'examine, on le transforme — et **rien n'est écrit**. Le rapport dit exactement
ce qui **serait** importé : combien de clients, quelles dettes, quelles lignes
seraient refusées et pourquoi.

C'est la préparation de la bascule, et elle est volontairement **sans transaction
ni écriture** : ce qui ne s'écrit pas ne peut pas être à défaire.

**Blocked by:** les tickets S4 (les dossiers et les comptes créés par l'import), les
tickets S3 (les dettes multi-devises)

**Status:** ready-for-agent

- [ ] **Savoir exactement ce qui sera importé avant que rien n'arrive**
      (histoire 1). Le distributeur contrôle avant, pas après.
- [ ] **Un essai à blanc d'abord** (histoire 2) : le résultat se voit **sans rien
      engager**. C'est la condition pour qu'il accepte de relancer sans angoisse.
- [ ] **Les erreurs se voient avant l'engagement** (histoire 3), pour être
      corrigées **dans la source**. Corriger dans l'application reviendrait à
      réécrire le fichier de l'utilisateur par la fenêtre de côté.
- [ ] **Rien n'est écrit pendant la simulation.** Test structurel : le compteur
      d'objets de la base est **identique avant et après**. Un test qui vérifie
      seulement « pas d'erreur affichée » passerait pendant qu'un import silencieux
      aurait lieu — c'est pour cela que le test **compte**.
- [ ] **Aucune transaction n'est ouverte** pendant la simulation : ce qui ne
      s'ouvre pas ne peut pas être laissé ouverte. Pas de « la transaction
      échouera donc rien ne compte ».
- [ ] **Le rapport de simulation est le même que celui de l'import réel** — mêmes
      colonnes, mêmes refus, même total. Un rapport de simulation différent de
      celui de l'import ment sur ce qui allait arriver, et l'écart se découvrirait
      le jour de la bascule.
- [ ] **Le rapport est consultable après coup** (histoire 12) : on peut revenir
      voir ce qui s'est passé. Un rapport qui disparaît à la fermeture est un
      rapport qu'on ne peut pas opposer à personne.
- [ ] **La simulation tient sur une source de la taille réelle.** Aucune borne
      silencieuse : une source de 5 000 lignes ne se tronque pas sans le dire.
      Une limite technique est **explicite et signalée**.
- [ ] **Le rapport affiche le total des dettes qui serait importé**, pour être
      comparé au chiffre du distributeur **avant** l'engagement — pas seulement
      après, comme l'histoire 11 le demande de son côté.
- [ ] **Le rapport distingue les blocages des avertissements.** Une source peut
      être importable malgré des lignes refusées ; ne pas rendre les deux
      indiscernables, sinon l'une empêche toujours l'autre.
- [ ] **La simulation ne crée aucun compte, aucun dossier, aucune créance, aucune
      alerte.** Une alerte née d'une simulation resterait après qu'on l'a annulée,
      et n'aurait plus d'explication.
- [ ] **La simulation n'exige aucune permission d'écriture** — elle n'écrit rien.
      Elle n'est pourtant pas ouverte à tous : elle ouvre la bascule, qui est un
      geste du distributeur. L'accès se juge à la porte du **périmètre**, pas au
      nombre d'écritures produites.
- [ ] Test navigateur mince : le rapport s'affiche sur un écran, avec ses refus et
      ses totaux, et rien n'apparaît dans l'application après une simulation.
