# Déploiement — ordre des opérations

Ce document décrit l'ordre **exact** des opérations de déploiement. L'ordre
compte : deux de ces étapes ne sont pas réversibles par un simple `DROP TABLE`,
et le backfill doit passer entre deux migrations.

## Ordre

```bash
pnpm db:migrate                              # 1. schéma
pnpm db:backfill-annotations-profil          # 2. données
pnpm test:db                                 # 3. vérification contre la base
```

### 1. `pnpm db:migrate`

Applique les migrations Drizzle dans l'ordre du journal. Chaque migration de
cette série est **additive** : `CREATE TABLE`, `ADD COLUMN`, ou un unique
`MODIFY` d'élargissement.

| Migration | Opération | Réversible par |
| --- | --- | --- |
| 0020 | `CREATE TABLE acces_profil_clients` | `DROP TABLE` |
| 0021 | `CREATE TABLE demandes_acces_profil` | `DROP TABLE` |
| 0022 | `ADD annotations_clients.profil_client_id` | `DROP COLUMN` |
| 0023 | `MODIFY journal_audit.entite_id` → `varchar(128)` | sans risque |
| 0024 | `ADD profils_clients.origine`, `ADD comptes_clients.profil_candidat_id` | `DROP COLUMN` |
| 0025 | `ADD profils_clients.nom_normalise` + index | `DROP COLUMN` |

0023 est le seul `MODIFY` du projet. Il **élargit** une colonne : aucune donnée
existante n'est tronquée, et aucune donnée n'est perdue.

0024 et 0025 sont additives, mais **elles ont besoin du backfill qui suit** :
sans lui, `nom_normalise` reste vide et la détection de doublon par nom ne
trouve rien. L'ordre migrate-puis-backfill n'est donc pas négociable.

### 2. `pnpm db:backfill-annotations-profil`

Recompose les étiquettes existantes sur le profil du shop, et normalise les
noms de boutique.

- **Étape 1 — normaliser les noms.** Remplit `profils_clients.nom_normalise`.
  Sans cette étape, une boutique déjà enregistrée n'est pas retrouvée à
  l'inscription.
- **Étape 2 — rattacher les étiquettes.**
- **Idempotent** : ne traite que les lignes dont `profil_client_id` est `NULL`.
- **Vérifie sa propre sûreté** : si le nombre d'étiquettes a changé, il échoue
  au lieu de terminer.
- **Ne devine rien** : une étiquette dont le compte n'a pas d'accès actif reste
  sans profil. Elle attend une confirmation d'accès humaine.
- **Rapporte ses chiffres** : total avant, total après, nombre rattaché, nombre
  laissé en l'état.

`profil_client_id` reste **nullable**. Le resserrer en `NOT NULL` est une
opération ultérieure, après la bascule des dettes (S10) — pas avant.

### 3. `pnpm test:db`

Contre la vraie base. Doit sortir `14 passed`. Ce n'est pas un contrôle de
fumée : c'est la seule façon de prouver que les contraintes `UNIQUE` tiennent
et qu'un accès révoqué libère bien son profil.

## Ce qui doit être vert avant de considérer le déploiement fait

| Commande | Attendu |
| --- | --- |
| `pnpm lint` | 0 erreur |
| `npx tsc --noEmit` | aucune sortie |
| `pnpm test` | tout passe |
| `pnpm test:db` | tout passe |

## Retour arrière

L'ordre inverse, migration par migration :

```sql
DROP TABLE `demandes_acces_profil`;
DROP TABLE `acces_profil_clients`;
ALTER TABLE `profils_clients` DROP COLUMN `nom_normalise`;
ALTER TABLE `comptes_clients` DROP COLUMN `profil_candidat_id`;
ALTER TABLE `profils_clients` DROP COLUMN `origine`;
ALTER TABLE `annotations_clients` DROP COLUMN `profil_client_id`;
```

**Attention à 0022.** Après le `DROP COLUMN`, les étiquettes existent mais ne
sont plus rattachées à aucun profil : la PR 5 est annulée. C'est acceptable
parce qu'aucune écriture financière ne dépend de cette colonne — il n'en
existe pas encore.

Si seul le backfill doit être annulé : `UPDATE annotations_clients SET
profil_client_id = NULL`. L'opération est réversible parce qu'elle n'a rien
supprimé.

## Ce que ce déploiement ne livre pas

- **Aucune donnée financière.** Les tables `creances` et `paiements`
  n'existent pas encore (S5, S6). Rien à migrer de ce côté.
- **Pas de récupération de compte.** Le parcours « téléphone perdu » existe par
  ses briques — révocation d'un accès, nouveau compte, nouvel accès au même
  profil — mais la procédure sécurisée de récupération (pièce d'identité,
  accès temporaire) n'est pas implémentée. C'est le ticket S1-05.
- **Pas de bascule des dettes du classeur.** C'est S10, avec sa simulation
  préalable obligatoire.