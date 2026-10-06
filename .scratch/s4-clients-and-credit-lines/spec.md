Status: ready-for-agent

# S4 — Clients et lignes de crédit

## Problem Statement

Dans le prototype Excel, un client est **une chaîne de caractères dans une
colonne**. Cela produit trois défauts immédiatement visibles :

1. **Les homonymes sont indiscernables.** Deux entreprises qui s'appellent
   « Alimentation Chez Marie » à Kinshasa et à Lubumbashi sont le même client
   pour la feuille. Leurs dettes sont additionnées. Le total est faux et personne
   ne s'en aperçoit.
2. **Le crédit est illimité.** Rien dans le prototype ne dit combien un client
   peut devoir simultanément. Le chef compte de mémoire, ce qui tient jusqu'au
   premier client qui dépasse la mesure.
3. **Rien ne distingue un bon payeur d'un mauvais.** Il n'y a pas de statut. Tout
   le monde a les mêmes droits, donc tout le monde peut prendre du crédit.

Et le prototype ne gère pas du tout l'entrée d'un nouveau client : il n'y a ni
formulaire, ni identité, ni contact.

## Solution

Une fiche client réelle, avec une identité unique, et une **ligne de crédit**
explicite qui borne l'exposition du distributeur.

- Le **dossier client porte un numéro de contact, qui n'est pas unique.** Deux
  clients peuvent partager un téléphone — c'est courant — et un client peut en
  changer sans que sa dette bouge. Le dossier est désigné par son **nom** dans
  toute opération sensible.
- Le **numéro de téléphone est l'identifiant unique du compte**, en S1, et
  **seulement** celui-là. Il ne porte aucune donnée financière. Voir « Fiche
  client » dans les décisions d'implémentation.
- Chaque client porte un **statut** : `EN_EVALUATION` ou `PRIVILEGIE`. Seul un
  client `PRIVILEGIE` peut passer des commandes crédit.
- Chaque client porte un **plafond de crédit**, qui est le maximum qu'il peut
  devoir **simultanément**.
- Une **valeur par défaut** s'applique à la création ; l'administrateur
  principal peut la modifier pour un client donné.
- Le **plafond restant** est dérivé : `plafond − dette totale`. C'est la seule
  quantité qui autorise une commande crédit.
- La promotion est une **décision libre** de l'administrateur principal, sans
  seuil automatique.
- Une **pièce d'identité** est collectée à la création du dossier et conservée.
  Elle sert à deux choses : la réinitialisation de mot de passe et la **validation
  du compte** (S1). C'est la même pièce, pas deux.

## User Stories

### Identité du client

1. As the distributor, I want to create a client's file with a name, a contact number and an address, so that I can start tracking a debt.
2. As the distributor, I want two clients with the same name to be two different clients, so that their debts are never merged.
3. As the distributor, I want to find a client by phone number, so that serving someone at the counter takes seconds.
4. As the distributor, I want to search by several fields at once, so that I find a client whose name I misremember.
5. As the distributor, I want a phone number to lead me to every client who uses it, so that I do not pick the wrong one.
6. As the distributor, I want to see when a client's file was created and who created it, so that I can trace the origin of the record.
7. As a client, I want to upload an identity document once, so that getting my account validated and recovering my password are both easy.
8. As a client, I want to update my address, so that my file stays current.
9. As the distributor, I want to see a client's complete history in one place, so that I have the whole file.

### Statut

10. As a client, I want to know my status, so that I understand whether I can order on credit.
11. As the distributor, I want a new client to start in EN_EVALUATION, so that nobody gets credit before I decide.
12. As the distributor, I want to promote a client to PRIVILEGIE, so that I can reward a reliable payer.
13. As the distributor, I want to demote a client to EN_EVALUATION, so that I can stop extending new credit.
14. As the distributor, I want promotion and demotion to be immediate, so that the change takes effect at once.
15. As the distributor, I want to see who changed a client's status and when, so that the decision is traceable.
16. As the distributor, I want to know which clients I demoted and why, so that I can explain it to them.
17. As a client, I want to know that I can become PRIVILEGIE, so that I know what to aim for.
18. As the distributor, I want to list clients by status, so that I can find who to promote.

