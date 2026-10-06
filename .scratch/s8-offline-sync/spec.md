Status: ready-for-agent

# S8 — Offline-first et synchronisation

**Cette spec est construite en dernier mais contraint toutes les autres.** Une
spécification S1 à S7 qui introduit un élément non réplicable invalide cette
spec et devra être reprise.

## Problem Statement

Les agents de service travaillent **dans la rue, au téléphone, avec un réseau qui
coupe**. C'est la réalité du terrain, pas une difficulté technique optionnelle.

Le prototype Excel ne connaît pas le problème : un fichier, un disque local,
aucune synchronisation. Il ne perd rien — parce qu'il n'y a rien à perdre, et
aussi parce qu'il ne partage rien.

Une application web classique crée le problème par l'autre bout : le réseau est
requis pour chaque action. Un agent devant un client quand la connexion tombe
est bloqué, avec le client en face.

Entre les deux, il y a ce que le client a explicitement demandé : **une
application qui marche sur le terrain, et qui serve tout le monde**. Écrire
n'est pas possible sans réseau ; lire non plus, en pratique.

## Solution

L'application est **offline-first** : l'appareil est la source de l'action, le
serveur est le point de convergence.

- Toute écriture est **d'abord locale**, puis propagée. L'utilisateur n'attend
  jamais le réseau.
- Chaque écriture porte un **identifiant généré sur l'appareil** et un
  **horodatage local** qui ne sont jamais réécrits.
- La synchronisation est **bidirectionnelle**.
- Un conflit est **détecté à la synchronisation** et versé dans un **dossier de
  réconciliation**.
- **Aucune réconciliation automatique.** Jamais d'écrasement silencieux.
- Les **photos** sont compressées, plafonnées, et mises en file d'attente
  d'upload.
- L'agent voit **en permanence** ce qui n'est pas encore synchronisé.

## User Stories

### Travailler sans réseau

1. As an agent, I want to register a counter sale with no network, so that the client isn't kept waiting.
2. As an agent, I want to serve an order with no network, so that the client is served wherever he is.
3. As an agent, I want to validate a payment proof with no network, so that I don't have to come back later.
4. As an agent, I want to record a payment with no network, so that I can give the client their balance immediately.
5. As an agent, I want to see a client's balance with no network, so that I can answer a question in the field.
6. As an agent, I want to see a client's remaining credit ceiling with no network, so that I don't promise too much.
7. As an agent, I want my session to survive closing the app, so that a restart loses nothing.
8. As an agent, I want my session to survive the phone restarting, so that a battery death loses nothing.
9. As a client, I want to place an order with no network, so that a coverage gap doesn't stop me ordering.
10. As a client, I want to attach a payment proof with no network, so that I'm not blocked from a spot with no signal.
11. As the distributor, I want to see the day's activity even if some agents haven't synced, so that I know what's happening.

### Savoir où on en est

12. As an agent, I want to see how many changes are waiting to sync, so that I know if I'm working at risk.
13. As an agent, I want to be warned clearly when my data is out of date, so that I don't act on stale information.
14. As an agent, I want to be told when my data was last updated, so that I know how stale it is.
15. As an agent, I want to be warned before syncing would erase pending work, so that I never lose it.
16. As an agent, I want to be able to sync manually when I choose, so that I control when I use data.
17. As an agent, I want to know a sync succeeded, so that I'm not left wondering.
18. As an agent, I want to know a sync failed and why, so that I can act.

### Conflits

19. As an administrator, I want to be told about every synchronisation conflict, so that no conflict goes unnoticed.
20. As an administrator, I want to see both sides of a conflict, so that I can judge.
21. As an administrator, I want to decide how to reconcile each conflict, so that the decision is mine and not the software's.
22. As an administrator, I want a conflict to require a deliberate action, so that it can't be dismissed by accident.
23. As an administrator, I want to see which agents and which clients are involved, so that I understand the pattern.
24. As an administrator, I want to see how long a conflict has been open, so that urgent ones surface.
25. As the distributor, I want to know if a client repeatedly causes conflicts, so that I can address the organisation.

### Photos

26. As a client, I want to take the payment proof directly in the app, so that I don't juggle two applications.
27. As a client, I want to know my photo was recorded even without signal, so that I'm confident it went through.
28. As an administrator, I want to view a proof photo on my phone, so that I can validate it from anywhere.
29. As an administrator, I want to know a proof photo failed to upload, so that I don't wait for evidence that never arrives.
30. As an agent, I want a photo I took offline to upload by itself later, so that I don't have to do it manually.

## Implementation Decisions

### Modèle de réplication

- **Identifiant généré sur l'appareil.** Aucun identifiant n'est attribué par la
  base. Une entité est Globally Unique par construction, pas par une séquence.
