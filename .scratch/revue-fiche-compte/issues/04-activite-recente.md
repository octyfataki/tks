# 04: La fiche porte l'activité récente du compte

**What to build:** La fiche « Mon compte » dit ce que le compte a fait. Un
bloc « Activité récente » liste les cinq dernières actions métier du compte,
résumées en français, horodatées, avec un lien vers le journal d'audit. La
lecture est une requête indexée sur `journal_audit.acteur_id`, et le résumé
réutilise `resumerEvenement` — le même résumé que le journal d'audit.

Un compte sans action n'affiche pas de bloc vide : l'absence d'information
est une information.

**Blocked by:** 01 — le socle de la fiche

**Status:** ready-for-agent

- [ ] La fiche affiche les 5 dernières actions métier du compte, résumées en
      français et horodatées.
- [ ] Le bloc renvoie vers le journal d'audit.
- [ ] Un compte sans action n'affiche pas de bloc vide.
- [ ] Les événements dont le résumé n'est pas connu ne sont pas affichés
      comme du texte vide.
- [ ] La fiche client n'affiche pas d'activité : le journal d'audit des
      comptes clients n'est pas indexé sur un acteur client.
