Status: ready-for-agent

# S7 — Trésorerie : caisse et monnaie électronique

## Problem Statement

Le prototype Excel ne tient **pas de trésorerie**. Ses deux tables `TCash` et
`T_Virtuel` n'acceptent que des **montants positifs** : il n'y a aucun moyen
d'enregistrer une sortie. Ce n'est donc pas une trésorerie, c'est un journal
d'entrées, et le solde qu'en déduit le chef est un cumul de recettes qui n'a pas
d'histoire.

Trois autres défautselaient :

1. **Aucune catégorie.** Un retrait en banque et une vente se cumulent dans la
   même colonne. Le chef ne peut pas savoir combien il a retiré, ni combien il a
   vendu.
2. **Aucun mode de paiement.** La feuille `Paramètres` liste « Cash, E-money,
   Banque, Autre » mais **aucune colonne de mode** n'existe dans les tableaux.
   L'information est collectée puis perdue.
3. **Un bug de perte de données.** Les macros `Enregistrer_Cash` et
   `Enregistrer_Virtuel` **effacent le champ Description après validation sans
   jamais l'enregistrer** dans la table. Toute description saisie est
   définitivement perdue.

Et rien ne relie une vente encaissée à la commande qui l'a produite : le chef
enregistre deux fois.

## Solution

Une trésorerie réelle : des **comptes**, des **mouvements** dans les deux sens,
et des **catégories**.

- Un compte **Caisse** pour les espèces.
- Un compte **par réseau de monnaie électronique** (Orange Money, Airtel Money,
  etc.).
- Chaque mouvement porte un **sens** (entrée / sortie), une **catégorie** et un
  **montant avec sa devise**.
- Servir une commande présentielle encaissée en espèces crée **automatiquement**
  l'entrée en caisse correspondante. Le chef ne ressaisit rien.
- Les **transferts** entre comptes sont des mouvements appariés, jamais une
  saisie manuelle de deux lignes.
- Aucune catégorie n'est inventée : cinq catégories de sortie ont été
  confirmées, `FRAIS` et `COMMISSION` n'en font pas partie.

## User Stories

### Comptes et soldes

1. As the distributor, I want to see how much cash I have, so that I know my physical float.
2. As the distributor, I want to see how much I have on each mobile money network, so that I know where my money is.
3. As the distributor, I want to see the total of all my accounts, so that I know my total position.
4. As the distributor, I want each account's balance to be calculated from its movements, so that it's always consistent.
5. As the distributor, I want to see the balance on a given date, so that I can reconcile a past day.
6. As the distributor, I want to see the last movements on an account, so that I can spot anything unusual.
7. As the distributor, I want accounts to exist for each mobile money network I use, so that each is tracked separately.

### Entrées

8. As the distributor, I want cash from a counter sale recorded automatically, so that I don't enter it twice.
9. As the distributor, I want a mobile money payment recorded automatically, so that I don't enter it twice.
10. As the distributor, I want to record an entry that comes from neither, so that I can account for a gift or a refund received.
11. As the distributor, I want to know which sale produced an entry, so that I can trace it.

### Sorties

12. As the distributor, I want to record cash withdrawn to the bank, so that my cash float matches reality.
13. As the distributor, I want to record credit recharged from the operator, so that I know what I spend to sell.
14. As the distributor, I want to record a refund to a client, so that money leaving is explained.
15. As the distributor, I want to record a personal withdrawal by the owner, so that it doesn't look like a business expense.
16. As the distributor, I want to see total withdrawals to the bank over a period, so that I can reconcile with my bank.
17. As the distributor, I want to see total recharges to the operator over a period, so that I know my supply cost.
18. As the distributor, I want to see total refunds over a period, so that I detect a problem.

### Transferts

19. As the distributor, I want to transfer money from one mobile money account to another, so that I can rebalance.
20. As the distributor, I want a transfer to move money without it looking like income or expense, so that my totals are truthful.
21. As the distributor, I want a transfer to fail entirely if either side fails, so that money is never created or lost.

