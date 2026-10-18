# Plan de réarchitecture — rendre l'app capable d'absorber le changement

**Statut** : document de travail, **aucune décision prise**. Rien n'est implémenté.
**Date** : 2026-10-14
**Complète** : ADR-0006 (stack), ADR-0007 (squelette). **Contredit** deux décisions
écrites — voir §9, c'est volontaire et ça doit l'être.
**État du code au moment de l'écriture** : S1 à S4 livrées et mergées (28 tickets).
S5, S6, S7, S8, S9, S10 non écrites.

## Avancement

| Phase | État | Ce qui a été fait |
| --- | --- | --- |
| **P0** | ✅ fait | `src/socole/architecture/` — inventaire du code et 12 garde-fous. Aucune dette n'a bougé. |
| **P0 bis** | ✅ fait | Tests séparés : 61 fichiers sortis de `src/` vers `tests/`. Plancher `cheminsNumerotes` resserré de 59 à 40. |
| P1 | ⬜ à faire | Porte d'écriture unique. |
| P2 | ⬜ à faire | Permissions et rôles en données. |
| P3 | ⬜ à faire | Moteur de transitions. **Avant S5.** |
| P4 | ⬜ à faire | Arborescence et coquille uniques. |
| P5 | ⬜ à faire | Suppression des `s1…s4`. |

Les plafonds mesurés par P0 vivent dans `src/socole/architecture/contraintes.ts`.
**Chaque phase qui fait baisser une dette doit aussi baisser le plafond correspondant, dans le même commit** — sinon le garde-fou ne sert plus à rien.

---

## 1. Ce qui a été constaté

Chiffres relevés dans le dépôt, pas des impressions.

| Constat | Mesure |
| --- | --- |
| Dossiers nommés d'après l'ordre de chantier | `lib/s1-comptes`, `s2-autorisations`, `s3-devises`, `s4-annotations` + les 4 jumeaux sous `db/schema/` |
| Permissions écrites en dur dans le code | `PERMISSIONS_FERMEES`, tableau `const` de 20 entrées — `s2-autorisations/validation.ts:6` |
| Rôles comparés en dur | **41 fichiers** contiennent `"ADMIN_PRINCIPAL"` / `"ADMIN_TECHNIQUE"` / `=== "AGENT"` |
| Coquilles d'interface parallèles | 3 arbres (`/admin`, `/agent`, `/clients`), 3 sidebars, 3 headers, 3 layouts |
| Monolithes | `lib/s1-comptes/staff.ts` = 1110 lignes, 24 écritures directes |
| Logique métier dans la couche présentation | `components/clients/actions.ts` = 692 lignes, 4 specs (S1, S2, S4) dans un fichier `components/` |
| Écritures sans filet offline | 15 fichiers font `db.insert/update/delete` directs. Zéro outbox |
| Routes au sens opaque | `/admin/list` liste les administrateurs ; 3 espaces d'invitation coexistent (`/admin/invites`, `/admin/invitations`, `/admin/agents/invitations`) |
| PWA jamais amorcé | `next.config.ts` est le `create-next-app` d'origine, vide |

---

## 2. Le diagnostic

**Le code fige des règles que le métier va faire bouger, et il les fige de la façon la
plus chère : en dur dans la logique applicative.**

La phrase à retenir : aujourd'hui, *ajouter* une chose oblige à *modifier* ce qui existe.

---

## 3. Le principe directeur

Trois natures de règles, aujourd'hui meleees dans le même code. La séparation est le
gouttière de toute la réarchitecture.

| Nature | Exemple | Où ça vit | Pourquoi |
| --- | --- | --- | --- |
| **Invariant** | Une écriture porte un montant et une devise, jamais un taux. Le journal est append-only. Pas de solde stocké. | **Code**, constant, test | C'est le cœur du métier. Une constante compile-time et un test le verrouillent mieux qu'une ligne en table, qu'un `UPDATE` maladroit peut changer. |
| **Règle variable** | Quelles permissions existent. Quels rôles. Quelles destinations. Quels états. | **Données**, tables, modifiables sans redéploiement | Ce sont les listes. Toute liste écrite dans le code est une liste qu'il faudra réécrire. |
| **Mécanisme** | Comment on écrit. Comment on journalise. Comment on vérifie un droit. Comment on change un état. | **Code**, écrit **une seule fois**, générique | C'est ici que se paie la duplication. |

