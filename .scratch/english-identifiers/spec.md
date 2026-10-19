Status: ready-for-human

# Vocabulaire anglais pour le code et la base

Décision du porteur : **le code et la base parlent anglais**, la documentation
normative reste en français, les libellés affichés aux utilisateurs restent en
français. Ce chantier est **préalable à S5** et se livre en trois lots.

## Ce qui est vrai aujourd'hui

| Ce qui est stocké | Valeur en base |
| --- | --- |
| États d'un compte client | `EN_ATTENTE_VALIDATION`, `VALIDE`, `REFUSE`, `REVOQUE` |
| Statut de crédit | `EN_EVALUATION`, `PRIVILEGIE` |
| Étiquettes | `A_SURVEILLER`, `BON_PAYEUR`, `CLIENT_CONFIANCE` |
| Permissions | `commande.creer`, `dossier.creer`, `preuve.valider`, `taux.saisir` |
| Rôles | `ADMIN_PRINCIPAL`, `ADMIN_TECHNIQUE`, `AGENT` — dans 22 fichiers |
| Tables | `profils_clients`, `comptes_clients`, `taux_change`, `journal_audit` |

Les dossiers et les identifiants sont déjà en anglais (`src/modules/clients`,
`/clients/settings`, `lireTableauDeBord`). Ce qui manque, ce sont les **valeurs**
et les **noms de tables**.

## La règle qui rend ça tenable

Le `GLOSSARY.md` **reste le vocabulaire normatif du métier, en français** : c'est
la langue du client, des agents et des décisions. Ce qui change est qu'il gagne
une **table de correspondance** — une ligne par valeur stockée, avec son
identifiant anglais — et que la base ne stocke plus que cet identifiant.

> `EN_LIGNE` → `ONLINE` · `PRESENTIEL` → `COUNTER` · `PREPAYE` → `PREPAID`

Sans cette table, le glossaire cesse de décrire le code et devient une archive.
Avec elle, un terme métier a exactement deux écritures : la phrase qu'on dit, et
la valeur qu'on stocke. **Le test doit échouer si un terme du glossaire n'a pas
d'identifiant** — sinon la correspondance se perd à la première addition.

## Les trois lots

| Lot | Contenu | Ticket |
| --- | --- | --- |
| 1 | La **table de correspondance** : chaque terme du glossaire reçoit son identifiant anglais. Documents seulement, aucune migration. | `issues/01-table-de-correspondance.md` |
| 2 | **Littéraux de domaine** : états, statuts, étiquettes, rôles, permissions, types de journal. Code **et** migration de données, sur une base qui tourne. | à écrire après le lot 1 |
| 3 | **Tables et colonnes** : `profils_clients` → `client_profiles`, etc. Renommage seul, aucun changement de comportement. | à écrire après le lot 2 |

## Ce que le chantier ne fait pas

- Il ne touche **aucun libellé affiché** : l'interface reste en français.
- Il ne change **aucune règle métier**. ADR-0001 à ADR-0008 sont intacts.
- Il ne réécrit ni les ADR, ni les specs, ni `.scratch/` : ce sont des archives
  datées, et leur langue est celle de la décision.

## Contrainte d'exécution

**La copie de travail doit être propre avant de commencer.** Une règle du dépôt
interdit d'empiler un renommage sur un travail en cours — `drizzle.config.ts`,
`drizzle/meta/_journal.json` et `src/components/client-sidebar.tsx` sont
modifiés, et deux snapshots ne sont pas suivis. Le lot 2 produit une migration
de données : commencer sur un arbre sale rendrait la relecture indéchiffrable.

**Un lot à la fois, mergeable seul.** Aucun lot ne se livre à moitié : un
demi-renommage laisse deux vocabulaires dans la même base, ce qui est exactement
ce qu'on cherche à supprimer.
