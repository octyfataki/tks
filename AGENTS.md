# TKS — Application de gestion de crédit airtime

Ce dépôt contient la spécification d'une application web (PWA) qui remplace un
prototype Excel artisanal pour la distribution de crédit airtime en RDC.

**État actuel : projet greenfield.** Aucun code n'existe encore. Le dossier
n'est pas un dépôt git. Les artefacts présents sont :

- `Prologiciel_TKS_Version_Application.xlsx` — le prototype Excel d'origine.
  Sert de référence historique pour le domaine, **pas** de base de code.
- `GLOSSARY.md` — le vocabulaire du domaine. **Le lire avant toute chose.**
- `docs/adr/` — les décisions d'architecture et leurs raisons.
- `.scratch/decomposition.md` — l'architecture globale : les 10 specs, leurs
  arêtes de blocage, et l'ordre de construction. **Le lire avant toute spec.**
- `.scratch/sN-*/` — les specs, une par fonctionnalité. `sN` ne dépend que des
  specs de numéro inférieur.

## Comment travailler sur ce dépôt

1. Lire `GLOSSARY.md` avant d'écrire une seule ligne. Le vocabulaire y est
   normatif : « client » ne veut jamais dire « shop », « virtujet » ne veut
   jamais dire « e-money », « réalisation » ne veut jamais dire « commande ».
2. Lire les ADRs qui touchent la zone modifiée. Si ton changement contredit un
   ADR, le signaler explicitement plutôt que de le contourner en silence.
3. Lire la spec de la fonctionnalité dans `.scratch/` avant de l'implémenter.
4. Chaque spec contient ses propres « Implementation Decisions » et « Testing
   Decisions ». Elles font autorité sur le code.
5. Ce projet est **offline-first**. Toute écriture doit être capable de se faire
   sans réseau, puis de se synchroniser. Une spec qui introduit un élément non
   réplicable est une spec incomplète.
6. **Ne jamais installer de dépendances sans accord préalable.** Avant toute
   installation (`npm install`, `yarn add`, `pnpm add`, `npx`, `pip install`,
   etc.), demander explicitement l'autorisation à l'utilisateur et attendre sa
   validation. Cela vaut pour les dépendances de production comme de
   développement. En cas de doute, ne pas installer.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`, one directory per
feature, with the spec at `.scratch/<feature-slug>/spec.md`. See
`docs/agents/issue-tracker.md`.

### Triage labels

The default five-role triage vocabulary, recorded as a `Status:` line near the
top of each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the repo root plus ADRs under `docs/adr/`.
See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
