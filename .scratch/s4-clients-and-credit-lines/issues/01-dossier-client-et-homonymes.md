# 01: Le dossier client, et deux homonymes qui restent deux clients

**What to build:** Le distributeur ouvre une fiche client : un nom, un numéro de
contact, une adresse. Il la retrouve ensuite en tapant le numéro, ou une partie du
nom. Deux entreprises qui s'appellent « Alimentation Chez Marie » à Kinshasa et à
Lubumbashi restent **deux dossiers**, jamais un seul — parce que c'est exactement ce
que le prototype faisait, et que leurs dettes se retrouvaient additionnées sans que
personne ne le voie.

Le dossier est créé par le distributeur ou par un agent. **Jamais par le client
lui-même** : un client qui saisit son propre nom n'a personne derrière pour dire que
c'est le bon.

**Blocked by:** les tickets S3 (le dossier porte des créances, qui portent une devise)

**Status:** ready-for-agent

- [ ] Le dossier porte un **nom**, un **numéro de contact** et une **adresse**.
      L'adresse reste un texte libre : pas de ville, province ou code postal
      décomposés.
- [ ] **Le nom est libre et non unique.** Ce n'est pas le nom qui identifie un
      client, et deux homonymes ne doivent jamais fusionner.
- [ ] **Test central de la spec : deux homonymes sont deux clients.** Deux fiches de
      même nom, téléphones différents, dettes différentes. Le total du portefeuille
      est la **somme des deux**, et la recherche par nom renvoie **les deux**. Sans
      ce test, on a réintroduit le bug du prototype.
- [ ] Le **numéro de contact est indexé mais non unique**. Deux clients peuvent
      partager un téléphone, et c'est courant. Un numéro déjà porté par un dossier
      est **accepté** : on en ajoute un second.
- [ ] **Une recherche par numéro propose plusieurs dossiers**, et **n'en retient
      aucun automatiquement**. La recherche affiche nom, adresse et solde. C'est ce
      qui empêche un numéro mal saisi de faire ouvrir la dette d'un client à la
      place d'un autre.
- [ ] La recherche accepte **plusieurs champs à la fois**, pour trouver un client
      dont on a mal retenu le nom.
- [ ] La fiche porte un **identifiant généré sur l'appareil** et un horodatage
      local. Une fiche créée hors-ligne est valide dès la synchronisation.
- [ ] Le distributeur voit **quand** la fiche a été créée et **qui** l'a créée.
- [ ] Le client peut **mettre son adresse à jour**.
- [ ] Créer un dossier exige la permission **`dossier.creer`**. Un client **ne crée
      jamais le sien** : il n'y a pas de chemin dans l'application, et l'absence est
      garantie par la base autant que par l'écran.
- [ ] Test navigateur mince : un client ne voit que **son** dossier. La vie privée du
      dossier est prouvée à l'écran, pas seulement en couche applicative.