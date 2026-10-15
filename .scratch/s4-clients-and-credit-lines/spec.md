Status: ready-for-agent

# S4 — Clients et lignes de crédit

## Statut de cette révision

Cette révision remplace le modèle de « dossier client » manipulé séparément du compte.
Le client métier est **la boutique elle-même**, gérée par son propriétaire. Le compte
est un moyen d'accès ; il ne porte pas les données financières. Le parcours normal
ne comporte plus de rattachement manuel systématique.

## Problem Statement

Le prototype Excel représentait le client par un texte, ce qui fusionnait les homonymes,
ne bornait pas le crédit et ne permettait pas de gérer l'identité et l'entrée d'un client.

La première conception a répondu à ces problèmes en séparant le compte et le dossier,
puis en exigeant leur rattachement manuel. Cette séparation impose une opération
supplémentaire à chaque inscription sans correspondre au parcours attendu du propriétaire
d'une petite boutique : se connecter et gérer directement les opérations de sa boutique.

Le nouveau modèle doit conserver une identité métier stable et un historique financier
unique, tout en distinguant l'authentification de l'autorisation d'accéder à un profil
client existant.

## Solution

Un **profil client** représente une boutique réelle et porte les données métier et
financières. Un **compte** authentifie la personne qui gère cette boutique.

- Le profil client possède un identifiant interne stable, un nom, une adresse, des
  coordonnées de contact, un statut de crédit et un plafond.
- Le compte client utilise un numéro de téléphone normalisé comme identifiant de
  connexion unique dans l'espace des comptes. Ce numéro n'est pas la clé métier du client.
- Le profil client porte un numéro de contact indexé mais non unique : plusieurs boutiques
  peuvent partager un numéro de contact.
- Lorsqu'une inscription correspond clairement à une nouvelle boutique, le système crée
  le profil client et son accès dans le même parcours contrôlé, sans étape manuelle de
  rattachement.
- Lorsqu'une inscription semble correspondre à une boutique déjà enregistrée, l'accès
  au profil existant est bloqué jusqu'à confirmation par un agent autorisé. La recherche
  par téléphone ne suffit jamais à prouver l'identité.
- La validation de la personne et la confirmation de son droit à gérer une boutique
  existante sont deux décisions distinctes.
- Les commandes, créances, paiements et autres opérations sont liées au profil client
  stable, jamais directement au numéro de téléphone.
- Le changement de téléphone ne crée pas un nouveau profil et ne déplace aucune dette.
- Le statut et le plafond de crédit restent des attributs du profil client.

## User Stories — Identité et accès

1. En tant que propriétaire d'une boutique, je veux créer un compte et accéder au profil
   de ma boutique sans devoir effectuer un rattachement manuel supplémentaire.
2. En tant que distributeur, je veux que deux boutiques homonymes restent deux profils
   distincts, afin que leurs opérations financières ne soient jamais fusionnées.
3. En tant qu'agent, je veux rechercher des profils par plusieurs champs et voir des
   résultats non ambigus, sans sélection automatique sur la base du seul téléphone.
4. En tant qu'agent, je veux confirmer qu'un compte validé est autorisé à accéder à un
   profil client existant avant de révéler son historique ou son solde.
5. En tant que propriétaire, je veux que mon historique complet reste associé à ma
   boutique lorsque mon numéro de téléphone change.
6. En tant que distributeur, je veux connaître la date de création du profil et son
   auteur, afin de tracer l'origine de l'enregistrement.
7. En tant que client, je veux soumettre ma pièce d'identité une seule fois pour la
   vérification initiale, selon le parcours S1.
8. En tant que distributeur, je veux corriger une association d'accès erronée sans
   modifier les commandes, créances ou paiements.
9. En tant que propriétaire, je veux voir uniquement les données du profil client auquel
   mon compte est autorisé à accéder.

## User Stories — Statut et plafond de crédit

Les règles de statut, plafond, suivi et devise de la version S4 précédente sont conservées :

- Nouveau profil : `EN_EVALUATION`.
- Seul `PRIVILEGIE` peut passer des commandes crédit.
- La promotion et la rétrogradation sont des décisions humaines de l'administrateur principal.
- Le plafond est un montant et une devise ; sa valeur par défaut s'applique aux nouveaux
  profils et ne modifie pas les profils existants.
- Le disponible est calculé à partir des créances dans la même devise ; il n'est jamais
  saisi manuellement.
- Toute commande qui dépasse le disponible est refusée et auditée.
- Le profil client conserve l'historique des commandes, créances et paiements.

## Décisions d'implémentation

### Profil client

- Le profil possède un identifiant interne stable, généré localement de façon compatible
  avec le fonctionnement hors-ligne, et un horodatage de création.
- Le nom est libre et non unique. Il n'est pas une clé primaire et ne suffit pas à
  distinguer deux boutiques.
