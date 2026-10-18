Status: ready-for-agent

# S5 côté client — passer une commande, déposer sa preuve, la suivre

Complète `.scratch/s5-orders-and-payment-proof/spec.md`. Ne traite **que le
client**. La file d'attente, le verrou, la caisse rapide et le service d'une
commande restent dans les tickets `04`, `05` et `06` — cette spec ne les
contredit pas, elle s'y branche.

Les règles du dépôt s'appliquent :

- le vocabulaire est celui de `GLOSSARY.md` ;
- les identifiants en anglais viennent de la table de correspondance
  `.scratch/english-identifiers/spec.md` ; ceux cités ici sont la proposition à
  confirmer là-bas ;
- l'état d'une commande se **déduit** de ses événements, il ne s'écrit jamais ;
- toute écriture doit tenir hors-ligne.

## Problem Statement

Le prototype Excel ne connaît **aucune commande**, et S5 est écrit du point de
vue de l'agent. Côté client, cinq manques restent ouverts.

1. **Aucun prix.** `APP - Form Airtime` porte `Unités réalisées`, `Valeur en
   CDF` et `Valeur en USD` : trois champs **tapés à la main**, sans lien. Deux
   agents vendent au même prix par chance, pas par règle.
2. **Le client ne peut pas commander.** Le seul chemin décrit par S5 est le
   comptoir. Or `commande.creer` est une permission de staff : prise au mot, la
   règle « créer une commande exige `commande.creer` » interdit au client de
   commander quoi que ce soit.
3. **Personne ne dit où payer.** S5 exige une preuve mobile money, mais les
   numéros du distributeur appartiennent à S7, qui n'existe pas. Le client n'a
   nulle part où envoyer son argent.
4. **Le plafond ne réserve rien.** Le disponible vaut `plafond − créances`. Une
   commande en attente n'est pas une créance : trois commandes de 100 USD sur
   une ligne de 100 USD passent toutes, et les trois sont servies.
5. **Le crédit est fermé par le statut.** S4 et le glossaire réservent la dette
   aux clients `PRIVILEGIE`. Le métier dit l'inverse : tout client validé doit
   pouvoir être servi, dans la limite de la ligne qui lui a été accordée.

## Solution

- Le client commande depuis son téléphone, **sans permission** : son droit vient
  de son **accès actif au profil client**. Un compte validé sans accès ne voit ni
  commande, ni solde, ni plafond.
- La **grille tarifaire** donne un prix par réseau et par unité, **libellé en
  USD**, historisé. La commande fige son prix ; les unités et le montant sont
  deux façons équivalentes de la saisir.
- Le **plafond** est la seule porte du crédit. Il existe **un plafond par
  devise**, il vaut **zéro** à la naissance du profil, et une commande crédit en
  attente **réserve sa part**.
- Le client passe **deux écrans** : la commande, puis le paiement — destination
  mobile money, montant attendu, photo du paiement.
- La preuve suit les règles de S5 : refus avec motif, renvoi sans recréer la
  commande, ancienne preuve conservée.
- Le client annule **avant** validation de sa preuve. Après, c'est un agent.

## Implementation Decisions

### Accès et droit de commander

- Le compte client doit être `VALIDE` et détenir un **accès actif à un profil
  client**. Sans accès : aucun écran de commande, aucun solde, aucune preuve.
- **Aucune permission n'est accordée à un compte client.** Les permissions
  restent un concept de staff. `commande.creer` reste le droit d'un agent pour
  le comptoir.
- Une commande appartient **au profil client**, jamais au numéro de téléphone ni
  au compte de connexion. Un client ne voit **que** les commandes du profil
  auquel il a accès.

### Statut, étiquettes et plafond

- Le **statut de crédit** et les **étiquettes** sont des informations de
  pilotage : ils ne ferment ni n'ouvrent le crédit. Voir
  `amendements.md`, points 1 et 2.
- **Deux plafonds par profil**, un en USD et un en CDF, chacun bornant les
  créances de sa devise. Les commandes étant libellées en USD, le plafond USD
  borne le crédit de commande ; le plafond CDF borne les créances en francs
  (S3-01 manuelles, S10 importées).
- **Valeur par défaut : zéro.** Le crédit s'accorde par décision de
  l'administrateur principal (S4).
- **Le disponible engage les commandes en attente :**

  `disponible = plafond − créances de la devise − commandes crédit en attente
  non annulées de la devise`

  Une commande crédit qui passe réserve sa part. Trois commandes de 100 USD sur
  une ligne de 100 USD n'en laissent passer qu'une. Le terme **Engagé** entre au
  glossaire.
- Le disponible n'est **jamais** négatif : si le plafond est abaissé sous
  l'engagé, la situation est signalée et aucune nouvelle commande crédit n'est
  autorisée (S4).

### Devise, unités et prix

- **La grille est en USD** ; une commande crédit servie crée donc une **créance
  en USD**.
- Le client saisit son montant **dans l'une ou l'autre devise**, et bascule
  unités ⇄ montant. La commande est **figée en USD**.
- L'autre devise est un **affichage converti et daté** au taux du jour. **Aucun
  taux n'est stocké** sur la commande (invariant 5, ADR-0001).
- À la confirmation, une phrase dit la conséquence : la dette est en dollars et
  sa valeur en francs bouge avec le taux.
- Le prix unitaire est **figé sur la commande**, dans les deux sens de saisie.
  Changer la grille ne réécrit aucune commande passée.
