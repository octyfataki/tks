# ADR-0006 : Stack technique retenue

**Statut** : Accepté
**Date** : 2026-10-06
**Dépend de** : ADR-0003, ADR-0001
**Ne remplace rien** : complète les ADR métier sans les modifier.

## Contexte

L'équipe construit en JS/TS (React + Node). Le parc terrain est mixte
Android + iPhone, réseau instable. La contrainte structurante reste
l'offline-first (ADR-0003) : écriture locale d'abord, sync ensuite,
conflit tranché par un humain (ADR-0005).

Choix imposé pour le projet : Next.js fullstack, MySQL, Drizzle,
shadcn/ui, better-auth.

## Décision

1. **Next.js fullstack (App Router)** pour le shell + les Route Handlers
   `/api/*`. PWA via Serwist (service worker) + `experimental.useOffline`.
2. **MySQL + Drizzle ORM.** Identités métier en UUID générés côté appareil
   (`CHAR(36)`), jamais d'`AUTO_INCREMENT` comme identité répliquée.
3. **shadcn/ui** pour l'interface.
4. **better-auth** sans OTP SMS : `username()` (téléphone + mot de passe)
   pour les comptes clients, `emailAndPassword` + `twoFactor()` TOTP pour
   les administrateurs. Validation, rattachement, invitation agent et
   réinitialisation sur pièce d'identité en tables custom (S1).
5. **Outbox locale IndexedDB** (ex. Dexie) : `op_id`, `created_at_local`,
   payload, statut. Seule voie d'écriture hors-ligne vers `/api/sync`.

## Règles d'usage obligatoires

- Aucune écriture métier directe via Server Action. Toute écriture passe
  par l'outbox puis la sync idempotente. Sinon S8 est invalidée.
- Aucun `taux` ni `solde` stocké (ADR-0001, S7). Pas de `created_at`
  serveur comme vérité. Pas de trigger calculé.
- Session better-auth côté serveur (cookie) + cache session locale à
  durée bornée, vérifiée sans réseau (S1-T6).
- Journal d'audit append-only : `REVOKE UPDATE, DELETE` + triggers MySQL.
- Preuves de paiement : compression client + envoi différé, jamais
  bloquant (S5-T3, S8-T5).

## Conséquences

**Positives**

- Une seule codebase TS front + back, alignée sur les compétences.
- Drizzle + MySQL : schéma explicite, migrations simples, VPS unique.
- better-auth couvre email/TOTP/admin sans code maison.

**Négatives**

- Next.js SSR/Server Actions inutilisables hors-ligne : discipline
  outbox à faire respecter dans chaque spec S1 à S7.
- MySQL : immuabilité et RLS moins natives que Postgres, à verrouiller
  par droits + triggers + tests structurels.
- PWA iOS : pas de Background Sync, stockage purgeable. État de sync
  toujours visible, réessai foreground explicite.
