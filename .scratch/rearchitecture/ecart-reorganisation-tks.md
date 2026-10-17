# Écarts entre `REORGANISATION-TKS.md` et le dépôt réel

**Date** : 2026-10-14
**Statut** : rapport de vérification. Le document n'a **pas** été exécuté.
**Règle appliquée** (celle du document lui-même) : « Si le dépôt contredit
ce document, le dépôt a raison : signale l'écart et adapte. »

`REORGANISATION-TKS.md` a été écrit à partir de `MAP.md` **sans lecture du
code**. Sept de ses affirmations ne tiennent pas. Aucune n'a été corrigée
en douce.

| # | Le document affirme | Le dépôt dit | Suite |
| --- | --- | --- | --- |
| 1 | §8 Phase F : re-colocaliser les tests unitaires dans `src/` | Le porteur a décidé la séparation totale ; c'est consigné dans **ADR-0008** | **Phase F annulée.** Un garde-fou l'interdit mécaniquement. |
| 2 | §5.12 « Aucun `AGENTS.md` / `CLAUDE.md` » | Les deux existent, et sont suivis par git | **Phase H ne doit pas les créer.** Ils vivaient. |
| 3 | §5.11 `donnees/` « peut contenir des données de vrais clients » | `donnees/` est **déjà** dans `.gitignore` et non suivi par git | Non-problème. Rien à faire. |
| 4 | §5.8 « `/admin` + `/admin/dashboard` : deux entrées pour une page » | `src/app/admin/page.tsx` fait déjà `redirect(DESTINATION_ADMIN + "/dashboard")`. Idem `/agent` | **C1 est déjà fait.** Rien à corriger. |
| 5 | §5.6 D2 : `team-switcher`, `nav-projects`, `nav-main`, `app-sidebar` « possiblement morts » | Seuls `team-switcher` et `nav-projects` ont **zéro** import. `nav-main`, `nav-user`, `app-sidebar` sont utilisés | La liste de code mort est de **2**, pas de 4. |
| 6 | §5.10 « `tests/` **et** `src/**/*.test.*` : deux conventions » | Il n'y avait qu'une convention, la co-location. `tests/` n'existait pas avant cette session | Le constat est **faux** et la résolution qu'il propose est **inversée**. |
| 7 | §4 D4 « `src/socole/` : faute de frappe pour `socle` ? » | **Vrai** — et c'est une faute que j'ai introduite en P0, le même jour | Signalé, corrigé au même moment que la décision. |

## L'écart qui bloque l'exécution

`git status` n'est pas propre : un **second chantier écrit dans le dépôt en
ce moment même** (S4, dossier client), et il a généré la migration
`drizzle/0019_lush_whizzer.sql` ainsi que des modifications de
`drizzle.config.ts`, `drizzle/meta/_journal.json` et `src/lib/db/client.ts`.

Or le document interdit explicitement d'éditer `drizzle/*.sql` et
`drizzle/meta/` (§2), et son §1.5 impose un `git status` propre avant de
commencer. Poser soixante `git mv` par-dessus un travail en cours
produirait un dépôt où on ne sait plus qui a écrit quoi.

**Rien n'a été déplacé.** Aucune branche n'a été créée, aucun `git mv`
n'a été lancé.

## Ordre d'exécution recommandé

Le document propose A → B → C → D → E → F → G → H. Cet ordre a un défaut :
les garde-fous d'architecture (`src/socole/architecture/`) lisent la
structure du dépôt, et le §G ne les adapte qu'en septième position. Les
déplacer d'abord, c'est les laisser mentir en silence pendant six phases.

**A → B → G → D → E → C → H**

G avant D : on remet la mesure d'aplomb avant de déplacer quoi que ce soit.
C après D : les routes ne changent pas de forme quand on renomme les
modules qu'elles importent.

## Ce que la phase D trouve déjà en place

`src/modules/clients/` existe déjà, créé par le chantier parallèle : c'est
exactement l'arborescence cible du §7 du document. Le découpage par
contexte métier a donc **commencé sans attendre** la réorganisation. Deux
points à corriger quand ce chantier sera fini : ses deux tests sont dans
`src/` (interdits par ADR-0008, et nommés dans `EXCEPTIONS_TESTS`), et
`dossier.ts` importe encore `@/lib/db/schema/s1-comptes` pour la
normalisation du téléphone — un couplage que le document avait prévu et
qu'il avait nommé « transitoire ».
