# 09 : Protection du compte d'administrateur technique + non-révocation du créateur

**Status:** needs-triage

**Sévérité :** haute (gouvernance — verrouille qui peut couper l'accès de qui)

**Portée :** `S1-authentication` (+ frontière `S2-04`) —
`src/lib/db/schema/s1-comptes/validation.ts`, `/admin/list` (actions +
interface), journal d'audit S2.

**Blocked by:** intégration du travail des issues 07
(`07-revocation-lien-admin.md`) et 08
(`08-suspension-reversible-comptes-staff.md`), actuellement sur la branche
`off-admin-agents`. La machinerie de révocation/suspension des comptes
(`peutRevoquerAdmin`, actions `/admin/list`, état `SUSPENDU`) n'existe pas
encore sur `off-admin` : cette issue se lit et s'implémente par-dessus.

## Contexte

Les règles de naissance sont posées : un administrateur principal est créé
par un administrateur technique (bootstrap) ou par un autre administrateur
principal, toujours `VALIDE` (`peutCreerAdminPrincipal`,
`peutInviterAdminPrincipal`) ; un lien d'invitation ne vise jamais
`ADMIN_TECHNIQUE` (`roleCibleInvitationValide`) ; le créateur est tracé
(`comptesStaff.creePar`, y compris via invitation acceptée). En revanche,
rien n'interdit aujourd'hui :

1. à un administrateur principal de révoquer (ou suspendre, une fois 08
   intégrée) le compte d'un administrateur technique — le support se fait
   couper l'accès par le métier qu'il dépanne ;
2. à un administrateur principal B de révoquer (ou suspendre) le compte de
   A, l'administrateur principal qui l'a créé ou invité — un compte nouveau
   coupe la branche qui l'a fait naître (coup par le bas).

## Décisions

Validées avec le distributeur (Lecture 1) :

1. **R1 — aucun administrateur principal ne révoque, ne suspend, ni ne lève
   la suspension d'un compte d'administrateur technique**, quel que soit le
   nombre de comptes techniques restants. Seul un autre administrateur
   technique `VALIDE` le peut (jamais soi-même, gardes existantes
   conservées).
2. **R2 — un administrateur principal B ne révoque, ne suspend, ni ne lève
   la suspension du compte de A**, l'administrateur principal qui l'a créé
   ou invité (lien direct `comptesStaff.creePar`, les **deux voies** :
   création directe + invitation acceptée). Dans ce sens descendant →
   ascendant, seul un administrateur technique `VALIDE` peut agir. Un tiers
   C non-descendant garde son droit normal `PRINCIPAL → PRINCIPAL` (gardes
   `SOI_MEME` + dernier principal conservées).
3. **Conséquence assumée :** l'amorçage (`estBootstrapTechniqueValide`) est
   le seul chemin vers `ADMIN_TECHNIQUE`, donc tant qu'il n'existe qu'un
   seul compte technique, celui-ci est pratiquement irrévocable et
   insuspendable. C'est voulu, pas un bug : le support ne se fait pas
   évincer.
4. Hors périmètre : sens inverse `TECHNIQUE → PRINCIPAL` inchangé ;
   `PRINCIPAL → PRINCIPAL` entre non-liés inchangé ; création d'un second
   compte technique (aucun chemin aujourd'hui — si besoin, nouvelle issue).

## Comportement attendu

- Règle pure `peutAgirSurCompteAdmin(roleDemandeur, etatDemandeur,
  roleCible, estCreateurDirect)` dans `validation.ts` : `false` si
  `PRINCIPAL → TECHNIQUE`, `false` si `PRINCIPAL → PRINCIPAL +
  estCreateurDirect`. `peutRevoquerAdmin`, `peutSuspendreAdmin` et
  `peutLeverSuspension` (arrivant avec 07/08) la délèguent — jamais de
  contrôle du seul demandeur.
- Refus explicites, avant les gardes « dernier » : codes
  `INTERDIT_TECHNIQUE` (« Un administrateur principal ne peut ni révoquer
  ni suspendre un administrateur technique. ») et `CREATEUR_DIRECT`
  (« Vous ne pouvez pas révoquer ni suspendre le compte qui vous a créé ou
  invité. Seul l'administrateur technique le peut. »).
- Chaque tentative refusée est journalisée en échec (invariant 8 :
  acteur, rôle au moment, avant/après, motif).
- Interface `/admin/list` : bouton inactif ou masqué sur ces cibles quand
  le demandeur est un administrateur principal, avec le même libellé —
  aucun contournement par appel direct.
- Vocabulaire : « administrateur technique », « administrateur principal »,
  « compte », « révocation », « suspension », « lever la suspension ».
  Aucun terme interdit.

## Critères d'acceptation

- [ ] `PRINCIPAL → TECHNIQUE` refusé en révocation, suspension et levée,
  quel que soit le comptage restant, avec message explicite.
- [ ] B → A (créateur direct, création comme invitation) refusé sur les
  trois opérations, avec message explicite.
- [ ] C → A (tiers non-descendant) autorisé sous gardes existantes ;
  technique → A autorisé sous gardes existantes.
- [ ] Chaque refus laisse une ligne d'audit en échec avec son motif.
- [ ] Tests vitest : matrice R1+R2 (les deux voies de naissance
  couvertes), non-régression des gardes `SOI_MEME` / dernier.
- [ ] Parcours navigateur mince : bouton inactif côté principal concerné,
  actif côté technique.
- [ ] GLOSSARY + spec S1 mis à jour si la règle y manque.

## Références code (branche `off-admin`)

- `src/lib/db/schema/s1-comptes/validation.ts` (`peutCreerAdminPrincipal`,
  `peutInviterAdminPrincipal`, `roleCibleInvitationValide`,
  `estBootstrapTechniqueValide`)
- À l'intégration 07/08 : `peutRevoquerAdmin` / `peutSuspendreAdmin` /
  `peutLeverSuspension`, `src/app/admin/list/actions.ts`, état `SUSPENDU`
- `GLOSSARY.md` (états du compte staff, invariants 8 et 9), spec S2 §Frontière

## Comments

- Numéro `09` choisi pour unicité globale : les numéros `07`/`08` existent
  déjà sur `off-admin-agents` (en attente de fusion) ; aucun `07`/`08` à
  créer ici.