### Fiabilité

22. As the distributor, I want to correct a mistaken movement without deleting it, so that the trace survives.
23. As the distributor, I want to be prevented from recording a movement with no category, so that no money is unexplained.
24. As the distributor, I want every movement to be attributed to a person, so that I know who touched my money.
25. As the distributor, I want an agent to record a cash movement at the counter, so that the float is updated where it happens.
26. As the distributor, I want to compare the app's cash balance with what I count, so that a discrepancy is visible immediately.

## Implementation Decisions

### Comptes

- Deux types de comptes : `CAISSE` et `MONNAIE_ELECTRONIQUE`.
- Un compte `CAISSE` **unique** : la caisse physique du distributeur.
- Un compte `MONNAIE_ELECTRONIQUE` **par réseau**, créé pour chaque réseau de
  la liste fermée (Orange, Airtel, Africell, Vodacom).
- Le solde d'un compte est **dérivé** de ses mouvements. Jamais stocké, jamais
  saisi. Invariant 1 du glossaire.

### Mouvements et catégories

- Un mouvement porte : compte, date, sens, catégorie, montant, devise, et un
  **rattachement optionnel** à la commande ou au paiement qui l'a produit.
- Les catégories sont une **liste fermée**, fixée par l'interview :

| Catégorie | Sens |
| --------- | ---- |
| `VENTE` | entrée |
| `RETRAIT_BANQUE` | sortie |
| `RECHARGE_OPERATEUR` | sortie |
| `REMBOURSEMENT` | sortie |
| `TRANSFERT` | sortie **et** entrée |
| `RETRAIT_PROPRIETAIRE` | sortie |

- **`FRAIS` et `COMMISSION` n'existent pas.** Le client ne les a pas déclarés
  comme sorties lors de l'interview. Si le besoin apparaît, il s'ajoute à la liste
  fermée par une décision explicite — pas par un champ libre.
- Le champ **Description** existe et **est enregistré**. Sa perte dans le
  prototype était un bug, pas une intention.

### Transferts

- Un transfert entre deux comptes produit **deux mouvements liés** : une sortie et
  une entrée, portant le même identifiant de transfert.
- Il est **atomique** : si l'un des deux mouvements échoue, aucun n'est écrit.
  Impossible de créer ou de détruire de l'argent par un transfert.
- Dans les **totaux de flux**, un transfert est **neutralisé** : il n'est ni une
  recette ni une dépense. C'est ce qui rend les totaux honnêtes.

### Encaissement automatique

- Servir une commande `PRESENTIEL` encaissée en espèces crée **automatiquement un
  mouvement `VENTE` en `CAISSE`**, rattaché à la commande.
- Un paiement client enregistré en monnaie électronique crée **automatiquement un
  mouvement** sur le compte du réseau concerné, si ce réseau est identifié.
- **Exactement une fois.** C'est l'invariant le plus important de cette spec : un
  double encaissement automatique fausserait la trésorerie sans qu'on le voie.
- Si la devise ou le réseau ne permet pas de déterminer le compte, **aucun
  mouvement automatique n'est créé** et la saisie manuelle est demandée. Mieux
  vaut rien que quelque chose au mauvais endroit.

### Contraintes offline

- Mouvement, transfert et lien commande/mouvement sont **réplicables**.
  Identifiant généré sur l'appareil, horodatage local conservé.
- Les soldes sont **calculables localement** à partir des mouvements embarqués.
  C'est ce qui permet à un agent de dire « il te reste X en caisse » hors-ligne.
- **Les mouvements automatiques sont créés hors-ligne**, au moment du service de
  la commande. Ils sont donc concernés par les mêmes règles de conflit que le
  verrou (ADR-0004, ADR-0005) : deux agents qui servent la même commande hors-ligne
  produisent deux mouvements, et l'un part en réconciliation.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** On teste par les soldes et les totaux, jamais par la structure des
