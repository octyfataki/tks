# 10 : Revue d'une pièce d'identité déposée après la validation

**Status:** ready-for-agent

**Sévérité :** haute (promesse sans suite — l'interface annonce « à revoir »
et aucun geste ne permet de le faire)

**Portée :** `S1-authentication` — `pieces_identite_clients`,
`src/lib/s1-comptes/pieces-clients.ts`, `src/components/clients/actions.ts`,
`src/components/clients/fiche-client.tsx`,
`src/components/profil/piece-identite-liste.tsx`.

## Contexte

Depuis l'issue #24 (PR #25), un compte client `VALIDE` peut **remplacer** sa
pièce d'identité depuis `/clients/profil`. L'ancienne pièce reste au profil,
et la fiche du distributeur la signale « Déposée après validation — à revoir ».

Mais aucun geste n'existe pour traiter cette pièce. La fiche
`/admin/clients/[id]` n'affiche les formulaires de décision que si
`etatTranchable(etat)` est vrai, c'est-à-dire `EN_ATTENTE_VALIDATION` ou
`REFUSE` : un compte `VALIDE` tombe volontairement dans la branche « Compte
validé : il peut se connecter… » + « Révoquer ».

Résultat : un dépôt post-validation est un cul-de-sac. L'interface promet une
revue, aucun écran ne la permet. C'est la phrase de la spec S1 (*Testing
Decisions* : « La pièce d'identité est conservée et consultable lors d'une
deuxième demande ») qui n'a pas de suite.

Cas réel constaté sur le compte `96c9f9c2-2dc8-4868-a22a-ee247006ebf9`
(`VALIDE` le 09/10) : deux pièces déposées le 11/10, toutes deux « à revoir »,
aucun geste possible.

## Décisions

Validées avec le propriétaire :

1. Le geste porte sur **la pièce**, pas sur le compte. La validation de compte
   (qui change l'état) reste inchangée.
2. Deux verdicts : **accepter** ou **refuser**, le refus portant un motif
   obligatoire affiché au client — même règle que le refus de compte (ticket
   03).
3. **Le compte reste `VALIDE`** quelle que soit la décision sur la pièce.
   L'identité reste celle validée au comptoir ; seule la pièce de remplacement
   est refusée. Aucun client en service n'est bloqué pour un document de
   remplacement.
4. Le client voit le verdict sur son profil : motif en clair, et le bouton
   « Remplacer ma pièce » reste disponible.
5. Les boutons **Accepter / Refuser sont sur chaque pièce à revoir**, à sa
   hauteur, pas dans une zone « Actions » globale.
6. Qui peut statuer : agent avec `client.valider`, administrateur principal,
   administrateur technique — la même porte que `peutTrancher` déjà utilisée
   par valider / refuser / révoquer.

## Écarts assumés

- **GLOSSARY, « Administrateur technique »** : « ne détient aucun pouvoir
  métier : ni taux, ni plafond, ni promotion de client ». Statuer sur une pièce
  d'identité en est un. L'écart est **préexistant** : `peutTrancher`
  (`src/components/clients/actions.ts:59`) autorise déjà l'administrateur
  technique à valider un compte entier. On suit le code existant, on ne
  contourne rien en silence.
- **ADR-0003 (offline-first)** : le modèle doit être réplicable, et l'ADR
  qualifie d'invalidation de S8 « un `id` généré par la base, un `created_at`
  posé par le serveur ». `pieces_identite_clients` est **déjà** dans ce cas
  (`id` en `randomUUID`, `created_at` en `defaultNow()`). `statut_piece` et
  `refus_motif` prolongent cet écart : **ils devront être repris par la
  réconciliation S8**, au même titre que le reste de la table.
- **Offline (règle 5 d'AGENTS.md)** : la revue sera une écriture métier
  queueable hors-ligne *en principe*. Comme les décisions existantes
  (`valider`, `refuser`, `révoquer`), elle est implémentée en **ligne
  uniquement** — la limite est préexistante et concerne tout le bloc de
  décisions S1, pas ce geste seul.

## Critères d'acceptation

- [ ] `pieces_identite_clients` porte `statut_piece`
      (`EN_ATTENTE` | `ACCEPTEE` | `REFUSEE`, défaut `EN_ATTENTE`) et
      `refus_motif` (null par défaut). Migration additive ; `vue_par` /
      `vue_le` conservés ; backfill `vue_par IS NOT NULL → ACCEPTEE`.
- [ ] L'état d'une pièce est **une seule vérité** : le `statut`. L'heuristique
      « déposée après validation » (comparaison de dates) est retirée.
- [ ] Une pièce vue pour valider un compte passe à `ACCEPTEE` : une pièce vue
      puis acceptée, ou vue puis refusée.
- [ ] Statuer exige : être autorisé à trancher, que la pièce appartienne au
      compte, que la pièce soit `EN_ATTENTE`, et que le compte soit `VALIDE`.
      Chaque garde refusée a son message.
- [ ] Le refus exige un motif (3 à 500 caractères) ; l'acceptation n'en exige
      pas.
- [ ] Le verdict est écrit **dans la même transaction que le journal**
      (`piece.accepter` / `piece.refuser`, qui / quand / quel compte /
      quelle pièce). Journal indisponible = rien n'est écrit.
- [ ] **Aucun changement d'état du compte**, quel que soit le verdict.
- [ ] Fiche distributeur et agent : chaque pièce `EN_ATTENTE` affiche
      **Accepter** et **Refuser** sous sa vignette ; refusée → motif lisible ;
      acceptée → « Acceptée le … ».
- [ ] Profil client : « Pas encore vue » / « Acceptée par le distributeur » /
      « Refusée — à refaire » + motif en clair, bouton « Remplacer ma pièce »
      toujours disponible.
- [ ] Un compte `REFUSE`, `EN_ATTENTE_VALIDATION` ou `REVOQUE` ne propose
      **aucun** de ces boutons : son chemin reste la validation de compte.
- [ ] Tests : règles pures, structure du schéma, motif obligatoire côté
      formulaire, les trois états côté client, boutons absents sur pièce déjà
      statuée. Suite complète verte.

## Comments