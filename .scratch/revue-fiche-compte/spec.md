# Revue de la fiche compte — fiche d'identité + sécurité

Décisions prises avec le propriétaire lors de la revue de `/admin/profile`
(issue GitHub #53). Ce dossier est la trace normative de la revue : les
tickets d'implémentation s'y rattachent.

## La fiche, redéfinition

La fiche « Mon compte » devient une **fiche d'identité + sécurité**. Elle
n'est ni un tableau de bord personnel, ni une fiche purement informative :
elle documente le compte et concentre les actions de sécurité.

## Les dix décisions

| # | Décision |
| --- | --- |
| 1 | La fiche est une fiche d'identité + sécurité. |
| 2 | Le personnel peut changer son mot de passe depuis sa fiche. La réinitialisation d'un mot de passe *oublié* reste hors périmètre, non bouclable. |
| 3 | L'administrateur technique ne modifie pas ses propres coordonnées ; le serveur refuse aussi, et la raison affichée désigne le rôle. |
| 4 | Chaque bloc porte une pastille textuelle (« Lecture seule » / « Modifiable ») ; le crayon n'annonce plus une lecture seule. |
| 5 | La bannière porte l'identité complète ; chaque donnée n'existe qu'à un seul endroit. |
| 6 | Les sessions sont identifiées par un libellé lisible, pas par un user-agent brut. |
| 7 | La carte « Administration » disparaît : le rôle est en bannière, le second facteur est dans « Sécurité ». |
| 8 | Le socle partagé est refactoré ; la validation porte sur la fiche admin, l'agent et le client sont ajustés. |
| 9 | La fiche porte un bloc « Activité récente » (5 dernières actions métier du compte). |
| 10 | La livraison passe par l'issue GitHub #53 et des tickets ici. |

## Les invariants

- **Chaque donnée à une seule place.** Un doublon est un défaut, pas une
  redondance utile : l'écran doit dire ce qu'il sait déjà une fois.
- **Une pastille, pas une icône devinée.** L'utilisateur doit lire l'état
  d'un bloc sans connaître le code de couleur de l'app.
- **L'écran et le serveur disent la même chose.** Un verrou affiché mais
  absent côté serveur est un mensonge ; un verrou serveur non affiché
  aussi.
- **Le vocabulaire du `GLOSSARY.md` fait autorité** : « client » ne veut
  jamais dire « shop », « profil client » ne veut jamais dire « dossier
  client », « virtujet » ne veut jamais dire « e-money ».

## Contradiction signalée

La spec S1 liste « Photo de profil, changement d'email, changement de numéro
par l'utilisateur » en *Out of Scope*
(`.scratch/s1-authentication/spec.md:361`), alors que la fiche implémente
déjà la photo et le changement de numéro. La revue ne touche pas au
changement de numéro et n'aggrave pas l'écart ; l'incohérence de la spec
est signalée dans l'issue #53.

## Tickets

| Ticket | Sujet |
| --- | --- |
| `issues/01-socle-fiche-identite-securite.md` | Socle partagé : bannière identité, déduplication, pastilles, sessions lisibles, suppression de la carte « Administration » |
| `issues/02-changer-son-mot-de-passe.md` | Changer son mot de passe (comptes staff) |
| `issues/03-verru-administrateur-technique.md` | L'administrateur technique ne modifie pas sa fiche |
| `issues/04-activite-recente.md` | Bloc « Activité récente » |
