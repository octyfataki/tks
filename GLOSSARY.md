# GLOSSARY — TKS

Vocabulaire normatif du domaine. Ce fichier fait autorité. Toute spec, tout ADR,
tout nom de variable, tout test et toute phrase de commit doit utiliser ces termes.
Les synonymes listés dans « Termes interdits » sont proscrits.

Contexte : **single-context**. Il n'y a pas de `GLOSSARY-MAP.md`.

---

## Les quatre acteurs

### Distributeur
Le propriétaire de l'application et de l'entreprise de distribution.

- Équivalents acceptés : « le propriétaire », « le chef », « la plateforme »
- Termes interdits : *shop*, *client* (pour désigner le distributeur), *distributeur tiers*

### Client
Le **shop / la boutique** qui souscrit une ligne de crédit, commande de l'airtime,
du crédit ou des données, puis rembourse. Le client est l'entité métier qui porte
l'historique commercial et financier. Il est géré par un propriétaire ou responsable
humain, qui utilise un compte pour accéder à l'application.

- Équivalents acceptés : « client », « boutique » (en conversation seulement)
- Termes interdits dans le code et la documentation normative : *shop*, *acheteur*,
  *vendeur*, *utilisateur* pour désigner le client
- Le client n'est pas le compte de connexion : le compte est un moyen d'accès au
  client, pas le propriétaire des opérations financières.

### Propriétaire du client
La personne physique qui possède ou gère le client (la boutique) et utilise
l'application. Sa pièce d'identité sert à vérifier la personne qui demande l'accès.
La vérification de cette personne ne suffit pas, à elle seule, à prouver qu'elle
est autorisée à accéder à un client déjà enregistré.

### Agent de service
Un employé du distributeur, présent sur le terrain. Il sert les commandes, encaisse
au comptoir et valide les preuves de paiement. Il peut confirmer l'accès d'un compte
à un profil client existant si la permission métier correspondante lui est accordée.

- Équivalents acceptés : « agent », « agent de service »
- Termes interdits : *employé du client*, *vendeur*, *opérateur*, *sous-distributeur*

### Administrateur technique
Le développeur. Il diagnostique et débloque les comptes, mais ne détient aucun
pouvoir métier : ni taux, ni plafond, ni promotion de client. Toute action est tracée.

- Terme interdit : *super-admin*
- Toujours préciser « administrateur principal » ou « administrateur technique ».

### Administrateur principal
Acteur métier autorisé à prendre les décisions de gestion prévues par les specs,
notamment les plafonds et la promotion des clients.

---

## Compte, validation et profil client

Ces concepts sont distincts, mais ils ne doivent pas imposer une étape de
rattachement manuel systématique dans le parcours normal d'inscription.

### Compte
Le moyen de connexion. Il porte l'identifiant et les données d'authentification.
Pour un compte client, l'identifiant est le numéro de téléphone normalisé et unique
dans l'espace des comptes. Le compte peut être créé avant que son accès au profil
client soit autorisé. Il ne porte pas lui-même les créances, paiements, plafonds
ou commandes.

### État du compte client
Un compte client est dans un seul de ces états :

| État | Signification |
| --- | --- |
| `EN_ATTENTE_VALIDATION` | Inscription reçue ; aucune fonctionnalité métier client n'est accessible. |
| `VALIDE` | La personne a été vérifiée par un humain à partir d'une pièce d'identité. |
| `REFUSE` | Demande refusée avec motif ; une décision ultérieure peut la remplacer selon les règles d'audit. |
| `REVOQUE` | Compte définitivement inutilisable. |

La validation du compte vérifie la personne qui se connecte. Elle ne prouve pas
automatiquement que cette personne représente un client préexistant.

### Validation
Décision humaine, journalisée, par laquelle la personne est vérifiée à partir d'une
pièce d'identité. Aucun compte `EN_ATTENTE_VALIDATION` ne peut commander, consulter
des informations financières ou accéder à un profil client.

La pièce d'identité est conservée une seule fois comme artefact de vérification,
selon les règles de S1. Les usages de récupération de compte doivent respecter
les contrôles de sécurité propres à cette opération ; la possession d'une pièce
déposée antérieurement ne doit pas suffire, à elle seule, à autoriser une récupération.

