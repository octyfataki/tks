# ADR-0003 : Offline-first, avec détection de conflit à la synchronisation

**Statut** : Accepté
**Date** : 2026-10-06
**Dépend de** : ADR-0004, ADR-0005

## Contexte

Les agents de service travaillent sur le terrain, au téléphone, dans des zones où le réseau coupe régulièrement. Le besoin est explicite : **l'application doit
fonctionner sans réseau.** C'est ce qui justifie une PWA plutôt qu'un site web
classique.

Conséquence directe : l'écriture se produit **localement**, sur l'appareil, puis
se propage. Le serveur n'est plus le point de décision au moment de l'action.

Cela entre en tension directe avec un autre besoin : **deux agents ne doivent pas
traiter la même commande en même temps.** Voir ADR-0004 pour le raisonnement.

## Décision

**L'application est offline-first.**

1. Toute écriture métier est d'abord persistée **localement**, puis propagée.
   L'utilisateur n'attend jamais le réseau pour valider une action.
2. Chaque écriture locale porte un **identifiant unique généré sur l'appareil**
   et un **horodatage de création locale**, qui ne bougent plus.
3. La synchronisation est **bidirectionnelle** : elle pousse les écritures
   locales et tire les changements des autres appareils.
4. Un conflit est détecté **à la synchronisation**, pas au moment de l'action.
5. Un conflit ne se résout **jamais automatiquement**. Il est versé dans un
   fichier de **réconciliation**, traité par un administrateur.
6. Rien n'est jamais **écrasé silencieusement**. Une ligne en attente de
   réconciliation reste visible et comptabilisée dans les totaux.

## Conséquences

**Positives**

- L'agent ne perd jamais son travail. Une coupure réseau n'est pas un incident.
- Les applications mobiles n'ont pas besoin d'être ouvertes en permanence.
- Le téléphone peut être vissé à l'arrière d'un véhicule sans conséquence.

**Négatives**

- Le modèle de données doit être **réplicable**. Tout ce qui vit côté serveur
  doit pouvoir exister et évoluer côté client. C'est la contrainte structurante
  du projet.
- Les agrégats (solde, dette, reste à payer) doivent être calculables **aussi
  bien localement**, sinon un agent hors-ligne voit des chiffres faux.
- La validation du **plafond** ne peut pas être une garantie serveur au moment de
  la commande. Elle est indicative hors-ligne et **fait autorité** à la
  synchronisation. L'interface doit le dire explicitement à l'agent.
- Le stockage local de l'appareil est une source de perte de données. Un agent
  qui vide son téléphone perd ce qui n'est pas synchronisé. L'interface doit
  rendre l'état de synchronisation permanentemente visible.

## Contrainte structurante

Les specs S1 à S7 doivent être écrites en sachant ceci, même si S8 est construite
en dernier. Une spec qui introduit un élément non réplicable — un `id` généré
par la base, un `created_at` posé par le serveur, une colonne calculée par un
trigger — **invalide S8** et devra être reprise.