- **Horodatage local conservé.** L'horodatage de création d'une écriture est posé
  sur l'appareil et **jamais réécrit** par le serveur. L'horodatage de réception
  serveur est stocké **à côté**, jamais à la place. Les deux sont visibles : c'est
  ce qui permet de diagnostiquer une synchronisation.
- **Aucune donnée calculée par la base** : pas de colonne `generated always as`,
  pas de trigger, pas de `now()` côté serveur dans une valeur métier. Le
  déclencheur est une fonction applicative, donc réplicable.
- **État dérivé, pas stocké.** L'état d'une commande, la dette, le reste à payer,
  le solde d'un compte : tout est recalculé à partir des événements, donc
  identique en ligne et hors-ligne.
- **Suppression proscrite.** Une « suppression » est une écriture inverse. Il n'y
  donc aucune ambiguïté de synchronisation sur une suppression : deux appareils ne
  peuvent pas « ne pas supprimer » différemment.

### File d'attente

- Toute écriture locale non encore propagée reste dans une **file d'attente
  ordonnée** par horodatage local.
- La file est **durable** : elle survit au redémarrage de l'application et du
  téléphone. C'est la condition pour que l'offline-first ait un sens.
- La propagation est **idempotente** : réémettre la même écriture ne la duplique
  pas. C'est ce qui rend la reprise après échec possible sans état supplémentaire.
- L'agent voit en permanence le **nombre d'écritures en attente**.

### Détection de conflit

- Un conflit est détecté quand **deux appareils produisent des écritures
  concurrentes sur le même agrégat** : deux services de la même commande, deux
  prises en charge de la même commande, deux changements de statut d'un même
  client, deux corrections d'un même paiement.
- La résolution est **gauche** : la première écriture propagée gagne, la seconde
  est conservée intégralement et **versée dans un dossier de réconciliation**.
- Le dossier contient **les deux versions**, avec leurs auteurs et leurs
  horodatages locaux.
- **Aucune exception automatique**, pas même « si les deux écritures produisent
  le même résultat ». Voir ADR-0005.
- Un dossier ouvert reste **visible et comptabilisé** dans les totaux et les
  alertes. Il n'est jamais masqué.
- Un dossier résolu reste **consultable** indéfiniment.
- **Un taux qui a bougé n'est pas un conflit.** Quand le taux en vigueur change,
  tous les soldes en USD changent, alors qu'aucune écriture n'a été en désaccord.
  Un changement de solde dû au taux **ne produit donc aucun dossier** : il n'y a
  rien à réconcilier, puisque rien n'a été écrit deux fois. Voir ADR-0001.

### Photos

- Photo prise **dans l'application**, compressée et **plafonnée en taille**. Un
  message clair à l'utilisateur si la photo est refusée pour cette raison.
- La photo est **dans la file d'attente** comme les écritures : elle ne bloque
  pas l'agent et ne bloque pas la commande.
- L'upload est **en tâche de fond**, sans intervention.
- Une photo dont l'upload échoue **apparaît dans une liste de retry**, jamais
  silencieusement perdue.
- La preuve **n'est pas considérée comme valide** tant que la photo n'est pas
  consultable par un administrateur. Une validation dont la photo manque est
  signalée comme telle.

### Indicateur d'état

- Un indicateur **permanent** montre : nombre d'écritures en attente, état de la
  dernière synchronisation, horodatage de la dernière donnée reçue.
