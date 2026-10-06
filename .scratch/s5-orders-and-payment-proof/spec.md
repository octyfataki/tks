Status: ready-for-agent

# S5 — Commandes, grille tarifaire et preuve de paiement

## Problem Statement

Le prototype Excel **ne suit aucune commande**. Sa feuille « Réalisations
Airtime » est un journal de ventes **après coup** : on y inscrit ce qui a déjà
été fait. Il n'y a ni demande, ni file d'attente, ni état, ni Prix, ni preuve.

Cela produit six manques concrets :

1. **Aucune demande n'existe.** Un client qui appelle pour 100 USD d'airtime
   n'a nulle part où le dire. L'agent note dans un cahier ou se souvient, et le
   chef ne voit rien.
2. **Aucun prix.** Le classeur n'a pas de grille tarifaire. Combien vaut une
   unité ? Ça dépend de l'agent, du jour, de la négociation. Deux agents vendent
   au même prix, ce n'est pas garanti.
3. **Aucune preuve de paiement.** Un client qui prétends avoir payé par mobile
   money présente une capture d'écran que personne ne vérifie. C'est le risque
   financier numéro un du système.
4. **Aucune file d'attente.** Si les commandes de trois clients arrivent pendant que
   l'agent est au téléphone, il les perd.
5. **Aucun verrou.** Deux agents peuvent servir la même commande et envoyer le
   crédit deux fois.
6. **Le plafond n'est pas vérifié.** Il n'existe pas de plafond dans le
   prototype ; il ne peut donc pas être dépassé — ni respecté.

## Solution

La **commande** devient l'objet central du système. Le reste de la dette en
découle.

- Un client **commande**, en ligne depuis l'application ou au comptoir.
- La commande porte un **réseau**, et **en unités ou en montant**, au choix.
- Elle porte un **canal** (`EN_LIGNE` / `PRESENTIEL`) et un **type**
  (`PREPAYE` / `CREDIT`), qui sont deux axes **distincts**.
- Une commande `PREPAYE` exige une **preuve** téléversée par le client et
  **validée par un administrateur** avant d'entrer en file.
- Une commande `CREDIT` est **bloquée** si elle dépasse le plafond restant.
- Une **grille tarifaire** par réseau et par unité est gérée dans l'application
  et **historisée** ; le prix est figé sur la commande.
- Une commande **verrouillée** par un agent n'est plus visible comme disponible
  par les autres.
- Servir une commande `CREDIT` crée **exactement une créance**. Servir une
  commande `PREPAYE` n'en crée aucune.

## User Stories

### Grille tarifaire

1. As the distributor, I want to record the price of one unit per network, so that every agent sells at the same price.
2. As the distributor, I want to change a unit price, so that I can follow market movements.
3. As the distributor, I want past prices kept, so that an old order is still understandable.
4. As the distributor, I want each order to remember its price, so that a later price change doesn't rewrite history.
5. As an agent, I want to see the price before confirming an order, so that I don't quote the wrong figure.
6. As a client, I want to see the price before confirming, so that there are no surprises.
7. As the distributor, I want to see the unit price in francs and in dollars, so that I can quote either.

### Passer une commande

8. As a client, I want to order from my phone, so that I don't have to come in person.
9. As a client, I want to order by amount, so that I ask for the value I need.
10. As a client, I want to order by units, so that I get the exact quantity.
11. As the distributor, I want to record a phone order for a client at the counter, so that the client doesn't have to register to be served.
12. As the distributor, I want the counter entry to be as fast as possible, so that a queue doesn't build up.
13. As a client, I want to be told immediately if I exceed my ceiling, so that I know before being refused at the counter.
14. As a client, I want to know how many units I get for the amount I asked for, so that I understand the result.
15. As the distributor, I want an order to know its channel, so that I can tell online business from counter business.

### Preuve de paiement

16. As a client, I want to attach a photo of my mobile money payment, so that the order can be processed.
17. As a client, I want to know my payment was received, so that I don't chase for nothing.
18. As an administrator, I want to see the payment proof before the order enters the queue, so that I don't send credit for an unpaid order.
19. As an administrator, I want to refuse a proof with a reason, so that the client knows what to fix.
20. As a client, I want to be able to send a new proof after a refusal, so that I don't have to start over.
21. As an administrator, I want to see who validated a proof and when, so that a fraudulent validation is traceable.
22. As the distributor, I want to know how many proofs are waiting, so that I don't lose sales to a forgotten validation.
23. As an administrator, I want to know how long a proof has been waiting, so that I chase old ones.
24. As the distributor, I want to see how many proofs were refused and for what, so that I detect a pattern.

