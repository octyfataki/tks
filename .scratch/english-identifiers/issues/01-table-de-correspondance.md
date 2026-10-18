# 01: La table de correspondance FR → EN

**What to build:** Chaque terme du domaine reçoit **un** identifiant anglais, et
le glossaire le porte. Un terme sans identifiant fait échouer le test. C'est un
ticket de **documentation et de test** : aucune migration, aucune ligne de code
de production, aucune base touchée — donc il se termine en une session.

**Blocked by:** rien. Premier lot du chantier `.scratch/english-identifiers/`.

**Status:** ready-for-human

**État :** livré. La table est dans `GLOSSARY.md` (section « Les deux écritures
d'un terme », 68 lignes, 16 portées) et les tests dans
`tests/glossaire/identifiants.test.ts` (8 tests, tous verts ; `tsc` et `eslint`
propres ; 433 tests passent). Ce qui reste est une **relecture des mots**, pas du
code — voir les trois points ouverts en bas de ce fichier.

- [x] `GLOSSARY.md` gagne, pour chaque terme qui est **stocké** (états, statuts,
      étiquettes, rôles, permissions), une ligne « identifiant en code ». Un
      terme purement conversationnel n'en a pas besoin : c'est l'usage, pas la
      valeur, qu'on nomme.
- [x] La correspondance vit dans **un seul fichier lisible** (`GLOSSARY.md`), et
      n'est pas recopiée dans un tableau de code : deux tables divergentes
      seraient pires que pas de table.
- [x] Le glossaire gagne une phrase qui dit la règle : **la base ne stocke que
      l'identifiant, la phrase française n'est jamais une valeur**. C'est ce qui
      empêche le retour du français en base au prochain ticket.
- [x] Un **test** lit `GLOSSARY.md`, extrait les paires déclarées, et échoue si
      un identifiant est vide, dupliqué dans sa portée, ou écrit dans une autre
      forme que le terme qu'il remplace (majuscules avec `_`, minuscules avec
      `.`, minuscules).
- [x] Un second test vérifie l'**inverse** : une valeur de domaine présente dans
      le code n'a pas le droit d'être absente du glossaire. Il balaie les onze
      listes fermées du code (états client et staff, rôles, statut de crédit,
      étiquettes, statuts d'annotation, permissions, devises, statuts et types de
      pièce, états de lien d'invitation). C'est le test qui attrape la permission
      ajoutée en douce.
- [x] Le test est écrit dans `tests/`, conformément à ADR-0008 : `src/` ne
      contient que du produit.
- [x] Le lot **ne renomme rien** : aucun fichier de `src/` touché, aucune
      migration, aucune valeur en base. Le renommage est le lot 2, et il attend
      son propre ticket.

## Trois points à trancher par le porteur

1. `AGENT` → `SERVICE_AGENT` (le glossaire dit « agent de service » ; l'anglais
   courant dirait plutôt `FIELD_AGENT`).
2. `ADMIN_PRINCIPAL` → `PRINCIPAL_ADMIN` (littéral) ou `OWNER_ADMIN` (le
   propriétaire).
3. `ETATS_LIEN_INVITATION` vaut aujourd'hui `en-attente`/`termine`/`expire`/
   `revoque` : des **minuscules**, seules valeurs de la base dans ce cas. Je les
   ai traduites à l'identique (`pending`/`completed`/`expired`/`revoked`) sans
   corriger la forme. Le lot 2 doit-il en profiter pour les passer en
   majuscules, comme tout le reste ?

## Ce que le lot 1 laisse de côté, et pourquoi

- Le vocabulaire du **journal d'audit** (`agent.creer`, `piece.accepter`…, dont
  certains réutilisent le nom d'une permission) n'est pas une liste fermée en
  code : impossible à balayer sans deviner. Il rejoindra la table quand il
  deviendra une liste, et devra suivre le renommage des permissions.
- Les valeurs **purement techniques** (catégories de fichier, méthode d'envoi
  2FA, clé de réglage) sont exclues par la règle écrite dans le glossaire, pas
  oubliées.
