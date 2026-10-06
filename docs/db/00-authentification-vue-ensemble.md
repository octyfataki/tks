# TKS Auth — vue d'ensemble (schéma + workflows)

> Fichier unique pour décider l'auth avant code. Sources : S1 spec, S2 partiel, ADR-0006, GLOSSARY.
> Détails éclatés : `01-admin-comptes.md`, `02-comptes-clients.md`, `03-roles-audit.md`.

Stack : Next.js App Router + MySQL + Drizzle + better-auth + outbox IndexedDB (Dexie) -> `/api/sync`.
IDs : `CHAR(36)` UUID générés appareil, jamais `AUTO_INCREMENT` répliqué.

## 1. Schéma — qui vit où

better-auth génère et possède : `user`, `session`, `account`, `verification`, `twoFactor`.
Nous possédons : `comptes_staff`, `comptes_clients`, `invitations_agents`, `facteurs_2fa_admin`, `pieces_identite_*`, `validations_clients`, `rattachements`, `acces_temporaires_*`, `journal_audit`.

```mermaid
erDiagram
  BA_USER ||--o| COMPTES_STAFF : "better_auth_user_id"
  BA_USER ||--o| COMPTES_CLIENTS : "better_auth_user_id"
  BA_USER ||--o| BA_SESSION : "userId"
  BA_USER ||--o| BA_ACCOUNT : "userId"
  BA_USER ||--o| BA_TWOFACTOR : "userId"
  COMPTES_STAFF ||--o| INVITATIONS_AGENTS : "cree_par"
  COMPTES_STAFF ||--o| FACTEURS_2FA_ADMIN : "compte_staff_id"
  COMPTES_CLIENTS ||--o| PIECES_ID_CLIENTS : "compte_client_id"
  COMPTES_CLIENTS ||--o| VALIDATIONS_CLIENTS : "compte_client_id"
  COMPTES_CLIENTS ||--o| RATTACHEMENTS : "compte_client_id"
  COMPTES_STAFF ||--o| JOURNAL_AUDIT : "acteur_staff_id"
  COMPTES_CLIENTS ||--o| JOURNAL_AUDIT : "acteur_client_id"

  BA_USER {
    string id PK
    string email
    string name
    string phoneNumber "plugin username() client"
    boolean emailVerified
  }
  COMPTES_STAFF {
    char36 id PK
    string better_auth_user_id FK
    string email UK
    string role "ADMIN_PRINCIPAL|ADMIN_TECHNIQUE|AGENT"
    string etat "VALIDE|REVOQUE"
  }
  COMPTES_CLIENTS {
    char36 id PK
    string better_auth_user_id FK
    string telephone UK "clé compte, jamais dossier"
    string etat "EN_ATTENTE|VALIDE|REFUSE|REVOQUE"
  }
```

Règles verrouillées :
* Staff = email, jamais téléphone. Client = téléphone, jamais email admin. Deux tableaux, zéro mélange.
* Client inscrit `EN_ATTENTE_VALIDATION` ne fait rien : pas dossier, pas solde, pas commande même prépayée.
* `VALIDE` exige `piece_id NOT NULL`. Aucun chemin sans pièce vue humain.
* Rôle immuable. Changer = révoquer + recréer, tracé audit.
* Admin login sans TOTP = refus + journalisé. Admin technique ne voit ni `account`, ni `twoFactor`.

## 2. Workflows

### W1 — Client s'inscrit puis est validé puis rattaché

```mermaid
sequenceDiagram
  participant C as Client PWA
  participant API as /api/auth + /api/sync
  participant Staff as Admin/Agent comptoir
  C->>API: signUp username(téléphone + mdp) -> BA_USER + COMPTES_CLIENTS EN_ATTENTE
  Note over C: écran "en attente, apportez pièce"
  C->>API: upload pièce -> PIECES_ID_CLIENTS
  Staff->>API: file attente (ancienneté) -> voit nom + pièce
  Staff->>API: valider(piece_id obligatoire) -> VALIDATIONS_CLIENTS VALIDE + audit
  Staff->>API: rattacher(dossier désigné par NOM, jamais tél seul) -> RATTACHEMENTS + audit
  C->>API: signIn -> voit dossier + solde
```

### W2 — Admin se connecte (2FA obligatoire)

```mermaid
sequenceDiagram
  participant A as Admin
  participant BA as better-auth emailAndPassword + twoFactor
  A->>BA: signIn.email(mdp) -> refuse si pas de TOTP
  A->>BA: verify TOTP -> BA_SESSION cookie + cache local borné
  Note over A: session visible, avertissement avant expiry
```

### W3 — Agent invité

```mermaid
sequenceDiagram
  participant Chef as Admin principal
  participant Ag as Futur agent
  Chef->>API: crée INVITATIONS_AGENTS (jeton unique, expire_le)
  Ag->>API: lien + choisit email + mdp -> COMPTES_STAFF AGENT, jeton consommé
  Note over API: même jeton 2x = 1 seul compte, échec journalisé
```

### W4 — Mot de passe oublié (sans SMS)

```mermaid
sequenceDiagram
  participant C as Client
  participant Ad as Admin
  C->>Ad: demande + pièce depuis app
  Ad->>API: ouvre ACCES_TEMPORAIRE court + avertissement visible
  C->>API: choisit nouveau mdp (seule action autorisée, commande = refus)
  API->>API: révoque accès, audit
```

### W5 — Offline-first session + sync

```mermaid
flowchart LR
  App[PWA Dexie outbox op_id] -->|online| Sync[/api/sync idempotent/]
  App -->|offline| Queue[(file locale conservée)]
  Queue -->|reconnect| Sync
  Sync --> Audit[JOURNAL_AUDIT op_id unique]
  Rev[révocation] -.->|effective au sync seulement| App
```

Coupure réseau n'expire rien. Expiration temporelle expire même offline. Écritures faites avant révocation conservées -> conflit ADR-0005, jamais écrasées.

## 3. Ce qu'on implémente en premier

1. `npx auth generate` -> `src/db/auth-schema.ts` provider `mysql`, plugins `username`, `twoFactor`, `emailAndPassword`.
2. Migration `0001_auth_staff_client` : `comptes_staff`, `comptes_clients`, `invitations_agents`, `facteurs_2fa_admin`, `pieces`, `validations`, `rattachements`, `journal_audit` + triggers append-only.
3. Tests S1 bloquants : non-validé ne fait rien, pas de validation sans pièce, pas de rattachement par tél seul, jeton usage unique, 2FA refus sans TOTP, accès temporaire limité.

Le reste (taux, dossiers, commandes, trésorerie) attend après.