La phrase opératoire : **toute liste en dur qui a vocation à grandir devient une
ligne de table ; tout comportement récurrent qui a vocation à se répéter devient un
moteur générique ; ce qui doit être stable reste une constante.**

---

## 4. Les cinq axes de variabilité

Pour chaque axe : ce qui est figé aujourd'hui, ce que devient la cible, ce que ça
débloque concrètement, et ce que ça coûte.

### Axe 1 — Les permissions

**Aujourd'hui** : `PERMISSIONS_FERMEES` est un `const` de 20 chaînes. `estPermissionConnue()`
fait un `.includes()` sur le tableau. La matrice de permissions
(`matrice-permissions.tsx`, 569 lignes) et les 5 fichiers d'actions lisent cette liste.

**Cible** : table `permissions (code, libelle, groupe, description, active)`, amorcée
par migration. `estPermissionConnue` devient une lecture. La matrice se rend depuis la
table, donc une permission nouvelle s'affiche toute seule.

**Ce qui est préservé — et c'est le point important** : la sécurité ne baisse pas.
L'invariant « une permission inconnue vaut refus, jamais accès libre » tient toujours,
puisqu'une permission absente de la table reste inconnue. Ce qui change, c'est
**le canal de modification** : une ligne seed dans une migration, au lieu d'une
édition de tableau TypeScript.

**Débloque** : un nouveau droit métier = 1 migration. Zéro fichier TypeScript touché,
zéro redéploiement de la matrice.

