# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Repo state caveat

This directory is **not yet a git repository**. There is no remote and no
commit history. Two consequences:

- Issues cannot be referenced by commit. Reference them by file path or spec
  slug instead.
- The specs in `.scratch/` are the **first artefact** of this project. There is
  no codebase to explore; the domain interview recorded in `.scratch/` and in
  `GLOSSARY.md` is the source of truth.

If a git repository is initialised later, this configuration stays valid. Only
the "reference by commit" capability becomes available.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a
  single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file
  (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a
  `## Comments` heading

## Feature slugs in this project

The system is decomposed into **ten** specs. Each slug below is one feature
directory. The global architecture, the blocking edges between specs, and the
overview document live in `.scratch/decomposition.md`.

| Slug | Spec | User stories |
| ---- | ---- | ------------ |
| `s1-authentication` | Who you are: accounts, validation, sessions, 2FA | 42 |
| `s2-roles-permissions-audit` | What you may do, and what happened | 32 |
| `s3-currency-and-money` | Exchange rate and the monetary model | 31 |
| `s4-clients-and-credit-lines` | Client records and credit lines | 34 |
| `s5-orders-and-payment-proof` | Orders, price grid, payment proof | 38 |
| `s6-payments-and-debt-tracking` | Cash collection and debt tracking | 27 |
| `s7-treasury` | Treasury: cash float and mobile money | 26 |
| `s8-offline-sync` | Offline-first storage and synchronisation | 30 |
| `s9-dashboard-and-reports` | Dashboards and reports | 28 |
| `s10-migration` | Import of existing outstanding debts | 20 |

Specs are numbered so that `sN` depends only on specs with a lower number.
`s8-offline-sync` is built last but constrains every other spec: its rules must
be present in every spec written after `s2`, or that spec has to be rewritten.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if
needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or
the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`,
  with the question in the body. A `Type:` line records the ticket type
  (`research`/`prototype`/`grilling`/`task`); a `Status:` line records
  `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked
  when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open,
  unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set
  `Status: resolved`, then append a context pointer (gist + link) to the map's
  Decisions-so-far in `map.md`.
