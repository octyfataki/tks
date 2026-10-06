# TKS — gestion de crédit airtime (RDC)

Squelette Next.js (App Router + TypeScript + Tailwind + ESLint), installé à la
racine à côté des specs. Vocabulaire normatif : `GLOSSARY.md`. Specs : `.scratch/`.
Décisions : `docs/adr/`.

## Installation

```powershell
pnpm install
```

## Lancement

```powershell
pnpm dev      # http://localhost:3000
pnpm build
pnpm start
pnpm lint
pnpm test
```

## Tests

Vitest. Un test minimal (`src/app/page.test.tsx`) vérifie que la page
d'accueil rend sans planter.

## Contexte

- `AGENTS.md` — workflow specs + commandes agent.
- `CONTEXT.md` — glossaire court pour les agents.
- `docs/adr/0007-squelette-nextjs.md` — pourquoi cette stack.
- `.env.example` — variables attendues (aucun secret).
