# ADR-0004 : Le verrou ne peut pas être une décision serveur

**Statut** : Accepté
**Date** : 2026-10-06
**Dépend de** : ADR-0003

## Contexte

Le besoin métier est clair : **deux commandes ne peuvent pas être traitées en
même temps sur un même client.** Deux agents qui envoient deux fois le même
crédit, c'est de l'argent perdu.

La solution intuitive est un verrou serveur : la commande porte un statut
`VERROUILLÉE` avec l'identifiant de l'agent qui la traite ; les autres agents la
voient comme indisponible.

Cette solution est **incompatible** avec ADR-0003, et l'incompatibilité n'est pas
visible avant qu'on soit sur le terrain.

## Le problème

L'agent X est en zone rural, sans réseau. Il ouvre une commande, il la
verrouille. Mais verrouiller, ici, signifie **écrire localement** — ADR-0003
impose que l'écriture n'attende pas le serveur.

Le serveur ne l'a pas encore reçu. Il croit encore que la commande est libre.

À 5 km, l'agent Y est lui aussi hors-ligne. Il ouvre la même commande, il la
verrouille, il l'exécute, il envoie le crédit.

Quand les deux appareils retrouvent le réseau, il y a deux exécutions. Deux
crédits envoyés. Le verrou n'a jamais existé pour personne, parce qu'il n'a
été décidé par personne.

## Décision

**Le verrou est une décision locale, propagée comme un fait, pas comme un
verrou.**

1. Le verrou est posé **localement**, avec l'identifiant de l'agent et
   l'horodatage local. L'agent peut continuer à travailler immédiatement.
2. Le verrou est **propagé** à la synchronisation comme une écriture ordinaire.
3. À la synchronisation, deux verrous concurrents sur la même commande
   constituent un **conflit**. Voir ADR-0005 pour son traitement.
4. Un agent qui ouvre une commande **en ligne** voit le verrou des autres et ne
   peut pas la prendre. C'est le seul cas où le verrou protège réellement, et
   il ne faut pas le confondre avec une garantie hors-ligne.

## Conséquences

**Positives**

- L'agent n'attend jamais le réseau pour travailler.
- Le modèle est honnête : hors-ligne, le verrou est **indicatif**, et
  l'interface le dit.
- La propagation est une écriture de plus dans le flux, pas un mécanisme
  parallèle.

**Négatives**

- Le double envoi de crédit **reste possible**. Aucun modèle de réplication ne
  peut l'empêcher sans coordination temps réel, ce qui contredit l'offline.
- On ne peut pas opposer un verrou à un agent pour dire « c'est moi qui l'ai
  pris ». On peut seulement constater le conflit après coup.
- L'interface doit distinguer deux choses que l'utilisateur lirait sinon
  identiquement : « cette commande est libre » et « cette commande est prise par
  quelqu'un, **mais cette information date du dernier passage en réseau** ».

## Alternative écartée

**Assigner les tâches avant le terrain.** Le chef répartit le matin les
commandes du jour entre les agents ; chacun travaille sa liste, et aucun
conflit n'est possible puisque personne ne traite deux fois la même commande.

Écartée parce qu'elle déplaît : elle suppose que le chef soit disponible chaque
matin et qu'il connaisse l'affectation des agents à l'avance, ce qui n'est pas
vrai d'une petite structure. Elle reste **le meilleur remède opérationnel** et
doit être proposée au client comme règle de fonctionnement, même si l'application
ne l'impose pas.
