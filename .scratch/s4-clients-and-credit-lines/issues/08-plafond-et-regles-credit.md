# 04 — Plafond de crédit et règles de décision

Status: ready-for-agent

Blocked by: 02, 07

## Ce que cette tranche livre

Le **module de règles de crédit** (`src/lib/s4-clients/credit.ts`), métier pur,
sans base ni framework :

- `expositionDansDevise(expositions, devise)` — somme des créances **dans la
  devise du plafond**, sans conversion ;
- `plafondRestant(...)` — plafond moins cette somme. **Dérivé, jamais stocké** ;
- `deciderCommandeCredit(...)` — autorise ou refuse, avec un motif lisible.

Et le **rattachement des étiquettes au profil** : c'est la seule donnée métier
qui référençait le compte de connexion au lieu du profil du shop.

## Le point qui compte : un plafond est une décision, pas un fait

Une créance est un fait et se valorise au taux du jour (ADR-0001). Un plafond
est ce que le chef a décidé mardi : que le dollar soit passé à 2 400 le
mercredi ne transforme pas sa décision en 240 000.

Concrètement, `deciderCommandeCredit` **ne reçoit aucun taux**. Une créance en
CDF ne consomme pas un plafond en USD, et réciproquement. Si le taux bouge,
le disponible ne bouge pas — sans quoi un client peut se voir refuser une
commande qu'on ne lui avait jamais refusée, sans qu'aucune décision n'ait été
prise, ce qui est inexplicable et donc faux.

Le test qui verrouille cela compare un plafond de 200 USD à des créances de
120 USD **et** de 10 000 000 CDF : le restant reste 80. Une implémentation qui
convertit par erreur ne peut pas passer ce test.

## Décisions de la fonction

| Cas | Décision |
| --- | --- |
| Commande `PREPAYE` | toujours autorisée : elle ne consomme pas de plafond |
| `CREDIT` + `EN_EVALUATION` | refusée, `STATUT_INSUFFISANT` — la promotion est une décision humaine, jamais automatique |
| `CREDIT` + devise ≠ devise du plafond | refusée, `DEVISE_INCOHERENTE` — on ne compare pas ce qui n'est pas comparable |
| `CREDIT` + plafond déjà atteint ou dépassé | refusée, `PLAFOND_DEJA_DEPASSE` — état à voir, pas une erreur de saisie |
| `CREDIT` + montant > restant | refusée, `PLAFOND_DEPASSE`, avec le montant restant dans le motif |

Aucune de ces règles ne modifie de dette et ne crée d'écriture : une décision
refusée est un état, pas un mouvement.

## Les étiquettes suivent le shop

`annotations_clients` référençait `compte_client_id`. Une étiquette posée
aujourd'hui aurait disappeared au changement de téléphone, alors qu'elle décrit
la **boutique**, pas la personne.

La migration `0022_normal_wolfsbane.sql` ajoute `profil_client_id` (nullable) et
un index. Le backfill est un script séparé —
`pnpm db:backfill-annotations-profil` — parce que c'est une opération de
données, pas du schéma. Il est **idempotent** : il ne touche que les lignes
encore sans profil, et il refuse de terminer si le nombre d'étiquettes a
changé.

Une étiquette posée désormais est rattachée au profil **au moment de l'écriture**,
résolu depuis l'accès actif — jamais depuis un numéro de téléphone. Un compte
sans accès actif pose une étiquette sans profil : elle attend qu'un agent
confirme l'accès, et n'est jamais devinée.

`profil_client_id` reste **nullable** tant que tous les comptes n'ont pas de
profil. Le resserrer en `NOT NULL` est une tranche ultérieure, une fois la
bascule S10 faite.

## Bug trouvé et corrigé au passage

`journal_audit.entite_id` était `varchar(36)`. Le code y écrit
`"<uuid>:<permission>"`, soit environ 60 caractères. En mode strict,
**toute écriture au journal échouait** — donc toute pose d'étiquette et toute
accusation de permission. Ce n'est pas une année de code qui tournait en
production, mais c'est un chemin que rien ne testait.

La migration `0023_fine_komodo.sql` élargit la colonne à `varchar(128)`. C'est
le seul `MODIFY` du projet, et il ne perd aucune donnée : un `varchar` plus
large ne tronque rien.

## Ce que le test prouve

Contre la vraie base, un scénario complet : profil créé, premier compte validé
et autorisé, étiquette posée, **accès révoqué** (téléphone perdu), nouveau
compte créé et autorisé sur le même profil. L'historique du shop est inchangé,
et il n'y a toujours **qu'une** étiquette — rien ne s'est dupliqué.

Le même test prouve au passage que la règle 1:1 de la PR 2 tient : sans
révocation préalable, le second compte est refusé par la base.

## Écarts assumés

- **Les créances n'existent pas encore.** Cette tranche livre la règle pure et
  son contrat d'appel ; les tables `creances` et `paiements` arrivent avec S5 et
  S6, et portent `profil_client_id`.
- **`compte_client_id` reste dans la table.** Il désigne l'auteur de l'événement,
  ce qui est légitime : c'est la trace, pas le propriétaire du shop.
- **Le renommage des permissions** de la PR 4 et ce fichier vivent sur des
  branches empilées ; le dossier des étiquettes n'utilise que des permissions
  déjà renommées.

## Décisions restant à trancher

1. **Plafond par réseau** ou plafond unique ? Aujourd'hui un seul plafond par profil.
2. **Promotion** : sur quels éléments de dossier l'administrateur décide-t-il ?
   La spec pose qu'aucun seuil automatique n'existe, mais pas ce qu'il regarde.
3. **Plafond par devise** : un seul couple (montant, devise) aujourd'hui. Un
   plafond CDF *et* un plafond USD simultanés sont impossibles ; est-ce voulu ?
4. **Resserrer `profil_client_id` en `NOT NULL`** : quand, et que faire des
   étiquettes de comptes sans profil.