- Unité = quantité opérateur. Réseaux : liste fermée (Orange, Airtel, Africell,
  Vodacom, Autre).

### Écran 1 — Commander

- Champs : **réseau**, **unités ou montant**, **devise de saisie**, **prépayé ou
  dette**. Rien d'autre. Aucune navigation pendant la saisie.
- Affiche en direct : le prix unitaire en vigueur, les unités équivalentes, le
  montant USD, l'équivalent francs daté, et le **disponible**.
- L'option **dette** est **visible** et **désactivée** quand le disponible est
  nul, avec sa raison en clair et le chemin pour l'obtenir. Pas de bouton mort
  silencieux.
- Le **refus de plafond est préventif** : il dit le disponible restant, et
  aucun dépassement n'est autorisé.
- Confirmation **explicite** : une seule action crée la commande.

### Écran 2 — Payer

- Affiche la **destination** : le numéro mobile money du réseau de la commande,
  enregistré par l'administrateur principal (entrée de S7).
- Affiche le **montant attendu** : l'USD natif d'abord, son équivalent francs
  daté ensuite, avec le taux utilisé.
- Téléversement de la preuve : **compression côté client**, JPEG/PNG/WebP/PDF,
  2 Mo — la politique existe déjà dans `src/platform/files/policy.ts`
  (catégorie `preuve_paiement`). Un refus de taille est expliqué en clair.
- Si le client ferme l'application, la commande l'attend dans son suivi avec
  « preuve attendue ».

### Suivi et annulation

- Le client voit : l'état en français, le réseau, les unités, le prix figé, le
  montant USD et son équivalent francs daté, ses preuves et les motifs de refus.
- Le client ne voit **jamais** : l'agent qui traite, le verrou, un dossier de
  réconciliation, ni ses propres étiquettes.
- **Annulation par le client** autorisée tant que la preuve n'est pas validée
  (donc avant l'entrée en file), **tracée**. Après validation, seul un agent
  annule.
- **Aucune expiration automatique** d'une commande sans preuve : un client peut
  avoir payé sous coupure réseau. C'est l'humain qui tranche.

### Notifications

- **Dans l'application seulement.** Aucun push : le périmètre de S5 exclut la
  notification temps réel, et cette exclusion tient.
- Le client voit immédiatement que sa preuve est **reçue**, puis **validée** ou
  **refusée avec motif**.

### Hors-ligne

- Commande et preuve sont créées **hors-ligne**, avec identifiant généré sur
  l'appareil et horodatage local, puis réémises (S8).
- Hors-ligne, la vérification du plafond est **indicative** et l'interface le
  dit ; elle **fait autorité** à la synchronisation, où un dépassement produit un
  conflit (ADR-0005).
- La grille tarifaire du jour et la destination du réseau sont **embarquées**
  localement.

### Tables

- `orders`, `order_events`, `price_grid`, `payment_proofs`,
  `payment_destinations`.
- Aucune colonne d'état sur `orders` : l'état se déduit de `order_events`.
- Aucune colonne taux, nulle part.
- Le module vit dans `src/modules/orders/`. **Aucun dossier numéroté** dans
  `src/` (`cheminsNumerotes` vaut zéro et le reste).

## Testing Decisions

La couture est la couche applicative, contre une vraie base. On teste par les
états atteints et les écritures créées, jamais par une colonne stockée.

- **Un compte sans accès au profil ne commande pas** : ni écran, ni commande, ni
  preuve. Le test vérifie les trois.
- **Un client crée les siennes, et seulement les siennes** : le compte A ne voit
  ni ne modifie aucune commande du profil B.
- **Le disponible engage** : deux commandes crédit de 100 USD sur une ligne de
  100 USD — la première passe, la seconde est refusée avec le disponible restant.
- **Le plafond à zéro n'interdit pas de prépayer** : la même commande en prépayé
  passe, et l'option dette est refusée, pas silencieusement absente.
- **La grille en USD produit une créance en USD** : servir une commande crédit
  crée exactement une créance, dont la devise est `USD`.
- **Le prix est figé** : créer une commande, changer la grille, la commande garde
  ses unités et son montant.
- **Unités et montant sont équivalents** : 10 unités × 3 500 et 35 000 en
  devise de la grille donnent la même commande.
- **Aucun taux sur la commande** : test structurel — la table `orders` n'a pas de
  colonne taux, et il échoue si on l'ajoute.
- **Saisie dans l'autre devise** : l'affichage franc est daté, et changer le taux
  du jour ne modifie ni le montant USD ni le prix figé de la commande.
- **La preuve refusée n'ouvre pas la file**, et une nouvelle preuve se dépose
  **sans recréer la commande** ; l'ancienne reste consultable.
- **Le client annule avant validation, pas après** : les deux sens sont testés,
  et l'annulation est tracée.
- **Aucune expiration automatique** : une commande sans preuve reste ouverte
  après un délai injecté.
- **Hors-ligne** : une commande créée sans réseau atteint le bon état à la
  synchronisation, avec sa preuve, sans doublon.

## Out of Scope

- La file d'attente, le verrou, la caisse rapide, le service : tickets `04`,
  `05`, `06`.
- Toute notification push.
- La gestion de stock — le distributeur a un accès direct aux opérateurs.
- Le chat client/agent.
- La dérogation de plafond : le refus est net.
- La traduction de l'existant et la table de correspondance :
  `.scratch/english-identifiers/`.
