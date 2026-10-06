# 04: La file d'attente, et le verrou local

**What to build:** Les commandes arrivent, l'agent les prend une par une. Il voit qui
prend quoi, il prend un client en entier plutôt que d'alterner, il laisse une
commande à un collègue s'il ne peut pas finir. Deux agents ne doivent pas envoyer le
crédit deux fois pour la même commande.

Le verrou est **local** — posé sur l'appareil, propagé comme une écriture ordinaire.
Ce n'est pas un verrou serveur, et un verrou hors-ligne ne garantit **pas** le seul
envoi. Il garantit que le double envoi est **détecté, tracé et réconciliable**.

**Blocked by:** 02 — La commande — réseau, unités ou montant, canal, et le plafond
qui bloque

**Status:** ready-for-agent

- [ ] **Une file des commandes en attente.** Aucune demande n'est perdue — c'est le
      manque n° 1 du prototype : « Si les commandes de trois clients arrivent
      pendant que l'agent est au téléphone, il les perd. »
- [ ] **Un agent prend une commande de la file** : elle devient la sienne. L'action
      est **explicite**, jamais automatique — l'attribution est une décision
      humaine.
- [ ] **L'agent voit qui a pris la commande qu'il regardait**, pour ne pas
      dupliquer le travail. C'est l'information qui fait gagner le temps en terrain.
- [ ] **Le distributeur voit quel agent traite quelle commande**, pour savoir
      où en est l'opérationnel.
- [ ] **On peut travailler les commandes d'un client ensemble**, et non commande par
      commande. Un client qui passe trois commandes se sert en un passage.
- [ ] **On peut laisser une commande à un collègue** si on ne peut pas la finir —
      le client ne doit pas attendre.
- [ ] **Le verrou porte l'identifiant de l'agent et l'horodatage local.** Il est
      propagé **comme une écriture ordinaire**, pas comme un verrou serveur. Voir
      ADR-0004.
- [ ] **En ligne, un agent voit le verrou des autres et ne peut pas la prendre.** Un
      verrou visible doit **être visible**, pas seulement appliqué.
- [ ] **Hors-ligne, un verrou visible peut être périmé — l'interface le dit.** Elle
      ne dit pas que la commande est à lui, elle dit qu'elle est verrouillée par
      quelqu'un il y a 40 minutes. C'est la distinction qu'un agent doit faire pour
      appeler avant d'envoyer.
- [ ] **Verrou expirable.** Un agent qui verrouille puis disparaît — téléphone
      perdu, panne — ne bloque pas la commande indéfiniment. Délai **configurable**,
      et à son terme la commande **redevient disponible**.
- [ ] **Le test ne dort pas.** L'expiration est testée en **injectant
      l'horodatage**, pas en attendant le délai en temps réel. Un test qui dort
      trente minutes est un test qu'on désactivera.
- [ ] **Il n'y a pas de verrou serveur, et cette absence est assumée.** ADR-0004 :
      un verrou posé hors-ligne n'a jamais été décidé par personne. Ne pas
      « renforcer » le verrou en le rendant serveur — cela casserait
      l'offline-first, besoin métier non négociable.
- [ ] **Le double envoi reste possible et la détection est garantie.** C'est le vrai
      livrable de cette tranche. Le conflit produit un **dossier de réconciliation**
      (ADR-0005), et la commande reste `SERVIE`.
- [ ] Le verrou, sa prise, son expiration sont **réplicables** : identifiant généré
      sur l'appareil, horodatage local conservé.
- [ ] Prendre une commande exige la permission **`commande.prendre`**. Test à
      l'écran.
- [ ] Test navigateur mince : un agent sans permission ne voit pas l'action de prise.