# DB TKS — 01 Admin (comptes administrateurs)

> Pensée avant implémentation. Specs sources : `.scratch/s1-authentication/spec.md` (stories 1-4, 40-42), `.scratch/s2-roles-permissions-audit/spec.md` (stories 15-19).
> Vocabulaire : `GLOSSARY.md` — compte = connexion, jamais le dossier.

## Périmètre de ce fichier

Uniquement le staff : `ADMIN_PRINCIPAL`, `ADMIN_TECHNIQUE`, `AGENT`. Les clients sont à part dans `02-comptes-clients.md`, jamais dans le même tableau.

Stack imposée ADR-0006 : Next.js + MySQL + Drizzle + better-auth. better-auth génère ses propres tables (`user`, `session`, `account`, `verification`, `twoFactor`) via `npx auth generate`. On ne les détourne pas, on s'y branche par FK.

Rôles staff : email + mot de passe (`emailAndPassword`) + 2FA TOTP obligatoire pour les deux admins (`twoFactor()`). Agent par lien d'invitation, puis email + mot de passe, sans 2FA.

## Tables envisagées

### 1. `comptes_staff` — tableau réservé staff

Socle S1 + ADR-0006. Un compte staff peut exister seul, sans dossier.

* `id CHAR(36) PK` — UUID généré côté appareil (jamais `AUTO_INCREMENT` comme identité répliquée).
* `better_auth_user_id VARCHAR(255) UNIQUE NOT NULL FK -> user.id` — lien vers la table `user` de better-auth. C'est better-auth qui hash le mot de passe et gère la session cookie serveur.
* `email VARCHAR(255) UNIQUE NOT NULL` — identifiant staff. Miroir de `user.email`, contrainte d'unicité répétée ici pour l'audit et les vues métier.
* `role TEXT CHECK IN ('ADMIN_PRINCIPAL','ADMIN_TECHNIQUE','AGENT') NOT NULL` — immuable après création. Changement = révocation + recréation tracées (S2).
* `etat TEXT CHECK IN ('VALIDE','REVOQUE')` — staff jamais `EN_ATTENTE_VALIDATION` : créé par admin principal via invitation (agent) ou bootstrap (admin).
* `cree_par CHAR(36) FK -> comptes_staff.id NULL` — NULL pour le premier admin principal.
* `created_at, revoked_at NULL`

Contraintes : `UNIQUE(email)`, `UNIQUE(better_auth_user_id)`, index sur `role, etat`. Aucun téléphone ici, aucun client ici.

### 2. `facteurs_2fa_admin`

S1 stories 2-4 + plugin `twoFactor()` better-auth. Uniquement pour les deux rôles admin. La table `twoFactor` de better-auth stocke le secret ; ici on garde la traçabilité métier.

* `id CHAR(36) PK`
* `compte_staff_id CHAR(36) FK -> comptes_staff.id UNIQUE` — un facteur actif par admin.
* `nom_appareil TEXT` — « téléphone du chef », exigence S1-3.
* `actif BOOLEAN DEFAULT true`
* `cree_le, remplace_le NULL, cree_par CHAR(36) FK`

Règle : login admin sans TOTP = refus + journalisé. Perte = remplacement bout-en-bout testé, pas de bypass. Secrets TOTP jamais lisibles par admin technique.

### 3. `invitations_agents`

S1 stories 5-8. Le lien fixe le rôle, pas l'identifiant. Crée un `comptes_staff` rôle `AGENT`, jamais un client, jamais un admin.

* `id CHAR(36) PK`
* `jeton VARCHAR(255) UNIQUE NOT NULL` — usage unique, présenté deux fois = un seul compte (test idempotence, y compris offline puis synchro via outbox Dexie `op_id`).
* `role_cible TEXT DEFAULT 'AGENT' CHECK = 'AGENT'` — ne peut pas créer un admin.
* `expire_le TIMESTAMP NOT NULL` — choisie par admin principal, défaut configurable.
* `consomme_le NULL, consomme_par CHAR(36) NULL`
* `cree_par CHAR(36) FK -> comptes_staff.id`

### 4. Tables better-auth utilisées telles quelles

Générées par `npx auth generate --output src/db/auth-schema.ts`, provider `mysql` (skill `better-auth-best-practices`) :

* `user` : `id, name, email UNIQUE, emailVerified, image, createdAt, updatedAt` + `phoneNumber` via plugin `username()` pour clients, `role` miroir applicatif.
* `session` : sessions cookie serveur + cache local à durée bornée vérifié sans réseau (S1-T6, ADR-0006).
* `account` : hash mot de passe `emailAndPassword`, jamais lu par admin technique.
* `verification` : vérifications email si activées.
* `twoFactor` : secrets TOTP admins.

Aucune écriture métier directe via Server Action : toute écriture passe par outbox IndexedDB puis `/api/sync` idempotent (ADR-0006). `sessions` custom S1 supprimée — on utilise `session` better-auth + `appareil_id` en `additionalFields` si besoin diagnostic S2.

### 5. `acces_temporaires_reset_staff`

Reset staff par admin principal, sur pièce d'identité. Clients : voir `02-comptes-clients.md`.

* `id CHAR(36) PK`
* `compte_staff_cible FK, ouvert_par FK, piece_id FK`
* `expire_le TIMESTAMP courte durée`
* `consomme_le NULL` — révoqué dès nouveau mot de passe choisi. Ne donne accès qu'au choix du mot de passe (test : tentative commande métier = refus).
* `avertissement_affiche BOOLEAN` — tant qu'ouvert, l'admin voit l'avertissement.

### 6. `pieces_identite_staff`

* `id CHAR(36) PK, compte_staff_id FK, type_piece, reference_image, vue_par FK, vue_le`

Exige pour toute action sensible : aucun chemin sans `piece_id`.

## Liens avec S2 (rappel pour 03-roles-audit)

* Admin technique : lecture + diagnostic oui, écriture métier jamais, ne peut pas s'auto-accorder, ne voit ni mot de passe ni 2FA. Tout visible par chef.
* Chaque action ci-dessus (création compte, invitation, validation, reset) produit un événement `journal_audit` avec acteur, rôle au moment de l'action, avant/après, appareil, horodatage local + réception.

## Prochaine étape

`02-comptes-clients.md` créé : `comptes_clients`, `pieces_identite_clients`, `validations_clients`. Ensuite `03-roles-audit.md` : permissions une par une, zéro par défaut, `journal_audit` append-only (`REVOKE UPDATE, DELETE` + triggers MySQL, ADR-0006).