### Profil client
La fiche métier du client (la boutique) : identité commerciale, nom, adresse,
coordonnées de contact, statut de crédit, plafond et accès à son historique financier.
Il existe un profil client unique par boutique réelle. Les commandes, créances,
paiements et autres opérations métier sont attribués à ce profil client, jamais au
numéro de téléphone ni au compte de connexion.

Le profil client est créé par le distributeur ou un agent, ou automatiquement dans
le cadre d'un parcours d'inscription approuvé. Le client ne peut pas créer pour
lui-même un second profil simplement parce qu'il a changé de téléphone.

### Accès au profil client
Association d'autorisation entre un compte validé et un profil client. Cette
association peut être créée automatiquement pour une nouvelle boutique, lorsque
le parcours a établi qu'il s'agit bien d'un nouveau client. Elle ne constitue pas
une étape manuelle systématique.

Si l'inscription semble correspondre à un profil client existant, aucun accès
financier n'est accordé automatiquement : un agent autorisé confirme la
correspondance après vérification. La validation du compte et la confirmation
d'accès sont deux décisions distinctes.

Règles :
- un profil client ne peut avoir qu'un compte client principal actif à la fois ;
- un compte client ne peut accéder qu'à un profil client à la fois ;
- un compte non validé ou non autorisé ne voit aucun profil ni aucune donnée financière ;
- un numéro de téléphone sert à retrouver des candidats, jamais à prouver seul l'identité
  du client ni à accorder l'accès ;
- toute création, confirmation, révocation ou correction d'accès est auditée ;
- une correction d'accès ne modifie jamais les opérations financières.

### Changement ou perte de téléphone
Le changement de numéro ne crée pas un nouveau client et ne déplace pas l'historique.
L'accès au profil existant est récupéré après vérification et procédure de récupération
sécurisée. L'ancien compte est révoqué ou désactivé selon la procédure applicable ;
l'accès au même profil est ensuite transféré avec journal d'audit. Il ne faut pas
créer un nouveau profil client pour contourner cette procédure.

---

## Argent

### Taux de change
Le taux `1 USD = X CDF`, saisi manuellement par l'administrateur principal et
historisé. Il n'est jamais récupéré automatiquement d'une banque centrale.

### Devise pivot
CDF. Toute somme affichée à l'utilisateur l'est en CDF, avec la devise native et
l'équivalent USD/CDF indiqués lorsque pertinent.

### Devise de saisie
La devise native d'une créance ou d'un paiement : `USD` ou `CDF`. Chaque écriture
financière porte exactement une devise.

### Créance
Un montant qu'un client doit au distributeur, avec sa devise et sa date d'apparition.
Elle provient d'une commande crédit servie ou d'une saisie manuelle autorisée.

### Paiement
Un montant que le client verse au distributeur, avec sa devise et sa date. Un client
peut payer en CDF une dette libellée en USD, et réciproquement.

### Dette
Dérivée : somme des créances d'un client, exprimée en CDF au taux du jour.

### Reste à payer
Dérivé : dette moins paiements, chaque montant converti en CDF au taux du jour.

> Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF.
> Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF.
> **Reste à payer : 65 000 CDF.**

### Taux applicable
Le taux `1 USD = X CDF` en vigueur, saisi par un administrateur principal, une fois
par jour. Il ne sert qu'à convertir un montant libellé en USD.

### Dette en dollars, solde en francs
Une dette libellée en USD ne peut pas être durablement soldée en francs : le reste
à payer bouge avec le taux. Pour clore une dette en USD définitivement, il faut la
payer en USD.

---

## Crédit

### Statut du client
`EN_EVALUATION` ou `PRIVILEGIE`. Un client `PRIVILEGIE` peut passer des commandes
crédit. Un client `EN_EVALUATION` doit prépayer. La promotion est une décision libre
de l'administrateur principal, sans seuil automatique.

### Plafond de crédit
Montant maximum que le client peut devoir simultanément. Une valeur par défaut
s'applique à la création du profil client ; l'administrateur principal peut la modifier.