### Plafond de crédit

19. As the distributor, I want a default credit ceiling applied to new clients, so that I don't set each one by hand.
20. As the distributor, I want to set a client's ceiling individually, so that I can adapt it to that client's situation.
21. As the distributor, I want to change a ceiling at any time, so that I can react to a large order.
22. As the distributor, I want the change of ceiling to leave existing debt untouched, so that I can't quietly forgive money.
23. As a client, I want to see my remaining ceiling, so that I know how much more I can order.
24. As a client, I want to see my remaining ceiling in francs, so that I understand the number.
25. As a client, I want to be refused cleanly when I exceed my ceiling, so that I know the limit before trying.
26. As the distributor, I want the remaining ceiling to be shown in the client list, so that I see at a glance who is near their limit.
27. As the distributor, I want to see clients close to their ceiling, so that I can anticipate.
28. As the distributor, I want the remaining ceiling to never go negative, so that a display never shows a nonsensical figure.
29. As the distributor, I want to see the ceiling in the currency it was set in, so that I don't confuse a dollars ceiling with a francs debt.

### Tri et suivi

30. As the distributor, I want clients sorted by amount owed, so that I know who to chase first.
31. As the distributor, I want to see how long a client has been owing, so that I judge urgency.
32. As the distributor, I want to see clients owing more than N days, so that I can act on the worst ones.
33. As the distributor, I want to search for a client with an overdue balance, so that I prepare before they arrive.
34. As a client, I want my file to be private, so that I don't see other clients.

## Implementation Decisions

### Fiche client

- Le dossier porte un **numéro de contact** au format international normalisé,
  **indexé mais non unique**. Il sert à retrouver un dossier, pas à l'identifier.
- Le dossier est désigné par son **nom** dans toute opération sensible : le
  rattachement d'un compte, la validation d'une pièce, la sélection d'un dossier.
  Confirmer « par son nom » est délibéré : c'est ce qui empêche un numéro mal
  saisi de faire afficher la dette d'un client à un autre.
- **Le numéro de téléphone est la clé du compte, jamais celle du dossier** (S1).
  Il n'est pas l'identifiant de connexion *de la fiche* : c'est la fiche qui est
  rattachée au compte, pas l'inverse.
- Le nom est **libre et non unique**. C'est l'erreur du prototype qu'on corrige :
  ce n'est pas le nom qui identifie un client de façon unique, mais il reste la
  seule chose qu'un humain peut confirmer à voix haute.
- La **pièce d'identité** est une image compressée et conservée, dont
  l'**artefact appartient à S1** : le client la dépose une fois depuis
  l'application, et c'est la validation du compte qui la référence. Le dossier la
  **référence**, il ne la duplique pas et ne la redemande pas — un dossier peut
  donc être rattaché à un compte déjà validé sans nouvelle pièce. Deux usages pour
  une seule pièce : la validation du compte et la réinitialisation de mot de
  passe.
- La fiche porte une **clé générée par l'appareil** et un horodatage local. Une
  fiche créée hors-ligne est valide dès la synchronisation.

### Statut

- Deux valeurs : `EN_EVALUATION`, `PRIVILEGIE`. `EN_EVALUATION` par défaut.
- **Aucun seuil automatique.** Pas de « trois commandes prépayées à temps
  suffisent ». La décision est humaine, c'est un choix explicite du client.
- Le statut est modifiable librement et **immédiatement**. Aucune période
  d'attente, aucune expiration automatique.
- Le passage en `PRIVILEGIE` **ne crée pas** de créance et n'annule aucune dette.
  Il ne change que l'éligibilité à la commande crédit.
- Un client en `EN_EVALUATION` qui a déjà du crédit non soldé le garde. Le statut
  ne force aucun remboursement.

### Plafond de crédit

- Le plafond porte **un montant et une devise**, comme toute écriture financière
  (S3). Il porte **toujours la devise dans laquelle le client contracte**, ce qui
  est la situation normale : un plafond en USD pour un client qui prend son crédit
  en dollars.
