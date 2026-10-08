# GLOSSARY — TKS

Vocabulaire normatif du domaine. **Ce fichier fait autorité.** Toute spec, tout
ADR, tout nom de variable, tout test et toute phrase de commit doit utiliser
ces termes. Les synonymes listés dans « Termes interdits » sont proscrits : ils
existaient dans le prototype Excel et décrivent le prototype Excel, pas la
réalité du métier.

Contexte : **single-context**. Il n'y a pas de `GLOSSARY-MAP.md`.

---

## Les quatre acteurs

### Distributeur
Le propriétaire de l'application. C'est **son** entreprise, avec **ses** agents.
Il a un accès direct aux grandes sociétés de télécommunication qui fournissent
le crédit. C'est la seule entité qui possède de l'argent dans ce système.

- Équivalents acceptés : « le propriétaire », « le chef », « la plateforme »
- **Termes interdits** : *shop*, *client*, *distributeur tiers*

### Client
Une entreprise qui **souscrit** une ligne de crédit et **commande** de l'airtime,
du crédit ou des données, puis **rembourse**. C'est le débiteur. Un client peut
avoir plusieurs commandes ouvertes en même temps.

- Équivalents acceptés : « le client », « la boutique » (en conversation
  seulement)
- **Termes interdits** : *shop* — le prototype Excel parlait de « shop » et le
  vocabulaire est désormais **client**. *acheteur*, *vendeur*, *utilisateur*

### Agent de service
Un employé du **distributeur**, présent sur le terrain. Il sert les commandes,
encaisse au comptoir, valide les preuves de paiement. Il a un téléphone et
travaille hors-ligne une grande partie du temps.

- Équivalents acceptés : « agent », « agent de service »
- **Termes interdits** : *employé du client*, *vendeur*, *opérateur*,
  *sous-distributeur*

### Administrateur technique
Le développeur. Il diagnostique et débloque les comptes, mais **ne détient aucun
pouvoir métier** : ni taux, ni plafond, ni promotion de client. Toute son action
est tracée dans le journal d'audit.

- **Termes interdits** : *super-admin*, *administrateur* (sans qualificatif —
  toujours préciser « principal » ou « technique »)

---

## Le compte, la validation et le dossier

Ces mots ne sont **jamais** synonymes. Les confondre, c'est laisser un client lire
la dette d'un autre.

### Compte
La **connexion**. Il porte l'identifiant et le mot de passe. Pour un client,
l'identifiant est son **numéro de téléphone**. Un compte peut exister seul, sans
dossier.

Un compte staff (administrateur technique, administrateur principal, agent de
service) est dans un seul de ces états : `VALIDE` (accès normal), `SUSPENDU`
(gel temporaire : connexion refusée, sessions tuées, retour vers `VALIDE`
possible), `REVOQUE` (définitivement inutilisable, aucun retour — rouvrir
passe par recréation).

Un compte client est dans un seul de ces états :

| État | Ce que ça veut dire |
| ---- | ------------------ |
| `EN_ATTENTE_VALIDATION` | inscrit, personne ne l'a encore vérifié. Il ne peut rien faire |
| `VALIDE` | un humain a vu une pièce d'identité et a validé |
| `REFUSE` | refusé, avec un motif. Le distributeur peut valider plus tard |
| `REVOQUE` | définitivement inutilisable |

### Validation
La **décision humaine** par laquelle un compte devient utilisable. Elle exige
qu'un administrateur ou un agent **ait vu une pièce d'identité**. Elle est
journalisée : qui, quand, sur quelle pièce.

Un compte `EN_ATTENTE_VALIDATION` **ne peut rien faire** : pas de dossier, pas de
solde, **pas de commande**, pas même prépayée. Il n'existe aucun chemin dans
l'application qui produise un compte validé sans pièce d'identité.

### Dossier client
La **fiche financière** : nom, adresse, créances, plafond, statut, pièce
d'identité. C'est le seul endroit où vit de l'argent. Il est créé par le
distributeur ou par un agent, **jamais** par le client lui-même.

Le dossier porte un **numéro de contact**, qui n'est **pas unique** : deux clients
peuvent partager un téléphone, et c'est courant en RDC.

### Rattachement
Le lien qui unit un compte validé à un dossier. C'est une **décision distincte de
la validation** : valider dit « cette personne est un client », rattacher dit
« cette personne est *ce* client ».

Un dossier **ne se désigne jamais par son numéro de téléphone seul**. La recherche
affiche nom, adresse et solde, et la confirmation demande le **nom**.

Tant qu'un compte n'est pas rattaché, il ne voit aucun dossier et aucun solde.

### Invariant de séparation
**Le numéro de téléphone est la clé du compte, jamais celle du dossier.** Il sert
à retrouver un dossier au moment du rattachement, et à rien d'autre.

