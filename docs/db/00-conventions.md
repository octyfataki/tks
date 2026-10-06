# DB TKS — 00 Conventions

> Dossier de pensée avant implémentation. Aucun SQL ici n'est appliqué.
> Le SQL appliqué vivra dans `drizzle/` en migration-first.

Références normatives : `GLOSSARY.md`, `docs/adr/0001` à `0005`, `.scratch/decomposition.md`, specs S1 et S2.

## Règles globales

1. **Migration-first (skill `drizzle-migrations`)** : SQL d'abord `drizzle/000X_*.sql`, puis miroir TypeScript `src/lib/db/schema/`. Ne jamais modifier une vieille migration, créer une nouvelle.
2. **IDs générés client** : `uuid PK DEFAULT gen_random_uuid()`, jamais de serial attribué serveur. Horodatage local conservé tel quel + horodatage réception serveur séparé (S2).
3. **Dérivés jamais stockés** : pas de `dette`, `reste_a_payer`, `solde_tresorerie`, pas d'agrégat. Invariant GLOSSARY 1.
4. **Pas de taux sur écriture** : `creances` et `paiements` = `montant + devise`, jamais de colonne taux. Invariant 5 + ADR-0001.
5. **Append-only** : `journal_audit` sans UPDATE/DELETE par contrainte base. Corrections par écriture inverse, jamais de DELETE (invariant 10).
6. **Vocabulaire** : `compte` != `dossier`, téléphone = clé du compte jamais du dossier, `commande` jamais `realisation`/`vente`, pas de `shop`, `virtuel`, `facture`.
7. **Organisation (skill `architecture-patterns`)** : un dossier par contexte dans `src/lib/db/schema/sN-*/`, export via `index.ts`. Exemple : `s1-comptes/`, `s2-acces/`.

## Conventions nommages

* Tables en `snake_case` pluriel : `comptes`, `dossiers_clients`.
* Colonnes en `snake_case`, propriété TS en `camelCase` : `compte_id` -> `compteId`.
* Enums en TEXT + CHECK, pas d'enum natif pour rester portable SQLite/Postgres PWA.
* Chaque table mutable métier : `id uuid PK, created_at, idempotence_key UNIQUE` pour S8.