### Plafond restant
`Plafond de crédit − créances dans la même devise`. Il est dérivé, jamais stocké.
Une commande qui dépasserait le disponible est refusée.

---

## Commande et trésorerie

### Commande
Demande de crédit airtime émise par un client. Une dette naît d'une commande crédit
servie, pas de la simple création d'une commande.

Termes interdits : *réalisation* ou *vente* pour désigner une commande. Une réalisation
est la trace d'une commande servie.

### Canal
`EN_LIGNE` ou `PRESENTIEL`. D'où vient la commande, indépendamment du mode de paiement.

### Mode de paiement
`ESPECES` ou `MOBILE_MONEY`.
- `ESPECES` : argent liquide, versé à la caisse.
- `MOBILE_MONEY` : paiement via le compte mobile money du réseau concerné.

### Type de commande
`PREPAYE` ou `CREDIT`.
- `PREPAYE` : paiement avant traitement ; preuve validée avant l'entrée en file si requise.
- `CREDIT` : crée une créance à la livraison ; réservé aux clients `PRIVILEGIE`.

### Grille tarifaire
Prix d'une unité d'airtime par réseau, historisé. Une commande conserve le prix
applicable au moment où elle a été passée.

### Unité
Unité d'airtime d'un réseau. Le client peut commander en unités ou en montant.

### Preuve de paiement
Image du paiement mobile money, téléversée par le client, puis validée ou refusée
par un administrateur avant que la commande n'entre en file.

Termes interdits : *facture*, *reçu*, *justificatif* pour désigner la preuve de paiement.

### Verrou
Le fait qu'un agent soit en train de traiter une commande. Voir ADR-0004.

### Réconciliation
Action manuelle d'un administrateur qui tranche un conflit de synchronisation.
Jamais automatique. Voir ADR-0005.

### Trésorerie
Solde réel du distributeur. La caisse est le compte des espèces ; un compte mobile
money existe par réseau de paiement.

### Mouvement de trésorerie
Entrée ou sortie sur un compte de trésorerie, avec une catégorie : `VENTE`,
`RETRAIT_BANQUE`, `RECHARGE_OPERATEUR`, `REMBOURSEMENT`, `TRANSFERT` ou
`RETRAIT_PROPRIETAIRE`.

---

## Termes à ne pas réintroduire

| Terme | Règle |
| --- | --- |
| `dossier client` comme objet métier indépendant obligatoire | Remplacer par **profil client**. Les références historiques peuvent être migrées vers le profil client correspondant. |
| `rattachement` comme étape obligatoire de chaque inscription | Remplacer par **création automatique du profil** ou **confirmation d'accès au profil existant**, selon le cas. |
| *shop* dans le code ou la documentation normative | Utiliser **client**. |
| *réalisation Airtime* | Désigne uniquement la trace d'une commande servie. |
| *virtuel* | Terme métier interdit. |

---

## Invariants

1. Aucune dette, aucun reste à payer et aucun solde de trésorerie n'est créé ou modifié directement : ils sont dérivés des écritures.
2. Une créance et un paiement portent exactement une devise.
3. Une commande crédit servie crée exactement une créance, et inversement.
4. Une commande crédit refusée ne crée aucune écriture financière ; le refus est audité.
5. Aucun taux n'est stocké sur une écriture ; le taux ne modifie que la conversion des montants USD.
6. Une commande crédit qui dépasse le disponible est rejetée.
7. Un compte `EN_ATTENTE_VALIDATION` n'accède à aucune fonctionnalité métier. Un compte `VALIDE` n'accède aux données financières qu'après autorisation d'accès au bon profil client. Un numéro de téléphone seul ne suffit jamais à autoriser cet accès.
8. Toute action métier et toute modification d'accès sont attribuées à un acteur authentifié et horodatées. Le journal d'audit est append-only.
9. Les données non synchronisées sont marquées en attente et ne sont jamais écrasées silencieusement.
10. Une opération financière ne se supprime pas : elle s'annule par une écriture inverse tracée.
11. Un changement de compte ou de téléphone ne crée pas un nouveau profil client et ne modifie pas l'historique financier.
12. Le vocabulaire normatif de ce fichier est utilisé dans le code, les tests et la documentation.
