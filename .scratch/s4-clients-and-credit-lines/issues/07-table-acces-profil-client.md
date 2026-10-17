# 07 — Table d'accès au profil client, et migration

Status: ready-for-agent

Blocked by: 01 (table `profils_clients`, migration 0019)

## Ce que cette tranche livre

1. La table `acces_profil_clients` : l'autorisation entre un compte client et
   un profil client devient une entité à part entière, tracée et révocable.
2. Les deux règles d'unicité du glossaire, **appliquées par la base** et non
   par le code applicatif.
3. La migration `0020_free_maria_hill.sql`, strictement additive, et sa
   stratégie de rollback.

Elle ne livre **pas** le parcours de confirmation d'accès : ni écran agent, ni
action de confirmation. C'est le ticket 02, qui consommera cette table.

## Ce qui existe déjà, et ce qui n'existe pas encore

| Entité | État |
| --- | --- |
| `comptes_clients` (S1) | existe — le compte est une connexion |
| `profils_clients` (S4-01, migration 0019) | existe — l'identifiant stable de la boutique |
| `acces_profil_clients` | **créée par cette tranche** |
| Créances, paiements, commandes | **n'existent pas encore** (S5, S6) |

**Conséquence directe sur la checklist de migration.** Il n'y a **aucune
opération financière existante** à rattacher : la base ne contient aujourd'hui
que des comptes, des profils, des permissions et un journal d'audit. Le critère
de validation « la migration ne perd, ne duplique et ne réattribue aucune
opération financière » est donc satisfaite **par construction** — cette
migration ne touche aucune table financière, et son test le vérifie.

Ce qui reste à faire arrive avec S5 et S6, et le contrat est écrit : chaque
écriture portera `profil_client_id`, référence de `profils_clients.id`, jamais
`comptes_clients.id`.

## Règles de la table

- `id` est généré sur l'appareil (`varchar(36)`), jamais par la base : un accès
  créé hors-ligne doit conserver son identité (ADR-0003).
- `horodatage_local` est `NOT NULL` et n'est jamais réécrit par le serveur.
  `recu_le` note l'arrivée, il ne remplace rien.
- `decide_par` est `NOT NULL` : aucune décision d'accès n'est anonyme
  (invariant 8).
- `motif` porte le motif d'une révocation ou d'un refus. Une révocation sans
  motif lisible est une décision inexplicable plus tard.
- `statut` ∈ {`ACCORDE`, `REVOKE`}. Une révocation ne supprime **jamais** la
  ligne : elle change d'état. L'historique des décisions reste lisible, et une
  correction d'accès ne déplace aucune écriture (invariant 10).
- **Aucune colonne de téléphone.** Un numéro sert à retrouver des candidats,
  jamais à prouver une identité ni à accorder un accès (invariant 7).

## Les deux unicités, et pourquoi elles sont dans la base

Le glossaire pose deux règles :

- un profil client ne peut avoir qu'un compte client principal actif ;
- un compte client ne peut accéder qu'à un profil client à la fois.

Une règle qui ne tient que dans le code est une règle qu'une requête contourne.
Les deux sont donc des contraintes, vérifiées par MySQL :

| Colonne générée | Expression | Contrainte |
| --- | --- | --- |
| `compte_actif` | `if(statut = 'ACCORDE', compte_client_id, null)` | `UNIQUE` |
| `profil_actif` | `if(statut = 'ACCORDE', profil_client_id, null)` | `UNIQUE` |

Une colonne générée vaut `NULL` dès que l'accès est révoqué, et **plusieurs
`NULL` ne violent pas une contrainte `UNIQUE` en MySQL**. Un profil garde donc
son unicité tant qu'un accès est actif, et se libère à la révocation — sans
effacer l'historique.

## Stratégie de rollback

La migration 0020 est un `CREATE TABLE` unique, sans `ALTER`, sans `UPDATE`, sans
`DROP` : le rollback est la seule instruction inverse.

```sql
DROP TABLE `acces_profil_clients`;
```

**Ce rollback ne détruit aucune donnée métier.** La table ne contient que des
décisions d'accès : les supprimer ramène le système à son état d'avant la
tranche, où aucun accès n'existait. Aucun solde, aucune créance, aucun paiement,
aucun journal d'audit n'y figure.

**Quand le rollback est-il acceptable ?** Toujours, en pratique, parce que la
table est vide ou récente. Il devient destructif **seulement** si des accès ont
été accordés entre-temps : ces décisions d'accès sont alors perdues, mais
aucune écriture financière ne l'est. Le compte concerné perd l'accès à son
profil et doit être re-confirmé — ce qui est exactement la situation d'avant.

**Ordre de retour en arrière.** `drizzle/0020_free_maria_hill.sql` →
`drizzle/0019_misty_drax.sql` → `drizzle/0018_stale_silver_sable.sql`, dans
l'ordre inverse des migrations. La 0019 porte `profils_clients` : la supprimer
avant 0020 laisserait des accès orphelins.

## Décisions restant à trancher

Ces points ne sont pas décidés par cette tranche ; ils sont listés pour que la
question reste visible.

1. **Plusieurs boutiques gérées par une même personne.** Le modèle actuel est
   un compte pour un profil. Une personne qui gère deux boutiques devra-t-elle
   avoir deux comptes ? La contrainte `compte_actif` l'interdit aujourd'hui.
2. **Plusieurs personnes sur une même boutique.** Même verrou côté `profil_actif`.
   Une evolution possible serait de distinguer un accès `PRINCIPAL` d'un accès
   `SECONDAIRE`, ce qui suppose de sortir de la contrainte à deux colonnes.
3. **Changement de propriétaire d'une boutique.** Le profil et son historique
   financier restent ceux de la boutique ; c'est l'accès qui change. La
   révocation puis un nouvel accord sur le même `profil_client_id` exprime
   déjà ce cas. La procédure reste à écrire (ticket 02).
4. **Critères de « correspondance possible »** à la création d'un profil
   (ticket 02, et S10 pour l'import).
5. **Comportement hors-ligne d'une confirmation d'accès** : le tableau autorise
   l'écriture locale, mais rien n'autorise encore un accès accordé hors-ligne.

## Écarts assumés

- **Aucune clé étrangère.** Le projet n'en pose nulle part ; les intégrités sont
  assurées par la couche applicative et les tests. La table ne fait pas
  exception.
- **Permissions `dossier.creer` / `dossier.rattacher` / `dossier.detacher`.**
  Le ticket 02 annonce leur remplacement par `client.acces_confirmer`,
  `client.acces_revoquer`, `client.acces_corriger`. Elles sont **renommées à la
  main dans ce ticket**, avec report des lignes existantes dans
  `permissions_agents` et `permissions_socle_agents` — une décision de données,
  pas de libellé.