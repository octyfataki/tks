# ADR-0007 : Squelette Next.js à la racine (pnpm)

**Statut** : Accepté
**Date** : 2026-10-06
**Complète** : ADR-0006 (stack technique). Ne modifie aucun ADR métier (0001 à 0005).

## Contexte

Projet greenfield : specs S1–S10 et glossaire déjà à la racine, aucun code.
Il faut un socle qui build, linté, testé, avant S1. Le dossier racine est
volontairement mixte (code + specs + docs), à la demande du porteur.

## Décision

1. **Next.js 16.3.8 fullstack, App Router**, TypeScript, Tailwind CSS v4,
   ESLint (`eslint-config-next`), dossier `src/`, alias `@/*`.
2. **pnpm 10** comme gestionnaire (`pnpm-lock.yaml`, `packageManager` épinglé).
   Réseau instable constaté : npm a échoué en `ECONNRESET`, pnpm a passé
   l'install complète au premier essai.
3. **Scaffoldé via `create-next-app` en staging puis recopié** à la racine
   (`node_modules/` et `.next/` exclus). `AGENTS.md` racine préservé
   (workflow specs) ; le bloc `nextjs-agent-rules` sera injecté par `next dev`.
4. **Tests** : Vitest, un test minimal page d'accueil. Pas de Playwright pour
   le squelette. Pas de Drizzle / better-auth / MySQL branchés (reportés à
   S1–S4, cf. ADR-0006).

## Alternatives écartées

- **Sous-dossier `tks-app/`** : plus propre, mais refusé — racine mixte voulue.
- **npm** : défaut Next.js, mais échec réseau constaté le 2026-10-06 ; pnpm
  plus résilient (store + cache).
- **Biome** : plus rapide, mais ESLint reste le défaut intégré Next.js.
- **`create-next-app` direct sur `.`** : risquait d'écraser `AGENTS.md` /
  `docs/adr/` ; staging + recopie retenu.

## Conséquences

- Racine mixte assumée : `src/`, `public/`, `package.json` cohabitent avec
  `.scratch/`, `docs/`, `GLOSSARY.md`.
- Prochaine étape logique : S1 ticket 01 (inscription client, compte bloqué)
  + branchement Drizzle migration-first (`drizzle/`, cf. `docs/db/00-conventions.md`).