- **Un plafond en USD se compare au montant en USD que le client doit**, c'est-à-dire
  la somme de ses créances en USD, **sans conversion**. Un plafond en CDF se
  compare de même à ses créances en CDF. Comparer deux montants de même devise
  évite de dépendre d'un taux qui bouge. Voir ADR-0001 et la note en fin de spec.
- **Le plafond n'est donc pas une dette, et ne se comporte pas comme elle.** C'est
  une **décision du distributeur**, pas un fait comptable. Un fait se valorise au
  taux du jour ; une décision ne se valorise pas. Le plafond et la créance ont
  chacun leur règle, et les confondre fait dépendre une limite commerciale d'un
  taux que personne n'a choisi.
- **Plafond restant = plafond − créances de la même devise**, et **seulement**
  celles-là. Un client dont les créances sont en USD a un plafond restant calculé
  sur ses créances en USD ; ses créances en CDF n'entrent pas dans ce calcul.
- Le plafond restant est **dérivé, jamais stocké**.
- **Conséquence à écrire dans les écrans** : un plafond en USD affiche son disponible
  en USD, avec l'équivalent en francs **à titre indicatif**, et la date du taux à
  côté. Le chiffre qui autorise la commande est le chiffre en USD.
- **Modifier un plafond ne touche jamais à la dette existante.** Augmenter le
  plafond n'annule rien ; le diminuer peut rendre le plafond restant négatif,
  situation qui doit être **affichée telle quelle** et non écrêtée à zéro. On
  distingue donc deux valeurs : *plafond restant* (qui peut être négatif) et
  *disponible pour commander* (qui ne l'est jamais). La commande crédit est
  refusée dans les deux cas.
- Une valeur **par défaut** vit dans la configuration, modifiable par
  l'administrateur principal. Elle s'applique aux clients créés après le
  changement, et **ne modifie pas** les clients existants.

### Contraintes offline

- Fiche, statut et plafond sont **réplicables**. Identifiant généré sur
  l'appareil, horodatage local conservé.
- Le plafond restant est calculable **localement**, à partir des créances
  embarquées et du taux embarqué. Un agent hors-ligne voit le même chiffre qu'en
  ligne.
- Une **promotion hors-ligne** prend effet localement immédiatement et se
  propage. Deux promotions concurrentes de statuts différents sur le même client
  produisent un **conflit** de synchronisation, traité selon ADR-0005.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.**

**Les tests qui comptent :**

- **Deux homonymes sont deux clients.** C'est le test central de cette spec. Deux
  fiches de même nom, téléphones différents, dettes différentes : le total du
  portefeuille est la somme des deux, et la recherche par nom les renvoie
  toutes les deux. Sans ce test, on a réintroduit le bug du prototype.
- **Le compte est unique, le dossier ne l'est pas.** Un numéro déjà pris comme
  identifiant de compte est refusé (S1). Un numéro déjà porté par un dossier est
  accepté : on en ajoute un second. Le test couvre les deux directions, parce que
  la première protège et que la seconde autorise.
- **Le dossier se désigne par son nom.** Une recherche par numéro propose plusieurs
  dossiers, et l ninguno n'est retenu automatiquement. Le test vérifie qu'aucun
  dossier n'est désigné sans que son nom ait été confirmé — c'est le raccourci qui
  ferait afficher la dette d'un client à un autre.
- **Le plafond restant se déduit, jamais saisi.** Le test est indirect : créer
  une créance fait baisser le plafond restant sans qu'aucune écriture ne touche
  au plafond.
- **Diminuer un plafond ne crée pas de créance.** Baisser le plafond sous la
  dette existante laisse la dette intacte, donne un plafond restant négatif
  affiché, et un disponible pour commander nul.
- **Un plafond en USD se compare en USD, jamais converti.** Un client avec un
  plafond de 200 USD et 180 USD de créances en USD dispose de 20 USD. Un client
  avec un plafond de 460 000 CDF et 414 000 CDF de créances dispose de 46 000 CDF.
- **Le changement de taux ne déplace aucun des deux disponibles.** C'est le test qui
  verrouille la règle, et il échoue si quelqu'un compare deux devises par
  conversion. Testé **dans les deux sens** : on fait varier le taux et on vérifie
  que les deux disponibles sont inchangés. Sans le deuxième sens, un test qui
  compare deux devises par conversion peut passer par hasard, si le taux n'a pas
  bougé entre les deux mesures.
- **Le plafond ne s'écrase pas en négatif côté commande.** Une commande crédit
  qui dépasse le disponible est refusée, et le refus est journalisé — invariant 4
  du glossaire.
- **La promotion est immédiate et sans effet de bord.** Passer un client en
  `PRIVILEGIE` ne crée aucune écriture financière et ne modifie aucune dette. Le
  test le vérifie en comparant le total du portefeuille avant et après.
- **La valeur par défaut ne s'applique pas rétroactivement.** Changer la valeur
  par défaut ne touche pas un client existant, et s'applique au suivant créé.
- **Hors-ligne, le plafond restant est identique.** Le même client, le même taux
  embarqué, le même chiffre sans réseau. C'est ce qui garantit qu'un agent
  n'annonce pas une limite fausse à un client.

## Out of Scope

- **Seuils automatiques de promotion.** Décision explicite de ne pas les faire.
  Le client n'en veut pas.
- Expiration automatique du statut `PRIVILEGIE` après une période donnée.
- Notation, scoring de risque, probabilité de défaut.
- Contrats, documents signés, gestion de garanties ou de nantissements.
- Multi-distributeur : un seul, sans cloisonnement supplémentaire.
- Adresses structurées avec ville, province, code postal décomposé. Le champ est
  une texte libre pour l'instant.
- Import en lot de clients depuis un fichier : c'est S10.

## Further Notes

**Le montant du plafond n'est pas tranché.** L'interview a convergé vers « 200 ou
300, à valider », avec des clients privilégiés qui iraient jusqu'à 500. La valeur
par défaut est donc **paramétrable**, et c'est ce qui rend le point non bloquant :
on livre avec une valeur par défaut raisonnable et on la change en configuration
quand le client tranche. Ne pas coder en dur.

**Attention à la confusion plafond / dette.** Le prototype Excel n'avait pas de
plafond du tout, et sa « Synthèse Dettes » calculait un reste global par client.
La tentation sera d'utiliser le reste à payer comme plafond. Ce n'est pas la même
chose : le plafond est une **décision du distributeur**, le reste à payer est un
**fait**. Ne pas les confondre dans le modèle.

**Le plafond restant peut être négatif, et c'est voulu.** Quand le distributeur
diminue un plafond en dessous de la dette déjà contractée, la situation réelle est
que le client doit plus que la limite. Écrêter à zéro ferait croire que le client
est dans les clous. Les deux chiffres sont donc affichés séparément — voir les
décisions ci-dessus. Ce n'est pas une coquetterie d'interface, c'est la seule
représentation honnête.

**Le plafond n'est pas une dette, et c'est la distinction que le modèle doit tenir.**
Une version précédente de cette spec disait l'inverse — que le plafond se comporte
comme une dette et que l'espace disponible varie avec le taux. Elle se contredisait
elle-même, et les deux affirmations ne pouvaient pas être vraies en même temps.

Le raisonnement qui tranche : **une créance est un fait, un plafond est une
décision**. Un fait se valorise au taux du jour, c'est ADR-0001. Une décision ne se
valorise pas : le chef a choisi 200 USD le mardi, et le fait que le dollar vaut
2 400 le mercredi ne transforme pas sa décision en 240 000. Si le disponible bouge
avec le taux, un client peut se voir refuser une commande alors qu'on ne la lui avait
jamais refusée auparavant, sans que personne n'ait pris aucune décision. C'est une
mauvaise surprise, et elle n'est explicable à personne.

La conséquence est un test qui doit exister : **le changement de taux ne déplace
aucun plafond restant**. Pas « le disponible n'a pas bougé ce jour-ci », mais « aucun
taux ne le fait bouger ». Ce test est écrit dans les deux sens, en CDF et en USD.
