# 08 : Suspension réversible des comptes staff + garde dernier principal

**Status:** needs-triage

**Sévérité :** moyenne (évolution du modèle — répond aux révocations par malentendu)

**Portée :** `S1-authentication` — `/admin/list`, `/admin/agents`,
`src/lib/db/schema/s1-comptes/validation.ts`, `src/lib/s1-comptes/staff.ts`,
journal d'audit S2.

## Contexte

Aujourd'hui `ETATS_STAFF = VALIDE, REVOQUE` : la révocation est définitive
(`REVOQUE` = définitivement inutilisable, GLOSSARY). Une révocation par
malentendu coûte une recréation complète (nouveau compte, l'email ne se
corrige que par révocation + recréation). Par ailleurs `peutRevoquerAdmin`
autorise un administrateur principal à révoquer un autre administrateur
principal, sans garde dernier principal (seul le dernier administrateur
technique `VALIDE` est protégé, `src/app/admin/list/actions.ts:81-95`).

## Décisions

Validées :

1. Compte `SUSPENDU` = connexion totalement refusée (pas de lecture seule).
2. Suspension = sessions en cours tuées immédiatement.
3. Interdiction de suspendre son propre compte et de lever sa propre suspension.

En attente :

4. Suspension uniquement manuelle (pas d'automatisme 2FA pour l'instant).

## Comportement attendu

- Nouvel état `SUSPENDU` (GLOSSARY + `ETATS_STAFF`) : transitions
  `VALIDE ⇄ SUSPENDU`, `VALIDE → REVOQUE`, `SUSPENDU → REVOQUE`,
  jamais `REVOQUE → *`.
- Un compte `SUSPENDU` est inutilisable comme un `REVOQUE`, sauf que le
  retour vers `VALIDE` existe (lever la suspension, tracé).
- Mêmes autorisations que révoquer (`peutRevoquerAdmin`), jamais soi-même.
- Garde dernier principal `VALIDE` : ni révocation ni suspension du seul
  administrateur principal `VALIDE` restant (miroir de la garde dernier
  technique).
- Chaque mouvement tracé au journal (`admin.suspendre`,
  `admin.lever_suspension`, `admin.revoquer` — invariant 8).
- UI : cachet « Suspendu », filtres liste, actions lever / révoquer depuis
  la fiche. Offline-first : marqué en attente, jamais écrasé (invariant 9).
- Vocabulaire : « administrateur technique », « administrateur principal »,
  « suspension », « lever la suspension », « révocation ». Aucun terme interdit.

## Critères d'acceptation

- [ ] Machine à états tenue : aucun chemin `REVOQUE → *`, testée.
- [ ] Suspendu = connexion refusée + sessions tuées.
- [ ] Auto-suspension et auto-levée interdites avec message explicite.
- [ ] Dernier principal `VALIDE` insuspendable et irrévoquable (message explicite).
- [ ] Événements d'audit `admin.suspendre` / `admin.lever_suspension` avec
      acteur horodaté, avant/après.
- [ ] Tests vitest : transitions, garde-fous, non-régression révocation.
- [ ] GLOSSARY + spec S1 mis à jour (`SUSPENDU`, garde dernier principal).

## Références code

- `src/lib/db/schema/s1-comptes/validation.ts:11` (`ETATS_STAFF`)
- `src/lib/db/schema/s1-comptes/validation.ts:83-88` (`peutRevoquerAdmin`)
- `src/app/admin/list/actions.ts:30-112` (révocation, gardes)
- `GLOSSARY.md` (états du compte, invariants 8 et 9)

## Comments

- GitHub : https://github.com/octyfataki/tks/issues/2 (label `enhancement`).