---

## L'argent

### Taux de change
Le taux `1 USD = X CDF`. **Saisi manuellement par l'administrateur principal,
une fois par jour**, historisé. Il n'est jamais récupéré automatiquement d'une
banque centrale : c'est un taux négocié, donc maîtrisé.

### Devise pivot
**CDF.** Toute somme affichée à l'utilisateur l'est en CDF. Un solde de 100 USD
s'affiche « 100 USD ≈ 230 000 FC au taux du jour ».

### Devise de saisie
La devise **native** d'une créance ou d'un paiement : `USD` ou `CDF`. Chaque
écriture financière porte exactement une devise. Les deux colonnes en double du
prototype Excel (`Montant dette CDF` + `Montant dette USD`) sont **supprimées**.

### Créance
Un montant qu'un **client** doit au **distributeur**, avec sa devise et sa date
d'apparition. Provient soit d'une **commande** crédit servie, soit d'une saisie
manuelle (migration, dette ancienne, geste commercial).

### Paiement
Un montant que le **client** verse au **distributeur**, avec sa devise et sa
date. **Un client peut payer en CDF une dette libellée en USD**, et
réciproquement. Les paiements sont multi-devises par nature.

### Dette
**Dérivée**, jamais saisie : la somme des **créances** d'un client, exprimée en
CDF au taux du jour.

### Reste à payer
**Dérivé** : dette moins paiements, chaque montant converti en CDF au taux du
jour.

> *Exemple de référence. Il est normatif : cité tel quel dans S3 et S9, et couvert
> par un test dans chacune. Ne pas le reformuler.*
>
> Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF.
> Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF.
> **Reste à payer : 65 000 CDF.**

### Taux applicable
Le taux `1 USD = X CDF` **en vigueur**, saisi par un administrateur, une fois par
jour. Il n'est stocké sur aucune écriture. Il ne sert qu'à **convertir un montant
libellé en USD** ; un montant en CDF ne bouge jamais. Voir ADR-0001.

### Dette en dollars, solde en francs
Une dette libellée en USD **ne peut pas être durablement soldée en francs** : le
reste à payer bouge avec le taux, sans action du client. Pour clore une dette en
USD définitivement, il faut la payer en USD. Un paiement en francs règle la
position à la date du paiement, et repart dès le lendemain.

---

## Le crédit

### Statut du client
`EN_EVALUATION` ou `PRIVILEGIE`. Un client `PRIVILEGIE` peut passer des
**commandes crédit**. Un client `EN_EVALUATION` ne le peut pas : il doit
prépayer. La promotion est une **décision libre de l'administrateur principal**,
sans seuil automatique.

### Plafond de crédit
Le montant maximum que le client peut devoir simultanément. C'est un attribut
du client : une valeur par défaut s'applique à la création, l'administrateur
principal peut la modifier pour un client donné. Valeur de référence en
discussion : ~200 USD. **Le montant n'est pas encore confirmé par le client.**

### Plafond restant
`Plafond de crédit − dette totale`. C'est la seule quantité qui autorise une
commande crédit. Une commande qui le dépasse est **refusée**, pas acceptée en
négatif.

---

## La commande

### Commande
Une demande de crédit airtime émise par un **client**. Le prototype Excel
n'avait aucune commande : il journalisait des « réalisations », ce qui est une
autre chose. **Une dette naît d'une commande crédit servie, pas d'une saisie.**

- **Termes interdits** : *réalisation*, *vente* — le prototype Excel appelait
  ça « Réalisations Airtime ». Une réalisation est la **trace** d'une commande
  servie, pas la commande.

### Canal
`EN_LIGNE` ou `PRESENTIEL`. D'où vient la commande. Axe **distinct** du mode de
paiement.

- Le prototype Excel confondait ce concept avec le mot « virtuel », qui ne
  désigne rien ici.

### Mode de paiement
`ESPECES` ou `MOBILE_MONEY`. Comment l'argent a été payé. Axe **distinct** du
canal.

- `ESPECES` = argent liquide → **Caisse**
- `MOBILE_MONEY` → le compte mobile money du réseau concerné

### Type de commande
`PREPAYE` ou `CREDIT`.

- `PREPAYE` : le client paie avant. Il joint une **preuve**. La commande
  n'entre pas en file tant que la preuve n'est pas validée.
- `CREDIT` : la commande crée une **créance** à sa livraison. Réservé aux
  clients `PRIVILEGIE`.

### Grille tarifaire
Le prix d'une **unité** d'airtime, par **réseau**, historisé. Une commande
retient le prix qui s'appliquait au moment où elle a été passée.

