# DB TKS — 03 Rôles, permissions, audit

> Pensée avant implémentation. Sources : `.scratch/s2-roles-permissions-audit/spec.md`, ADR-0006, GLOSSARY invariants 7-8.
> Dépend de `01-admin-comptes.md` et `02-comptes-clients.md` : plus de table `comptes` unique.

## Principes

* 4 rôles exactement : `ADMIN_PRINCIPAL`, `ADMIN_TECHNIQUE`, `AGENT`, `CLIENT`. Rôle immuable. Changer = révoquer + recréer, les deux tracés.
* Permissions granulaires, attribuables une par une. Zéro par défaut. Absence = refus. Liste fermée définie dans le code, jamais modifiable à l'exécution.
* Liste initiale complétée par S5 (decomposition.md) : `taux`, `plafond`, `promotion`, `ecriture_financiere`, `mouvement_tresorerie` + `dossier_client`, `grille_tarifaire`, `preuve_paiement`, `commande`, `reconciliation`. Une spec qui introduit une action ajoute son nom ici.
* Admin technique : lecture + diagnostic oui, écriture métier jamais, ne peut pas s'auto-accorder, ne voit ni mot de passe ni 2FA. Toute tentative refusée + journalisée.

## Tables envisagées

### 1. `permissions` — référentiel fermé

* `nom VARCHAR(64) PK` — ex. `commande.servir`, `preuve.valider`, `taux.saisir`. Seed par migration, aucun INSERT runtime (contrainte applicative + test).
* `description TEXT`

MySQL : table seedée en `000X`, `REVOKE INSERT, UPDATE, DELETE` pour rôles applicatifs sauf migration.

### 2. `attributions_permissions`

* `id CHAR(36) PK`
* `compte_staff_id CHAR(36) FK -> comptes_staff.id` — uniquement staff. Clients n'ont aucune permission métier, pas de ligne ici.
* `permission_nom FK -> permissions.nom`
* `accordee BOOLEAN` — accorder / retirer une par une, chaque changement tracé.
* `par_staff_id FK, at, op_id CHAR(36) UNIQUE` — `op_id` = idempotence offline (outbox Dexie -> `/api/sync`).
* `UNIQUE(compte_staff_id, permission_nom)` — une ligne par couple, historique via journal pas via doublons.

Profil prédéfini = raccourci de seed applicatif, pas de table `profils`. Retirer une permission du profil = `accordee=false`, testé.

Conflit offline (deux modifs concurrentes même permission) : ne pas écraser, créer `dossiers_reconciliation` (S8), tranche humaine.

### 3. `journal_audit` — append-only par la base

* `id CHAR(36) PK` — généré appareil, jamais réécrit serveur.
* `acteur_staff_id CHAR(36) NULL FK, acteur_client_id CHAR(36) NULL FK, CHECK un seul non-nul` — split 01/02 oblige le polymorphisme. Rôle au moment de l'action dénormalisé : `role_acteur TEXT`.
* `action TEXT` — ex. `compte.valide`, `permission.accorde`, `commande.servie`, `permission.refusee`.
* `entite TEXT, entite_id CHAR(36)` — pour remonter le fil d'un enregistrement.
* `avant JSON NULL, apres JSON NULL`
* `appareil_id TEXT, created_local_at TIMESTAMP, received_server_at TIMESTAMP` — les deux visibles, local jamais réécrit.
* `resultat TEXT CHECK IN ('SUCCES','ECHEC')` — échecs journalisés aussi, dont refus permission et tentative auto-attribution admin technique.
* `op_id CHAR(36) UNIQUE` — idempotence sync, survit au redémarrage (jamais purgé avant ACK serveur).

Verrouillage MySQL (ADR-0006) :
```sql
REVOKE UPDATE, DELETE ON tks.journal_audit FROM 'app'@'%';
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON journal_audit FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='audit append-only';
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON journal_audit FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='audit append-only';
```
Test structurel S2 : UPDATE/DELETE direct en base avec droits applicatifs = rejetés. Consultations sensibles par admin technique = ligne d'audit aussi.

## Liens better-auth

* Session : table `session` better-auth + `appareil_id` en `additionalFields` si besoin diagnostic, sans y stocker de chiffres métier.
* Secrets (`account`, `twoFactor`) exclus du journal `avant/après` — on trace « reset effectué » sans valeur secrète.

## Prochaine étape

`04-taux-monnaie.md` (S3) : `taux_change` un jour un taux, `creances`/`paiements` montant+devise sans taux, exemple 100 USD @2300 = 65000 CDF reste.