mouvements.

**Les tests qui comptent :**

- **Le solde d'un compte est la somme algébrique de ses mouvements.** Test
  fondamental, et il doit inclure une sortie : c'est précisément ce que le
  prototype ne permettait pas.
- **Les six catégories produisent le bon sens.** Une `RECHARGE_OPERATEUR` ne peut
  pas être une entrée ; une `VENTE` ne peut pas être une sortie. Test de contrainte,
  pas seulement de calcul.
- **L'encaissement automatique se produit exactement une fois.** Servir une
  commande présentielle crée **un seul** mouvement en caisse. Le test compte les
  mouvements. Servir deux fois est impossible par la machine à états de S5, mais
  le test vérifie quand même que le total est juste.
- **Un transfert est neutre dans les totaux de flux.** Créer un transfert entre
  deux comptes ne change pas le total général, mais change les soldes des deux
  comptes. C'est le test qui distingue un transfert d'une recette.
- **Un transfert est atomique.** Une écriture qui échoue à mi-parcours ne laisse
  aucun mouvement. Test d'échec, pas seulement de succès.
- **Le total général est la somme des soldes de tous les comptes**, et il est
  stable à travers un transfert, une vente et un retrait.
- **La Description est conservée.** C'est le test du bug du prototype : une
  description saisie est relisible après enregistrement et après rechargement de
  la page. Hors-ligne en particulier, la file d'attente ne doit pas la perdre.
- **Hors-ligne, les soldes sont identiques** avec les mêmes mouvements embarqués.
  Test obligatoire pour un agent qui doit répondre « combien il te reste ? » en
  zone rurale.
- **Rien n'est supprimé** : une correction crée une écriture inverse, l'ancienne
  reste visible.
- **Les totaux de flux neutralisent les transferts** sur une période donnée.

## Out of Scope

- **Frais et commissions.** Le client ne les a pas déclarés. N'existe pas comme
  catégorie.
- **Rapprochement bancaire** automatique ou semi-automatique.
- **Comptage physique de caisse** : session d'inventaire, écart constaté,
  ajustement. L'application affiche un solde, elle ne le vérifie pas.
- **Trésorerie multi-devises** avec valorisation d'un compte dans une autre
  devise. Chaque compte est monolingue.
- Coffre-fort, retrait de personne de confiance, dépose en agence.
- Prévision de trésorerie, seuil d'alerte de trésorerie.
- Export comptable, plan comptable, intégration ERP.
- Le « stock de crédit » du distributeur : accès direct aux opérateurs, rien à
  suivre.

## Further Notes

**L'encaissement automatique est la promesse de cette spec.** Si le chef doit
encore saisir un encaissement après avoir servi une commande, on n'a rien gagné
par rapport au prototype, et il aura deux fois le travail. À traiter en priorité.

**Les transferts sont le piège classique.** Une saisie manuelle de deux lignes
« sortie de A » et « entrée dans B » est un moyen fiable de fausser un solde sans
le vouloir. D'où le transfert comme opération atomique unique, neutralisée dans
les totaux. Ne pas simplifier en deux mouvements indépendants : c'est
l'erreur qui coûte de l'argent.

**Le bug de la Description perdue dans le prototype** paraît anecdotique et ne
l'est pas. C'est le symptôme d'un flux d'enregistrement conçu autour de « remplir
puis vider le formulaire » plutôt que autour de « décrire ce qui s'est passé ».
Toute la spec S7 est écrite pour éviter ce schéma. Si une information est
demandée à l'utilisateur, elle est stockée.

**Ce qui n'est pas tranché.** Le client n'a pas su dire s'il suit ses **propres
dettes** envers des tiers — ce que le prototype appelait « Mes dettes ». Cette
trésorerie ne couvre que l'argent **du** distributeur. Si ce besoin existe, il
n'est pas dans cette spec et devra faire l'objet d'une spec distincte.