### Unité
Une unité d'airtime d'un réseau donné. Un client peut commander **en unités**
(« 200 unités Orange ») ou **en montant** (« 100 USD d'airtime »), au choix.
Les deux sont vrais, les deux sont supportés.

### Preuve de paiement
Une **image** du paiement mobile money, **téléversée par le client lui-même**,
puis **validée ou refusée par un administrateur** avant que la commande n'entre
en file. La photo est compressée et plafonnée en taille.

- **Termes interdits** : *facture*, *reçu*, *justificatif*

### Verrou
Le fait qu'un agent soit en train de traiter une commande. Voir ADR-0004.

### Réconciliation
L'action manuelle d'un administrateur qui tranche un conflit de
synchronisation. **Jamais automatique.** Voir ADR-0005.

---

## La trésorerie

### Trésorerie
Le solde réel du distributeur. Ce n'est **pas** un journal d'entrées : le
prototype Excel n'acceptait que des montants positifs et ne pouvait donc pas
représenter une trésorerie.

### Caisse
Le compte des espèces.

### Compte mobile money
Un compte par réseau de paiement (Orange Money, Airtel Money, etc.).

### Mouvement de trésorerie
Une entrée ou une sortie sur un compte de trésorerie, avec une catégorie.

| Catégorie | Sens |
| --------- | ---- |
| `VENTE` | Entrée — encaissement d'une vente présentielle |
| `RETRAIT_BANQUE` | Sortie — espèces déposées sur un compte bancaire |
| `RECHARGE_OPERATEUR` | Sortie — fonds rechargés chez l'opérateur |
| `REMBOURSEMENT` | Sortie — argent rendu à un client |
| `TRANSFERT` | Sortie ou entrée — argent déplacé entre comptes |
| `RETRAIT_PROPRIETAIRE` | Sortie — retrait personnel |

`FRAIS` et `COMMISSION` ne sont **pas** des catégories de sortie. Le client n'en
a pas déclaré.

---

## Termes du prototype Excel qui n'existent pas

À ne pas réintroduire. Le prototype s'appelait `Prologiciel_TKS` et
« TKS » n'apparaît nulle part dans le vocabulaire métier actuel.

| Terme Excel | Réalité |
| ----------- | ------- |
| Shop | Client |
| Réalisation Airtime | Trace d'une commande servie |
| Objectif Airtime | Aucune cible n'est définie ; seule la mesure du réalisé existe |
| Mes dettes | Hors périmètre — le distributeur suit-il ses propres dettes ? Non tranché |
| Modes paiement (Cash / E-money / Banque / Autre) | Remplacé par **Mode de paiement** (ESPECES / MOBILE_MONEY) + **Canal** |
| Virtuel | N'est pas un terme du domaine. Ne pas l'utiliser. |

---

## Invariants

Des règles qu'aucune implémentation n'a le droit de rompre. Chacune est couverte
par au moins un test.

1. **Aucune création ni modification directe d'une dette, d'un reste à payer, ou
   d'un solde de trésorerie.** Tous sont dérivés. On écrit la cause (créance,
   paiement, mouvement), jamais le résultat.
2. **Une créance et un paiement portent exactement une devise**, jamais deux,
   jamais zéro.
3. **Une commande crédit servie crée exactement une créance**, et inversement.
4. **Une commande crédit refusée ne crée aucune écriture financière**, et son
   existence est tracée dans le journal d'audit.
5. **Aucun taux n'est stocké sur une écriture, et le taux ne mord que sur l'USD.**
   Un montant en CDF ne bouge jamais. Un montant en USD vaut ce que vaut le
   dollar au taux en vigueur. Une dette en USD ne peut donc être close
   définitivement que par un paiement en USD.
6. **Le plafond restant ne descend jamais sous zéro.** Une commande qui le
   dépasserait est rejetée.
7. **Un compte `EN_ATTENTE_VALIDATION` ne peut rien faire**, et aucun chemin du
   logiciel ne produit un compte validé sans pièce d'identité. Un compte non
   rattaché ne voit aucun dossier. Le numéro de téléphone est la clé du compte,
   jamais celle du dossier, et un dossier ne se désigne jamais par son seul
   numéro.
8. **Toute action métier est attribuée à un utilisateur authentifié** et
   horodatée. Le journal d'audit ne se modifie ni ne se supprime.
9. **Aucune donnée n'est écrite en dur dans un client.** Tout ce qui n'a pas pu
   se synchroniser est marqué en attente, jamais écrasé.
10. **Un montant supprimé ne l'est jamais.** On annule par une écriture inverse
    tracée.
11. **Le vocabulaire de ce fichier est utilisé tel quel.** Aucun terme
    interdit ne réapparaît dans le code, les tests ou la documentation.