- Un bandeau d'avertissement apparaît quand les données sont **périmées** au
  sens où une décision prise dessus pourrait être fausse (plafond, verrou,
  file d'attente).
- **Aucun écrasement possible** d'une écriture en attente par une action de
  l'utilisateur. Si une action Entre en conflit avec une écriture locale, les
  deux sont conservées et l'utilisateur est averti.

## Testing Decisions

**Cette spec introduit une deuxième couture, et c'est justifié :** la
fonctionnalité *est* la convergence. Aucune couture existante ne peut la
tester.

**La couture de synchronisation** : **deux réplicas clients indépendants**,
convergent via le vrai point de terminaison de synchronisation, contre une vraie
base. Le test n'utilise aucun raccourci : pas de simulation de réseau, pas de
double enregistrement direct en base. On crée les écritures par l'API réelle,
comme le ferait un appareil.

**Les tests qui comptent :**

- **Le test de base : un appareil seul, hors-ligne, puis synchronisé.** Écrire
  toutes les entités de S1 à S7 hors-ligne, synchroniser, vérifier que l'état
  serveur est exactement celui attendu. C'est le test qui valide que le modèle
  est réellement réplicable — et c'est le test le plus long du projet.
- **Deux appareils, aucune collision.** L'appareil A et l'appareil B écrivent des
  choses différentes sur le même client hors-ligne. Après synchronisation, les
  **deux** écritures existent. C'est le test de l'additivité.
- **Deux appareils, collision.** L'appareil A et l'appareil B servent la même
  commande hors-ligne. Après synchronisation : **une** commande servie, **une**
  créance, **un** mouvement de caisse, et **un dossier de réconciliation** qui
  contient les deux exécutions. C'est le test le plus important du projet — il
  valide ADR-0003, ADR-0004 et ADR-0005 d'un coup.
- **La réconciliation est humaine et obligatoire.** Après la collision, le
  dossier existe, est visible, et **ne peut pas être clos sans une action
  explicite** qui est elle-même journalisée.
- **Rien n'est écrasé.** Une assertion générale sur l'ensemble du projet : après
  n'importe quelle séquence de synchronisation, le nombre d'écritures côté client
  est **égal** au nombre d'écritures conservées côté serveur, dossier de
  réconciliation compris. Aucune écriture ne disparaît. C'est la propriété
  centrale de tout le système.
- **L'idempotence.** Réémettre le même paquet de synchronisation deux fois ne
  change rien. Testé en réémettant le paquet brut, pas en refaisant la
  saisie.
- **La file d'attente est durable.** Créer des écritures hors-ligne, fermer
  l'application, la rouvrir, redémarrer le téléphone simulé, synchroniser : rien
  n'est perdu.
- **Les soldes hors-ligne sont exacts.** Solde, dette, reste à payer, plafond
  restant, solde de caisse — tous identiques avec et sans réseau, à taux
  embarqué égal. Test transversal qui traverse S3, S4, S6 et S7.
- **Le taux embarqué est daté.** Un agent hors-ligne voit la date du taux qu'il
  utilise, et un taux plus ancien est signalé comme tel.
- **La file photo.** Une photo prise hors-ligne arrive après le retour du réseau,
  sans intervention. Une photo en échec d'upload est dans la liste de retry.
- **La réémission après échec de synchronisation** ne duplique rien et ne perd
  rien.

**La couture principale de S1 à S7 s'applique telle quelle**, sans adaptation :
les tests de calcul et de contrainte sont inchangés. Ils doivent simplement
pouvoir s'exécuter dans les deux contextes.

## Out of Scope

- **Résolution automatique de conflit**, sous quelque forme que ce soit :
  CRDT, fusion de texte, comparaison de valeurs, Last-Write-Wins silencieux.
  Exclu délibérément, c'est ADR-0005.
- **Écritures serveur-autoritaires.** Si le serveur peut refuser une écriture,
  il faut être connecté, ce qui contredit le besoin.
- **Synchronisation temps réel** (WebSocket, push serveur). La synchronisation est
  déclenchée et par l'appareil. C'est un choix : le temps réel coûte de la
  complexité et du réseau pour un gain marginal en terrain.
- **Multi-résolution d'un conflit** sans intervention : aucun serveur ne tranche
  à la place d'un humain.
- **Récupération après perte totale de l'appareil** sans synchronisation
  préalable : les données non synchronisées sont perdues. Ce risque est accepté et
  doit être signalé dans l'interface.
- Synchronisation entre **plusieurs distributeurs**.
- Chiffrement local du magasin de données de l'appareil.
- Mode hors-ligne en lecture seule : ici, hors-ligne, on écrit.

## Further Notes

**Cette spec est la plus difficile du projet et la plus sous-estimée.** Le
reste du travail est de la modélisation de domaine, qui est difficile mais
bornée. Ici, il faut prouver qu'un modèle conçu pour le serveur se laisse
répliquer sans que personne ne s'en aperçoive. C'est ce qui a produit les
décisions S1 à S7 sur les identifiants et les horodatages.

**L'ordre de construction est un piège.** On construit S1 à S7, on teste, tout
marche en ligne — puis on découvre que la moitié du modèle n'est pas réplicable
et on réécrit. D'où la règle inscrite dans `AGENTS.md` : toute écriture doit être
capable de se faire sans réseau. Cette règle doit être appliquée **pendant** la
construction de S1 à S7, pas vérifiée après.

**Le test le plus important du projet** est celui de deux appareils servant la
même commande hors-ligne. Il doit exister avant que la première ligne de code de
synchronisation ne soit écrite, même sous forme de test qui échoue. Il échec est
la spécification.

**Ce que l'offline ne résout pas.** Il ne résout pas le double envoi de crédit,
il le rend détectable. ADR-0004 le dit : la seule prévention est
l'organisationnelle. Le logiciel doit donc **signaler** la répétition de conflits
sur un même client, parce que c'est un signal de problème d'organisation, pas de
logiciel.

**Le compteur d'écritures en attente n'est pas un détail d'interface.** C'est le
seul moyen pour un agent de savoir s'il travaille en sécurité. S'il n'est pas
visible en permanence et en évidence, un agent perdra du travail sans le savoir, et
ce sera la première fois que le système sera blâmé.
