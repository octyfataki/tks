# 07 : Révocation d'un lien d'invitation administrateur depuis /admin/invitations

**Status:** needs-triage

**Sévérité :** critique (sécurité — escalade de privilège possible)

**Portée :** `S1-authentication` — `/admin/invitations`, `/invite/[jeton]`, `/premier-acces/[jeton]`.
Même écart constaté côté `/admin/agents/invitations` (à traiter ensemble ou en ticket suiveur).

## Constat

La page `/admin/invitations` (`src/app/admin/invitations/page.tsx`) affiche le
registre des invitations d'administrateur principal (voies `lien` +
`fiche`), réservé à un administrateur technique ou un administrateur
principal `VALIDE` (`peutInviterAdminPrincipal`).

Actions disponibles aujourd'hui (`src/app/admin/invitations/registre-invitations.tsx`,
`src/app/admin/invitations/actions.ts`) :

- ligne `en-attente` → copier le lien uniquement ;
- ligne `expire` voie `lien` → créer un nouveau lien ;
- ligne `expire` voie `fiche` → renvoyer un premier accès (`rouvrirPremierAccesAction`).

Il n'existe **aucune révocation** :

- `src/lib/s1-comptes/staff.ts` : `creerInvitationAdminPrincipal`,
  `accepterInvitationAdminPrincipal`, mais pas de `revoquerInvitation` ;
- `src/lib/db/schema/s1-comptes/invitations-agents.ts` : pas de colonne
  `revoqueLe` / `revoquePar`, états dérivés seulement `consommeLe` / `expireLe`.

## Impact

Un lien `/invite/[jeton]` à rôle cible `ADMIN_PRINCIPAL` qui fuit (transféré
par erreur, poste partagé, messagerie compromise) reste utilisable jusqu'à
expiration (jusqu'à 30 jours via `duree_invitation_jours`) ou consommation.
Aucun coupe-circuit. Quiconque détient le lien crée un compte
`ADMIN_PRINCIPAL` `VALIDE`. Contourne la décision humaine de validation.

## Reproduction

1. En tant qu'administrateur technique ou administrateur principal `VALIDE`,
   créer un lien d'invitation administrateur principal.
2. Ouvrir `/admin/invitations`, retrouver la ligne `en-attente`.
3. Constater : aucune action « Révoquer », seul « Copier ».
4. Le lien `/invite/<jeton>` reste valide même si l'émetteur veut l'annuler.

## Comportement attendu

- Chaque ligne `en-attente` (voie `lien` et voie `fiche`) propose « Révoquer ».
- `Server Action` réservée à `peutInviterAdminPrincipal`, idempotente
  (révoquer deux fois = même état, pas d'erreur).
- Un lien révoqué est refusé à `accepterInvitationAdminPrincipal` /
  `accepterInvitationAgent` et à `definirMotDePassePremierAcces` pour la voie
  `fiche`, même avant expiration.
- Révocation tracée au journal d'audit (`invitation.revoquer` : acteur, rôle
  au moment, avant/après — invariant 8 du GLOSSARY).
- L'UI fait foi : ligne révoquée affichée « Révoqué », action copier/renvoi
  désactivée, offline-first (marqué en attente, jamais écrasé — invariant 9).
- Vocabulaire : « administrateur technique », « administrateur principal »,
  « lien d'invitation », « révocation ». Aucun terme interdit.

## Critères d'acceptation

- [ ] Bouton « Révoquer » visible uniquement sur les lignes `en-attente`.
- [ ] Après révocation, `GET /invite/<jeton>` et acceptation refusent le lien.
- [ ] Double révocation idempotente, lien consommé ou expiré non révoquable
      avec message explicite.
- [ ] Événement d'audit `invitation.revoquer` avec acteur horodaté.
- [ ] Tests vitest : révocation invalide l'acceptation, non-autorisé refusé,
      idempotence, non-régression expiré/consommé.
- [ ] Même garde-fou appliqué ou ticket suiveur ouvert pour
      `/admin/agents/invitations` et `/premier-acces/[jeton]`.

## Références code

- `src/app/admin/invitations/page.tsx:29-51` (autorisation lecture)
- `src/app/admin/invitations/registre-invitations.tsx:499-519` (actions ligne)
- `src/app/admin/invitations/actions.ts:1-59` (seule action = renvoi)
- `src/lib/s1-comptes/staff.ts:223-248` (création sans révocation)
- `src/lib/db/schema/s1-comptes/invitations-agents.ts:12-24` (pas d'état révoqué)

## Comments

- GitHub : https://github.com/octyfataki/tks/issues/1 (labels `security`, `critical`, `bug`).
