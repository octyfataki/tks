# 03: Synchroniser — succès, échec, et réémission sans doublon

**What to build:** L'agent appuie sur « synchroniser ». Il doit savoir **si c'est
passé**, sinon il n'en a aucune idée — et un agent qui croit avoir synchronisé
alors que non travaille dans l'ignorance totale de ce qu'il expose.

Et surtout : quand la connexion revient, la file se **réémet**. Si le réseau
coupe **au milieu** de l'envoi, la réémission ne doit **rien créer deux fois**.
C'est l'idempotence, et c'est elle qui fait la différence entre un système qui
se rattrape et un système qui double ses dettes.

**Blocked by:** 02 — Écrire sans réseau — la file d'attente durable

**Status:** ready-for-agent

- [ ] **L'agent sait qu'une synchronisation a réussi** (histoire 17) — message
      explicite, pas un silence. Le silence interprété en succès est l'erreur la
      plus coûteuse de ce parcours.
- [ ] **L'agent sait qu'une synchronisation a échoué, et pourquoi** (histoire 18).
      Un échec muet laisse croire au succès et suspend le reste du travail.
- [ ] **La cause de l'échec est lisible** — pas un code d'erreur brut, mais ce
      qu'il faut faire : réseau absent, session expirée, donnée refusée.
- [ ] **Une écriture qui a échoué reste dans la file**, et redevient émissible.
      L'échec ne supprime rien.
- [ ] **La réémission est idempotente** : envoyer deux fois la même écriture ne
      crée **qu'une** écriture. Test central : la coupure au milieu de l'envoi,
      suivie de la réémission, puis décompte — **une** créance, **un** paiement,
      **un** mouvement, **une** commande servie.
- [ ] **L'idempotence est portée par l'identifiant d'origine** (généré sur
      l'appareil), pas par une clé recalculée. Une clé recalculée peut changer
      entre deux émissions.
- [ ] **La décomptabilité est le test** : on ne vérifie pas qu'aucune erreur n'est
      signalée, on **compte** les objets créés. Une écriture qui se répète sans
      bruit est exactement le cas qu'un test d'absence d'erreur ne voit pas.
- [ ] **Le double envoi reste possible hors-ligne** et la détection est garantie —
      ADR-0004. Ne pas « renforcer » la chose en empêchant la réémission : c'est
      l'envoi qui se répète, la détection qui doit être fiable.
- [ ] **Le conflit détecté par la réémission est versé à la réconciliation**, pas
      résolu par le logiciel — voir le ticket 04. La synchronisation ne tranche
      jamais.
- [ ] **Une synchronisation partielle est signalée comme telle** : on dit ce qui
      est passé et ce qui attend. « Synchronisé » signifie tout ; un état mélangé
      doit se nommer autrement.
- [ ] **La file se vide dans l'ordre** et l'agent voit la file se réduire. Un
      compte qui ne bouge pas est un compte qui indique un problème.
- [ ] **L'horodatage local est conservé et le serveur enregistre sa réception**
      comme seconde heure — deux horloges, jamais une seule. Invariant 6.
- [ ] **Les échecs de synchronisation sont journalisés**, et la journalisation ne
      dépend pas de la réussite : enregistrer un échec ne doit pas nécessiter ce
      qui a manqué.
- [ ] **La synchronisation n'exige aucune permission métier.** C'est un geste
      technique sur sa propre file, pas une action métier : l'agent réémet ce
      qu'il a déjà le droit d'écrire, il ne décide de rien de nouveau. Exiger
      `commande.servir` ici rendrait la synchronisation inaccessible à l'agent qui
      n'a fait qu'enregistrer un paiement — et l'empêcherait de sortir de la file
      qui l'attend. Cette négation est écrite en toutes lettres parce que
      l'instinct de poser une porte est naturel, et qu'ici il enfermerait
      l'agent dans son propre retard.
- [ ] Test navigateur mince : la réussite et l'échec sont visibles à l'écran, avec
      leur contenu, et la file en attente reste consultable.