### File d'attente et dispatch

25. As the distributor, I want a queue of pending orders, so that no request is lost.
26. As an agent, I want to take an order from the queue, so that it becomes mine.
27. As an agent, I want to see who took an order I was interested in, so that I don't duplicate the work.
28. As the distributor, I want to see which agent is handling which order, so that I know where things stand.
29. As an agent, I want to work a client's orders together rather than order by order, so that I serve them faster.
30. As an agent, I want to leave an order to a colleague if I can't finish, so that the client isn't kept waiting.

### Exécution

31. As an agent, I want to mark an order as served, so that the client's credit is sent.
32. As the distributor, I want a served credit order to automatically become a debt, so that I don't record it twice.
33. As the distributor, I want a served prepaid order to create no debt, so that I don't chase money already received.
34. As the agent, I want to see the order's details before serving it, so that I send the right amount to the right network.
35. As an agent, I want to confirm serving with an explicit action, so that I can't serve by accident.
36. As the distributor, I want a served order to be irreversible, so that credit isn't sent twice.
37. As the distributor, I want to cancel an order before it's served, so that I can handle a mistake.
38. As the distributor, I want a cancellation traced, so that I know what happened.

## Implementation Decisions

### Machine à états de la commande

Décision issue de l'interview, précisée ici parce qu'elle encode plus précisément
que la prose ne peut l'exprimer.

