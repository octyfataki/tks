# DB TKS — 02 Comptes clients (tableau séparé)

> Pensée avant implémentation. Specs : S1 stories 23-39, S4 rattachement. Séparé de `01-admin-comptes.md` par décision : staff et clients ne partagent jamais le même tableau.

## `comptes_clients`

* `id CHAR(36) PK` — UUID appareil, jamais `AUTO_INCREMENT`.
* `better_auth_user_id VARCHAR(255) UNIQUE NOT NULL FK -> user.id` — auth via plugin `username()` téléphone + mot de passe (ADR-0006). Pas de SMS, pas d'OTP.
* `telephone VARCHAR(32) UNIQUE NOT NULL` — clé du compte client. Peut être partagé entre dossiers ? Non : téléphone unique ici pour le compte, mais `dossiers_clients.contact` reste non-unique (GLOSSARY : deux dossiers peuvent partager un contact).
* `etat TEXT CHECK IN ('EN_ATTENTE_VALIDATION','VALIDE','REFUSE','REVOQUE') NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION'` — inscription crée `EN_ATTENTE_VALIDATION`, ne peut rien faire : pas de dossier, pas de solde, pas de commande même prépayée.
* `created_at, valide_le NULL, refuse_motif NULL`

Aucune colonne `role` ici — l'appartenance client est donnée par la table elle-même. Audit `acteur` devra donc porter `acteur_staff_id NULL + acteur_client_id NULL + CHECK un seul non-nul`.

## `pieces_identite_clients` + `validations_clients`

Validation exige pièce vue humain, journalisée qui/quand/quelle pièce (S1).

* `pieces_identite_clients : id, compte_client_id FK, reference_image, vue_par_staff FK, vue_le`
* `validations_clients : id, compte_client_id FK, decideur_staff_id FK, decision VALIDE/REFUSE, motif, piece_id FK, at`

Aucun chemin vers `VALIDE` sans `piece_id` — verrouillé par test applicatif + contrainte `NOT NULL`.

### Verdict d'une pièce (tickets 10 et 11)

Une pièce porte son propre verdict, distinct de « un humain l'a ouverte » :

* `statut_piece VARCHAR(32) NOT NULL DEFAULT 'EN_ATTENTE'` — `EN_ATTENTE` /
  `ACCEPTEE` / `REFUSEE` / `RETIREE`. La liste fermée est vérifiée par
  l'application (`STATUTS_PIECE` dans `comptes/fiche-client.ts`) : une
  valeur hors liste est ramenée à `EN_ATTENTE` à la lecture, jamais rendue
  telle quelle.
* `refus_motif TEXT NULL` — ce que le client doit corriger, quand
  `REFUSEE`. Jamais exigé ailleurs.
* `vue_par` / `vue_le` restent **ce qu'ils disaient déjà** : qui a ouvert le
  document, et quand. Un refus suppose d'avoir vu.

Le retrait (`RETIREE`) ne supprime **ni la ligne ni le fichier** : le
client dit « celle-là ne compte plus », il n'efface rien (invariant 10).
Seule une pièce `REFUSEE` est retirable, et une fois — une pièce en attente
est hors de la portée du client.

`RETIREE` n'a demandé **aucune migration** : la colonne existe depuis le
ticket 10, c'est sa liste de valeurs qui s'est élargie.

## Rattachement (rappel, détaillé en S4)

`rattachements : compte_client_id UNIQUE FK, dossier_id FK, par_staff_id FK, at` — 1 compte -> au plus 1 dossier, 1 dossier -> au plus 1 compte. Désignation par nom affiché (nom+adresse+solde), jamais téléphone seul.