- Le numéro de contact est normalisé, indexé et non unique.
- Le profil ne stocke pas de copie redondante de la pièce d'identité. Il référence la
  preuve de vérification conservée par le système de comptes, conformément à S1.
- Le profil client est l'agrégat auquel sont rattachées les opérations métier et financières.
  Il ne doit pas être recréé à chaque changement de compte ou de téléphone.

### Compte et autorisation d'accès

- Le téléphone est unique comme identifiant de compte, mais pas comme contact de profil.
- Un compte client doit être `VALIDE` avant tout accès métier.
- Pour une nouvelle boutique, le profil peut être créé dans le même parcours après les
  contrôles nécessaires.
- Si une correspondance plausible avec un profil existant est détectée, le système ne
  crée pas automatiquement un second profil et ne donne pas accès au profil existant.
  Il place le cas en attente de confirmation par un agent autorisé.
- L'agent doit vérifier la personne et son autorité à gérer la boutique. Le nom, le
  téléphone et le solde sont des indices de recherche, pas des preuves suffisantes.
- Une confirmation d'accès est atomique : vérifier que le compte n'a pas déjà accès à un
  autre profil et que le profil n'a pas déjà un compte principal actif.
- Les permissions de confirmation et de correction sont explicites et auditées.
- La correction d'une autorisation d'accès révoque l'accès incorrect ; elle ne supprime
  ni ne déplace les écritures financières.
- Un compte `EN_ATTENTE_VALIDATION`, `REFUSE` ou `REVOQUE` n'accède à aucun profil client.
  Un compte `VALIDE` mais sans autorisation de profil ne voit ni solde, ni commandes,
  ni créances, ni paiements.

### Statut et plafond

- Statut : `EN_EVALUATION` ou `PRIVILEGIE`, `EN_EVALUATION` par défaut.
- Aucun seuil automatique de promotion.
- La promotion ne crée aucune créance et n'annule aucune dette.
- Le plafond porte un montant et une devise. Un plafond USD se compare aux créances USD ;
  un plafond CDF se compare aux créances CDF, sans conversion.
- Le plafond restant est dérivé, jamais stocké. Le disponible pour commander ne peut pas
  être négatif ; si le plafond est abaissé sous la dette existante, la situation est
  signalée explicitement et aucune nouvelle commande crédit n'est autorisée.
- Changer le plafond ne modifie jamais les dettes existantes.
- La valeur par défaut est configurable et ne s'applique qu'aux nouveaux profils.

### Contraintes hors-ligne

- Les profils, statuts et plafonds ont des identifiants stables et des horodatages locaux.
- Toute création hors-ligne est marquée en attente de synchronisation.
- Une confirmation d'accès à un profil existant exige une vérification côté serveur ou
  une politique hors-ligne explicitement définie ; l'accès ne doit pas être accordé
  localement sur la seule base d'une correspondance de téléphone.
- Les conflits concurrents d'accès sont résolus explicitement et audités, jamais en
  donnant silencieusement accès à deux comptes.

## Tests d'acceptation prioritaires

1. Deux boutiques homonymes restent deux profils et leurs finances restent séparées.
2. Un téléphone de contact peut apparaître sur plusieurs profils ; un identifiant de
   compte ne peut pas être dupliqué.
3. Une nouvelle boutique ne nécessite pas d'étape de rattachement manuel distincte.
4. Une inscription qui correspond possiblement à un profil existant ne donne pas accès
   automatiquement et n'expose aucune donnée financière avant confirmation de l'agent.
5. Un compte non validé ne peut ni commander ni consulter les données financières.
6. Un compte validé sans autorisation de profil ne voit aucun solde, aucune commande,
   aucune créance ni aucun paiement.
7. Une confirmation d'accès vérifie les contraintes un-à-un et est auditée.
8. Une correction d'accès ne crée, ne supprime et ne déplace aucune écriture financière.
9. Un changement de téléphone conserve le même identifiant de profil et tout l'historique.
10. Le statut et le plafond suivent les règles existantes de crédit.
11. Une commande crédit refusée n'engendre aucune écriture financière et le refus est audité.
12. Les règles d'accès restent sûres hors-ligne et lors de la synchronisation.

## Hors périmètre et décisions ouvertes

- Plusieurs comptes actifs pour une même boutique (non autorisé par défaut ; à décider si
  des employés du client doivent plus tard accéder au même profil).
- Plusieurs boutiques gérées par une même personne (modèle de propriété à décider).
- Procédure exacte de récupération après perte de téléphone.
- Critères précis qui classent une inscription comme nouvelle boutique ou comme candidate
  à un profil existant.
- Pièces ou preuves supplémentaires exigées pour démontrer qu'une personne gère une
  boutique existante.
- Comportement exact des créations et confirmations d'accès hors-ligne.
- Migration des profils historiques du modèle dossier vers le profil client.