```
Un état n'est **jamais** un champ modifiable directement : il se **déduit** des
événements. Une commande ne se met pas « à `SERVIE` », elle reçoit un événement
« crédit envoyé », et son état en découle. C'est ce qui rend l'état calculable
hors-ligne à partir des seuls événements reçus.

**Tableau des transitions, exhaustif et normatif.** Toute transition qui n'est pas
dans ce tableau est illégale et doit être refusée.

| Depuis | Événement | Vers | Effet de bord |
| ------ | --------- | ---- | ------------- |
| — | création, canal `PRESENTIEL` | `EN_FILE` | aucune preuve exigée |
| — | création, type `PREPAYE`, canal `EN_LIGNE` | `EN_ATTENTE_PREUVE` | — |
| — | création, type `CREDIT` | `EN_FILE` | plafond vérifié ; un dépassement est **refusé** et journalisé |
| `EN_ATTENTE_PREUVE` | preuve téléversée | `EN_ATTENTE_PREUVE` | compression et taille vérifiées |
| `EN_ATTENTE_PREUVE` | preuve **validée** | `EN_FILE` | qui a validé et quand est journalisé |
| `EN_ATTENTE_PREUVE` | preuve **refusée** | `EN_ATTENTE_PREUVE` | motif obligatoire ; l'ancienne preuve est conservée |
| `EN_FILE` | un agent prend la commande | `VERROU` | verrou **local**, horodatage local, identifiant de l'agent |
| `VERROU` | crédit envoyé | `SERVIE` | `CREDIT` : **exactement une** créance. `PREPAYE` : **aucune**. |
| `VERROU` | crédit déjà parti ailleurs (conflit ADR-0005) | `SERVIE` | un dossier de réconciliation est créé |
| `EN_ATTENTE_PREUVE` | annulation | `ANNULÉE` | journalisée |
| `EN_FILE` | annulation | `ANNULÉE` | journalisée |
| `VERROU` | annulation | `ANNULÉE` | journalisée |
| `SERVIE` | — | — | **terminale, aucune transition sortante** |
| `ANNULÉE` | — | — | **terminale, aucune transition sortante** |

**Il n'existe pas de transition `SERVIE` vers `ANNULÉE`.** Une version antérieure de
cette spec la représentait dans un dessin, et c'était une erreur : l'annuler
réouvrait la porte à un second envoi de crédit, ce qu'elle interdit précisément
lorsque l'agent a déjà envoyé le crédit par son téléphone avant de le signaler.
Une commande servie ne revient jamais en file, et une commande annulée ne se sert
pas. Ce sont deux extrémités, et le test exhaustif le vérifie dans les deux sens.

`RÉCONCILIER` n'est pas un état de la commande mais un **dossier de
réconciliation** qui référence la commande. La commande reste `SERVIE` : le crédit
est bien parti, deux fois, et le dossier enregistre ce qui s'est passé pour qu'un
administrateur tranche.

`RÉCONCILIER` n'est pas un état de la commande mais un **dossier de
réconciliation** qui référence la commande. La commande reste `SERVIE`.

### Axes canal et mode de paiement

Deux axes **distincts**, confusion issue du prototype Excel :

- **Canal** : `EN_LIGNE`, `PRESENTIEL`. D'où vient la commande.
- **Mode de paiement** : `ESPECES`, `MOBILE_MONEY`. Axe défini en S3/S7, il ne
  figure pas dans l'état de la commande.

Une commande `PRESENTIEL` **n'exige pas de preuve** : l'agent est témoin de
l'encaissement. Une commande `EN_LIGNE` de type `PREPAYE` **l'exige toujours** :
personne n'a vu l'argent.

### Grille tarifaire

- Prix **par réseau et par unité**, historisé. Chaque modification est datée et ne
  modifie pas les prix antérieurs.
- Le **prix est figé sur la commande** au moment de sa création, dans les deux
  sens : commande en unités (le prix unitaire est retenu) et commande en montant
  (le prix unitaire est retenu, pour pouvoir afficher les unités équivalentes).
- Les **réseaux** sont une liste fermée : Orange, Airtel, Africell, Vodacom, Autre.
- **Aucun stock n'est suivi.** Le distributeur a un accès direct aux opérateurs ;
  l'exécution de la commande se fait hors application, au téléphone de l'agent.

### Plafond

- Une commande `CREDIT` est **refusée** si son montant dépasse le disponible pour
  commander (S4). Le refus est **journalisé** — invariant 4.
- Une commande `PREPAYE` **n'est pas** soumise au plafond : l'argent est là.
- **Hors-ligne, la vérification du plafond est indicative**, pas bloquante, et
  l'interface le dit. Elle **fait autorité** à la synchronisation. Un dépassement
  constaté à la synchronisation produit un **conflit** au sens d'ADR-0005.

### Verrou

- Le verrou est **local**, avec l'identifiant de l'agent et l'horodatage local.
  Il est propagé comme une écriture ordinaire, pas comme un verrou serveur. Voir
  ADR-0004.
- Un agent qui ouvre une commande **en ligne** voit le verrou des autres et ne
  peut pas la prendre. Hors-ligne, un verrou visible peut être périmé : l'interface
  l'indique explicitement.
- Verrou **expirable** : un agent qui verrouille puis disparaît (téléphone perdu,
  panne) ne doit pas bloquer la commande indéfiniment. Un délai de péremption est
  configurable, et à son terme la commande redevient disponible.

### Mode caisse rapide (canal PRESENTIEL)

- Flux distinct de la commande en ligne, conçu pour la vitesse : numéro de
  téléphone → client trouvé ou créé → réseau → montant ou unités → confirmé.
- **Le strict minimum de champs.** Aucune navigation dans l'application pendant la
  saisie.
- Aucune preuve, aucun état intermédiaire visible par le client.
- C'est le parcours le plus fréquent en pratique. S'il est lent, les agents
  contourneront l'application et tout le système perd sa valeur.

### Preuve de paiement

- Image téléversée **par le client**, dans l'application, depuis son téléphone.
- **Compression obligatoire** et **plafond de taille**. Un message clair si la
  photo est refusée pour cette raison.
- Un administrateur **valide ou refuse**, avec un motif obligatoire en cas de
  refus.
- Une preuve refusée peut être **remplacée** sans recréer la commande.
- L'ancienne preuve est **conservée** et consultable. Une preuve n'est jamais
  écrasée.
- Hors-ligne, la validation est **locale et immédiate**, propagée comme une
  écriture. Elle **fait autorité** à la synchronisation.

### Contraintes offline

- Commande, verrou, preuve, validation : **tout est réplicable**. Identifiants
  générés sur l'appareil, horodatage local conservés.
- L'état d'une commande est **dérivé** de ses événements, pas stocké comme un
  champ modifiable. Un client hors-ligne peut donc calculer l'état d'une commande
  à partir des événements qu'il a.
- La grille tarifaire du jour est **embarquée** localement, pour chiffrer une
  commande hors-ligne.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** On teste par les états atteints et les écritures créées, jamais par la
colonne stockée.

**Les tests qui comptent :**

- **Le cycle de vie complet, tableau exhaustif.** Toutes les transitions légales
  et, pour chacune, une tentative de transition illégale qui doit échouer. Une
  commande `SERVIE` ne revient jamais en `EN_FILE`. Une `ANNULÉE` ne se sert
  pas. C'est le test central de cette spec, parce que la machine à états est
  l'essentiel de la fonctionnalité.
- **`PRESENTIEL` et `EN_LIGNE` pretreatment différemment sur la preuve.** Une
  commande présentielle entre en file immédiatement ; une prepayée en ligne
  n'entre en file qu'après validation. Ce sont deux chemins distincts, pas deux
  paramètres du même chemin.
- **Le prix est figé.** Une commande en unités est créée à un prix unitaire, le
  prix change, la commande conserve son prix et son nombre d'unités. Le montant
  de la commande ne bouge pas.
- **Commande en unités et en montant sont équivalentes** au même prix : les deux
  produisent le même montant et le même nombre d'unités. L'interface affiche les
  deux.
- **Le plafond bloque réellement.** Une commande crédit qui dépasse le disponible
  est refusée, et le refus est journalisé. Une commande prépayée du même montant
  passe.
- **Servir une commande crédit crée exactement une créance.** Pas deux, pas zéro.
  Compter les créances est le test. Invariant 3 du glossaire.
- **Servir une commande prépayée ne crée aucune créance.** Le test le symétrique du
  précédent.
- **Une preuve refusée n'ouvre pas la file**, et une nouvelle preuve peut être
  déposée sans recréer la commande.
- **Le verrou expiré libère la commande.** Une commande verrouillée par un agent
  qui disparaît redevient disponible après le délai, et le test le vérifie sans
  attendre en temps réel en injectant l'horodatage.
- **Hors-ligne, la commande atteint le bon état.** Une commande créée et servie
  hors-ligne est `SERVIE` à la synchronisation, avec sa créance, sans
  duplication.
- **Le mode caisse rapide tient en un écran**, sans navigation. Testé comme un
  parcours de bout en bout, pas comme une fonction.

## Out of Scope

- **Gestion de stock.** Le distributeur a un accès direct aux opérateurs ; rien à
  suivre. Cette décision a été prise explicitement.
- **Notification temps réel d'une nouvelle commande** au format push. Une
  notification est utile mais ce n'est pas une commande : hors périmètre ici.
- **Chat entre client et agent.** Explicitement écarté lors de l'interview.
- Suivi de livraison, preuve de réception par le client.
- Prévision de ventes, recommandation de prix, historique de commandes suggérées.
- Attribution automatique à l'agent le moins chargé. Le dispatch est une action
  humaine ; l'alternative « affectation avant le terrain » est une règle
  d'exploitation, pas une fonctionnalité.
- Dépassement de plafond **autorisé avec exception** par un administrateur. Le
  refus est net, sans dispositif de dérogation.
- Une commandefractionnée en plusieurs envois de crédit. Une commande = un envoi.

## Further Notes

**Le verrou et l'offline sont en tension, et c'est assumé.** ADR-0004 pose le
raisonnement : un verrou posé hors-ligne n'a jamais été décidé par personne, donc
un double envoi de crédit reste possible. Ce que l'application garantit, c'est
que le double envoi est **détecté, tracé et réconciliable**, pas qu'il est
imprévisible. Ne pas tenter de « renforcer » le verrou en le rendant serveur :
cela casserait l'offline-first, qui est un besoin métier non négociable.

**Le dépassement de plafond hors-ligne est le risque financier principal du
système.** Un agent en zone rurale peut laisser passer une commande que le
plafond n'autorise pas, si le client a des commandes ailleurs. Le contrôle à la
synchronisation le rattrape et produit un conflit, mais l'argent du crédit est
déjà parti. La parade réelle est **organisationnelle** — l'affectation des tâches
avant le terrain, cf. ADR-0004. Il faut en parler au client comme une règle de
fonctionnement, pas comme un problème que le logiciel résout.

**Le mode caisse rapide est plus important que le reste de cette spec.** C'est le
parcours le plus fréquent, et c'est par lui que les agents jugeent l'application.
S'il est lent ou pénible, ils passent par un cahier et le système se vide de son
intérêt. À traiter en priorité dans l'implémentation, même si d'autres éléments
paraissent plus urgents.

**Pourquoi une commande annulée est terminale.** Parce qu'une commande annulée peut avoir déjà été exécutée hors application : l'agent a envoyé le crédit par
son téléphone avant de le signaler. Rouvrir l'état rouvrirait la porte à un second
envoi. Le canal `ANNULÉE` est donc une **constatation administrative**, pas une
action.
