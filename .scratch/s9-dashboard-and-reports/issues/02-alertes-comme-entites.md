# 02: Les alertes — des entités persistantes, pas des lignes de tableau

**What to build:** Une preuve attend, un double crédit découvert, un client qui a
dépassé son plafond. Le chef doit être **prévenu**, et chaque alerte doit se
compter — combien de preuves en attente, depuis combien de temps, combien de
conflits.

C'est ici que se joue la distinction la plus facile à confondre : **S9 ne ferme
jamais une alerte.** Elle les affiche en tant que **compteurs et listes**, et la
cause seule les fait disparaître. Écrire un bouton « marquer comme traité » ici
produirait exactement ce que la règle refuse — un compteur qui décroche de la
réalité, et une alerte que plus rien ne justifie ni n'explique.

**Blocked by:** 01 — Le matin du chef ; les tickets S5 (preuves), S8 (conflits)

**Status:** ready-for-agent

- [ ] **Les preuves en attente sont signalées** (histoire 11) — une validation
      oubliée est une vente perdue, et la pire partie est qu'on ne s'en aperçoit
      pas.
- [ ] **On voit depuis combien de temps une preuve attend** (histoire 12) —
      l'ancienneté fait remonter les oubliées. Sans elle, tout est « en attente »
      à égalité, donc rien n'est prioritaire.
- [ ] **Les conflits de synchronisation non résolus sont signalés** (histoire 13).
      Un double crédit resté caché est un argent qui s'évapore en silence, et
      c'est précisément ce que la détection doit empêcher.
- [ ] **Les conflits sont comptés par client** (histoire 14), pour voir un motif
      organisationnel et pas seulement des incidents isolés.
- [ ] **Les clients ayant dépassé leur plafond sont listés** (histoire 15), pour
      traiter la cause avant que cela se reproduise. Le dépassement est un fait
      constaté après coup, pas un refus : les deux se nomment différemment.
- [ ] **Les alertes sont ordonnées par urgence** (histoire 16). Un tableau
      alphabétique ou chronologique ne dit pas quoi ouvrir en premier.
- [ ] **Une alerte mène à la chose à décider** (histoire 17), en un geste. C'est
      la différence entre informer et faire agir : un chiffre qu'il faut retrouver
      ailleurs ne sera pas retrouvé.
- [ ] **Chaque alerte est une entité persistante** : identifiant, moment où elle
      est apparue, moment où elle a disparu. Elle n'est pas une ligne recréée à
      chaque consultation — sinon on ne peut pas compter combien il y en avait.
- [ ] **Une alerte apparaît à la donnée, pas à la consultation.** Une alerte qui
      naît quand quelqu'un regarde est une alerte qui n'existe que s'il regarde.
- [ ] **Le compteur d'alertes est exact même hors-ligne**, sur les données
      embarquées, avec la date de leur fraîcheur. Un compteur qui ne dit pas son
      âge fait croire à une absence de problème.
- [ ] **Les alertes se comptent sur une période**, et la période est affichée.
- [ ] **Aucune alerte n'est fermée par S9, et il n'existe aucun bouton pour le
      faire.** C'est la frontière la plus importante de cette branche : **résoudre
      la cause fait disparaître l'alerte ; ne pas la résoudre ne la fait pas
      disparaître.** Un bouton « marquer comme traité » produirait ce que la règle
      refuse — un compteur qui décroche de la réalité, et une alerte que plus rien
      n'explique. Test de propriété, dans les deux sens : créer la situation,
      vérifier l'alerte, résoudre la cause, vérifier la disparition ; puis ne rien
      faire, et vérifier la persistance. Une alerte qui disparaît d'elle-même est
      une notification, pas une alerte.
- [ ] **Un client ne voit que ses propres alertes** — et en pratique il n'en voit
      que les siennes : dépassement de plafond, preuve refusée. Les alertes du
      distributeur ne sont pas les siennes.
- [ ] Test navigateur mince : chaque alerte est cliquable et mène à la chose à
      décider, et le compteur reste visible après navigation.