> ⚠️ Cela **contredit** une décision écrite dans `.scratch/decomposition.md` (« La liste
> reste fermée à l'exécution ») et le commentaire du fichier lui-même (« non modifiable
> à l'exécution »). Voir §9, point A.

### Axe 2 — Les rôles

**Aujourd'hui** : le rôle est un `varchar(32)` — donc **déjà dynamique côté base**.
Mais 41 fichiers font `=== "ADMIN_PRINCIPAL"`, et les règles de pouvoir
(`peutGererPermissions`, `peutConsulterJournal`) comparent des chaînes littérales.
Ajouter un rôle, c'est un grep dans 41 fichiers.

**Cible** : tables `roles (code, libelle, description)` et
`role_permissions (role, permission)`. Les prédicats (`peutGererPermissions`)
deviennent des lectures ou, mieux, une seule règle générique : *un rôle porte des
permissions ; un porteur de rôle les a par transitivité*.

**Débloque** : un rôle « superviseur de terrain » = 3 lignes de table. Aucun des 41
fichiers ne bouge. C'est le gain le plus spectacular de la liste, parce qu'il supprime
la contrainte la plus invisible du code.

### Axe 3 — Les destinations et la navigation

**Aujourd'hui** : trois arbres parallèles `/admin`, `/agent`, `/clients`, avec trois
sidebars, trois headers, trois layouts. `/admin/clients/validation` est dupliqué à
l'identique dans `/agent/clients/validation`. Le menu est écrit à la main dans chaque
sidebar.

**Cible** : un seul arbre, piloté par une déclaration de destinations
(`destination (code, libelle, racine, icone, ordre)`) et une entrée par écran, chaque
écran portant la permission qui le rend visible. Une coquille unique.

**Débloque** : une destination ou un rôle = une ligne de données. Et la duplication
`/admin/clients/validation` ↔ `/agent/clients/validation` disparaît d'elle-même : le même
écran, deux portes.

**Coût** : c'est l'axe le plus cher et le plus visible. Il ne change aucune règle
métier, seulement l'arborescence. C'est aussi celui où le risque de régression est le
plus élevé, parce qu'il touche la navigation et donc les tests d'écran.

### Axe 4 — Le cycle de vie (états et transitions)

**Aujourd'hui** : une fonction par transition, regroupées dans
`s1-comptes/validation.ts` (447 lignes) et ailleurs. `transitionCompteClientValide`,
`transitionCompteClient...`, les états de pièce, les états d'invitation, et demain la
machine à états des commandes que `decomposition.md` a déjà rendue normative sous forme
de tableau. Chaque nouvelle entité à états réécrit le même moteur à sa main.

**Cible** : une table `transitions (entite, de, vers, garde, libelle)` et **un seul**
moteur `transitionner(entite, entiteId, vers)`, qui refuse tout couple absent du
tableau — ce qui rend le tableau de transitions de `decomposition.md` directement
exécutable au lieu d'être une règle qu'on récite.

**Débloque** : la machine à états des commandes (S5), qui est le cœur du produit et la
plus intricate du dossier, arrive **sur un moteur déjà testé** au lieu d'être le
quatrième exemplaire de la même chose.

**Note de conception** : le tableau de transitions de `decomposition.md` est déjà écrit
comme une matrice exhaustive de couples (état, état) autorisés. Cette forme est
exactement celle d'une table. La spec a été écrite dans le formalisme du moteur cible
sans le savoir.

### Axe 5 — La porte d'écriture

**Aujourd'hui** : 15 fichiers de Server Action écrivent directement en base. Aucune
trace d'outbox, d'IndexedDB, de Serwist. Deux commentaires du code disent honnêtement
« l'acceptation hors-ligne viendra avec S8/outbox ».

**Cible** : une **unique porte d'écriture** que tous les modules traversent. Elle sait
aujourd'hui écrire en base ; elle saura plus tard écrire dans l'outbox et réémettre.
Chaque module métier ignore lequel des deux est actif.

**Débloque** : S8 cesse d'être une réécriture et devient une activation. C'est
l'argument économique central du §6.

> ⚠️ Cela **contredit** l'état actuel de l'ADR-0006 (« Aucune écriture métier directe
> via Server Action »). Voir §9, point B.

### Axe 6 — Les fichiers déposés

Cet axe est apparu le 2026-10-14, après le reste du document. Le glossaire
n'^avait pas de terme pour « fichier déposé » : il en fallait un.

**Aujourd'hui** : quatre voies, zéro abstraction.

| Ce qui est stocké | Racine | Qui écrit | Servi par | Accès contrôlé |
| --- | --- | --- | --- | --- |
| Avatars | `public/avatars/` | `app/admin/profil/actions.ts` | Next.js statique | **non** |
| Pièces d'identité clients | `donnees/pieces-clients/` | `lib/s1-comptes/pieces-clients.ts` | `/api/pieces-clients/[id]` | oui |
| Pièces d'identité staff | **aucune** | `admin-complement.ts` | — | — |
| Preuves de paiement (S5) | — | pas encore écrit | — | — |

**La pièce d'identité staff n'existe pas.** `deposerPieceIdentiteStaff`
(`admin-complement.ts:124`) prend une chaîne `referenceImage` et la case en
base telle quelle : **aucun octet n'est écrit**, et l'appelant n'a rien pour
fabriquer cette chaîne. La fonction n'a **aucun appelant**. La table
`pieces_identite_staff` est donc une table que rien ne remplit, et
`ouvrirAccesTemporaireResetStaff` exige un `piece_id` qui ne peut pas
exister. La réinitialisation de mot de passe staff n'est pas bouclable.

**Deux tables, le même concept, divergées.** `pieces_identite_clients` porte
`mime`, `statut_piece`, `refus_motif`, et des `vue_par` / `vue_le` nullables —
la leçon du ticket 10 : une pièce déposée n'est pas une pièce vue, et un refus
suppose d'avoir vu. `pieces_identite_staff` n'a **ni** `mime, **ni** verdict,
et ses `vue_par` / `vue_le` sont obligatoires. Elle a été écrite avant la
leçon et ne l'a jamais reçue.

**Cible** : un module `socole/fichiers`, un seul, avec quatre opérations —
`enregistrer`, `lire`, `supprimer`, `verifier` — et une réponse unique :
**une clé opaque, jamais un chemin et jamais une URL**.

Et surtout une **séparation des deux questions** que les deux tables
confondent : les octets d'un côté, le métier de l'autre.

```
fichiers (id, categorie, cle, nom, mime, taille_octets, empreinte,
          proprietaire_type, proprietaire_id, depose_par, depose_le)

pieces_identite_clients (..., fichier_id → fichiers.id,
                         statut_piece, refus_motif, vue_par, vue_le)
pieces_identite_staff  (..., fichier_id → fichiers.id, vue_par, vue_le)
```

`fichiers` répond à « où sont les octets, sont-ils acceptables, qui peut les
lire ». Les tables métier répondent à « cette pièce est-elle validée, qui l'a
vue ». Ce sont deux questions différentes, et elles sont aujourd'hui
mélangées dans deux tables qui ne se ressemblent pas.

Trois conséquences, dans l'ordre de leur importance :

1. **Une seule politique de validation.** Aujourd'hui il existe deux règles
   indépendantes pour la même question « ce fichier est-il acceptable ? » :
   `photoProfilValide` (dans `components/profil/`) et `verdictFichierPiece`
   (dans `lib/s1-comptes/pieces-fichiers.ts`). Elles vivent à deux étages
   différents du code et personne ne sait laquelle fait foi.
2. **Un pilote de stockage interchangeable.** Le disque local est une décision
   de dev, pas une décision d'architecture. Le module expose une interface ;
   le jour où on écrit sur un volume monté ou un stockage objet, on ajoute un
   pilote. Aucun appelant ne change.
3. **Rien n'est servi en statique.** Tout fichier passe par une route qui
   vérifie qui demande, exactement comme `/api/pieces-clients/[id]` sait déjà
   le faire aujourd'hui.

**Débloque** : les preuves de paiement de S5, qui sont le **troisième**
consommateur de fichiers. Sans ce module, S5 réinvente une quatrième façon
d'écrire un fichier — et ADR-0006 exige déjà pour S5 une compression cliente
et un envoi différé. C'est la même raison que P3 : **ce module doit exister
avant S5.**

**Deux défauts à traiter, qui ne sont pas de l'architecture :**

- **Les avatars sont écrits dans `public/`.** `public/` est un dossier de
  build : `next build` le régénère, et il est ignoré par git, donc il ne
  voyage pas. Sur le VPS, un avatar déposé aujourd'hui peut disparaître à la
  prochaine mise en production. Le code le reconnaît : « Dev (option C) ».
- **Les avatars sont servis sans aucun contrôle d'accès.** Une photo est
  accessible à `https://…/avatars/<uuid>.jpg` par quiconque a l'URL, sans
  session. La pièce d'identité, elle, passe par une route qui vérifie la
  session, la permission et la propriété du fichier. **La donnée la moins
  sensible est la moins protégée**, parce que c'est celle qui a été posée en
  premier et sans règle.

---

## 5. La structure cible

Le critère de découpage n'est ni le numéro de spec ni le nom d'un métier figé. C'est
**la nature de ce qu'on y trouve** — ce qui, par construction, ne change pas d'une
spec à l'autre.

```
src/
  socle/              ← les mécanismes. Un seul endroit par mécanisme.
    autorisation/      ← le contrôle d'accès : une seule porte d'entrée
    ecriture/         ← la porte d'écriture unique, offline-ready
    journal/          ← l'audit : un seul point d'entrée
    transition/       ← le moteur de machine à états, générique
    identite/         ← mots de passe, 2FA, jetons, invitations
    argent/           ← le modèle monétaire : taux, devise, reste à payer
    ui/               ← les primitives d'interface partagées

  modules/            ← le métier, un dossier par agrégat, jamais numéroté
    comptes/          ← staff + clients + invitations + pièces
    clients/          ← dossier client, plafond, statut, annotations
    commandes/        ← S5
    creances/         ← S6
    tresorerie/       ← S7

  infrastructure/     ← les machineries, interchangeables
    db/               ← client + schéma (un seul schéma, plus de s1/s2/s3/s4)
    auth/
    fichiers/

  interface/          ← la présentation, sans règle métier
    app/
    composants/
```

```
tests/                ← rien de tout cela n'est dans src/. Voir §5 bis.
  app/                 ← les tests des pages, hors de l'arbre de routage
  composants/
  lib/
  socle/               ← les garde-fous d'architecture
  e2e/                 ← vide pour l'instant, réservé à Playwright
```

`tests/` reproduit l'arborescence de `src/`, donc le chemin dit à lui seul
ce qui est testé : `tests/components/ui/sidebar.test.tsx` teste
`src/components/ui/sidebar.tsx`.

---

Trois principes qui rendent cette structure tenable dans le temps :

1. **Aucun dossier ne porte de numéro de spec.** `s1`, `s2`… est un calendrier de
   chantier. Il ne veut rien dire dans deux ans, et il interdit de quaifier : un
   module qui touche deux specs n'a pas de place.
2. **La dépendance descend, jamais ne remonte.** `socole` ne connaît pas `modules`.
   `modules` ne connaît pas `interface`. `interface` ne connaît que `socole`. Une règle
   métier qui apparaît dans un fichier `components/` est une erreur d'architecture, pas
   un détail de style.
3. **Un mécanisme, un fichier d'entrée.** Si deux fichiers appellent le journal, il
   n'y en a qu'un seul et les deux passent par là.

### 5 bis. Les tests sont séparés du code — décision du porteur

**Décision du 2026-10-14, appliquée et consignée dans
`docs/adr/0008-tests-separes-du-code.md`.** Les 61 fichiers de tests
quittent `src/` et vont dans `tests/`, qui en reproduit l'arborescence.
`src/` ne contient que du code livré.

**La phase F de `REORGANISATION-TKS.md` est annulée.** Ce document,
écrit le même jour à partir de `MAP.md` sans lecture du code, propose de
faire l'inverse — réintroduire les tests dans `src/`. La règle qu'il
s'impose lui-même tranche : « Si le dépôt contredit ce document, le
dépôt a raison. » Ici la décision du porteur est plus récente et
explicite. **Ne pas exécuter la phase F.**

La convention inverse — les tests à côté de leur sujet — est celle que
recommandent Vitest et Testing Library, et l'argument habituellement donné
est solide : la co-location rend difficile d'orpheliner un test. **C'est
vrai, et la décision a été prise quand même**, parce que le porteur préfère
voir `src/` ne contenir que du produit. Le coût est réel mais borné : un
test à deux écrans de son sujet au lieu d'être à côté.

Ce que la séparation a donné, et qui n'était pas le but :

- **14 fichiers de tests quittent l'arbre de routage** `src/app/`, où ils
  n'avaient aucune raison d'être.
- **Les garde-fous d'architecture mesurent enfin du code de production.**
  Avant, ils comptaient aussi des tests : 19 fichiers de tests vivaient sous
  `lib/s1-…`, `lib/s2-…` et gonflaient la dette mesurée. Le plancher
  `cheminsNumerotes` est passé de **59 à 40** sans qu'un seul fichier de
  production ait bougé.

Ce dernier point est l'argument le plus fort en faveur de la décision :
**la séparation des tests améliore la mesure de la dette.**

---

## 6. Ce que ça coûte, et ce que ça évite

**Le calcul qui justifie tout.** S5, S6 et S7 ne sont pas écrites. Si la structure
actuelle est conservée, elles arrivent sur la convention `s5-`, `s6-`, `s7-`, et la
migration coûte le prix de **sept** modules plus les 41 fichiers de rôles, à un moment
où l'application est complète et où personne n'a plus le contexte. Si elle change
maintenant, la migration coûte **quatre** modules et elle se fait pendant qu'il n'y a
rien à perdre.

Le plan n'ajoute pas de dépendance, ne change pas Next.js, ni MySQL, ni Drizzle, ni
better-auth, ni l'ADR-0001 sur le taux. Il ne touche à aucun invariant métier. Le
risque est organisationnel, pas technique.

**Ordre de grandeur** (estimation, à affiner ticket par ticket) : l'axe 1 et l'axe 2
sont les moins chers et les plus rentables. L'axe 4 est le meilleur rapport
coût/valeur, parce qu'il se paie tout seul à S5. L'axe 3 est le plus cher. L'axe 5 est
le plus important et le plus long.

---

## 7. Le phasage

**Règle absolue, non négociable : ne jamais déplacer et changer en même temps.** D'abord
on déplace sans changer une seule ligne de comportement, on vérifie que rien n'a bougé,
puis on change. Un diff qui déplace et corrige à la fois est indéchiffrable à la
relecture, donc non testable.

| Phase | Contenu | Dépend de | Why now |
| --- | --- | --- | --- |
| **P0** | Poser `socole/` et `infrastructure/` à côté de l'existant. Rien ne bouge encore, les modules actuels délèguent. | — | Sans coût, tout le reste devient possible |
| **P1** | **Axe 5** — la porte d'écriture unique, toujours en mode base. Les 15 Server Actions passent par elle. | P0 | Débloque S8, supprime le risque de réécriture |
| **P2** | **Axes 1 et 2** — permissions et rôles en données. | P1 | Le moins cher, le plus rentable, supprime les 41 fichiers |
| **P3** | **Axe 4** — moteur de transitions générique. | P0 | Doit être prêt **avant S5** : la machine à états des commandes est le cœur du produit |
| **P4** | **Axe 3** — arborescence unique, coquille unique. | P2, P3 | Le plus tard possible : le plus cher, le plus visible, celui qu'on veut faire une fois |
| **P5** | Déplacement final des modules, suppression des `s1…s4`. | P1–P4 | Pur déplacement, aucun changement de comportement |

**Le seul ordre non négociable est P3 avant S5.** Si S5 est écrit avant que le moteur de
transitions existe, on obtient le quatrième exemplaire du même moteur, écrit par quelqu'un
qui ne connaîtra pas les trois premiers. C'est la seule urgence réelle du dossier.

---

## 8. Ce que ce plan ne fait pas

Par honnêteté, et pour que la revue ne soit pas lue comme une refonte :

- Aucun changement de framework, de base, d'ORM ou de bibliothèque.
- Aucun changement de règle métier. ADR-0001, ADR-0003, ADR-0004, ADR-0005 sont intacts.
- Aucun changement de vocabulaire. Le glossaire reste normatif.
- Pas de découpage par spec, par numéro ou par tranche. C'est explicitement écarté.
- Pas de refonte du design.
- La preuve de paiement, la 2FA, le premier accès et le journal ne changent pas de
  comportement — ils changent d'endroit et de mécanisme.

---

## 9. Les points qui demandent ta décision

Trois décisions **ne sont pas techniques**, elles sont à toi. Aucune n'est prise ici.

### A. La liste des permissions reste-t-elle fermée à l'exécution ?

`decomposition.md` l'écrit en toutes lettres : « la liste reste fermée à l'exécution ».
L'axe 1 propose de la déplacer en table.

L'argument que je propose : **l'invariant de sécurité est préservé** — une permission
absente de la table reste inconnue, donc toujours refusée. Ce qui change n'est pas ce
qui est autorisé, c'est **qui peut ajouter une permission** : aujourd'hui un développeur
qui déploie, demain une migration contrôlée par toi.

Si la réponse est « non, la liste doit rester non modifiable sans mise en production »,
alors l'axe 1 est à supprimer, et il faut assumer que chaque nouveau droit métier coûte
un cycle de développement. C'est un choix légitime — mais il faut le choisir, pas le
subir.

### B. Quand la porte d'écriture unique est-elle posée ?

L'ADR-0006 l'exige et le code ne la suit pas. Deux options :

- **La poser maintenant (P1)** — S8 devient une activation, mais on paie la réécriture
  des 15 Server Actions pendant que l'application est encore jeune.
- **La poser à S8** — on ne touche à rien maintenant, et on paie la réécriture en S8,
  quand tout le reste existe, avec le risque qu'une spec S5→S7 écrite entre-temps ait
  écrit à côté de la porte.

Je recommande maintenant, et la raison est simple : plus c'est tard, plus ça coûte.

### C. Périmètre du chantier

Tout le plan, ou seulement P0–P3 en laissant l'interface pour plus tard ? Les axes 1, 2
et 4 sont invisibles pour l'utilisateur etbegingroup rentables. L'axe 3 est visible,
cher, et.n'a aucune valeur métier directe.

---

## 10. Ce que ce plan ne prétend pas faire

Il ne garantit pas qu'aucune décision ne sera plus jamais prise en dur. Il garantit
que les cinq listes qui reviennent dans ce dossier — permissions, rôles, destinations,
transitions, porte d'écriture — ne seront plus dans le code.

Tout le reste est un arbitrage ordinaire.