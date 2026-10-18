# 09 — Inscription et création du shop

Status: ready-for-agent

Blocked by: 02, 07

## Ce que cette tranche livre

Le profil du shop est créé **dans le parcours d'inscription normal**, sans
tâche de rattachement séparée, et une correspondance possible avec un profil
existant ouvre une vérification humaine au lieu de créer un doublon.

## Les trois décisions, et pourquoi elles sont distinctes

Le parcours tient une seule question à la fois : *qui se connecte*, *qui
est-il*, *quelle boutique*. Les confondre est exactement ce qui montre une
dette à la mauvaise personne.

| Moment | Ce qui existe | Ce qui n'existe pas encore |
| --- | --- | --- |
| Inscription | le compte, en `EN_ATTENTE_VALIDATION` | aucun accès, aucune donnée financière |
| Validation | la personne est vérifiée sur pièce d'identité | l'accès au profil, qui dépend de la provenance |
| Après validation | accès automatique **ou** demande à un agent | — |

## Comment la provenance décide

C'est le cœur de la tranche. Un profil porte son `origine` :

| Origine | Effet à la validation |
| --- | --- |
| `INSCRIPTION` | accès accordé dans le même parcours, sans intermédiaire |
| `DISTRIBUTEUR`, `AGENT`, `IMPORT` | **jamais** d'accès automatique : une décision humaine |

Un profil créé par l'inscription de ce compte est la seule chose qui s'accorde
sans intermédiaire. Un profil *retrouvé* — parce que la boutique existait déjà
— ne s'accorde jamais ainsi, même si le demandeur a la bonne pièce
d'identité : sa pièce prouve qui il est, pas qu'il gère cette boutique.

C'est exactement la distinction de la spec : **validation de la personne** et
**autorisation sur une boutique existante** sont deux décisions.

## La détection de doublons

Un profil devient candidat si son **contact** ou son **nom normalisé** est
identique. Le nom est normalisé (casse, accents, ponctuation) dans une colonne
dédiée et indexée, pour que «Boutique  BETA» et «BOUTIQUE-BETA» se
rencontrent sans balayer la table.

**La détection ne renvoie que des identifiants.** Aucun nom, aucun solde,
aucune créance ne sort du contrôle : elle ne connaît que des clés. C'est la
garantie qu'un demandeur ne peut rien apprendre d'un profil existant avant la
confirmation — y compris par un appel direct à la fonction.

Un profil candidat n'est **pas** créé en double : le compte retient
`profil_candidat_id`, et rien d'autre ne se passe tant qu'un agent n'a pas
tranché.

**Le critère est volontairement conservateur.** Mieux vaut une vérification
humaine de trop qu'un doublon de profil, qui déplacerait un historique
financier vers la mauvaise boutique.

## Le plafond par défaut

Un profil né d'une inscription démarre à **200 USD**, `EN_EVALUATION`, donc
sans droit de commande crédit. Ce n'est pas un magic number caché : il est
nommé `PLAFOND_PAR_DEFAUT` dans l'action d'inscription. Il mérite d'être
déplacé vers `reglages` quand le distributeur voudra le changer sans
redéployer.

## Ce que le test prouve

Contre la vraie base :

1. un profil créé par l'inscription donne un accès automatique à la validation,
   et **rien avant** ;
2. un profil correspondant déjà ne crée **aucun** doublon, n'accorde rien, et
   ouvre une demande à un agent ;
3. la détection trouve par contact et par nom normalisé ;
4. la détection ne renvoie que des chaînes d'identifiants ;
5. un compte encore non validé n'accède à rien.

## Migrations

| Migration | Opération |
| --- | --- |
| 0024 | `profils_clients.origine`, `comptes_clients.profil_candidat_id` |
| 0025 | `profils_clients.nom_normalise` + index |

Toutes deux additives.

Toutes deux additives. `nom_normalise` est remplie par le script de backfill
existant, qui est donc devenu **deux opérations** : normaliser les noms, puis
rattacher les étiquettes. Le script reste idempotent.

## Écarts assumés

- **Le plafond par défaut est dans le code.** Volontaire pour cette tranche,
  à déplacer quand `reglages` existera pour de bon.
- **Une seule boutique par personne** : le modèle ne permet qu'un accès actif
  par compte. Un candidat multiple est tranché comme le premier ; les autres
  sont ignorés. C'est à revoir si la multi-boutique est décidée.
- **L'écran de la file de demandes** n'existe pas encore : la demande est
  créée, personne ne la voit encore.

## Décisions restant à trancher

1. **Faut-il alerter le demandeur ?** L'écran dit aujourd'hui « votre compte
   attend une vérification ». Aucun mot ne parle du profil pour ne pas squash
   un profil existant dans une promesse floue. Le dire est une décision UX.
2. **Plafond par défaut** : montant, devise, et qui le change.
3. **Délai de la demande** : une demande ouverte depuis six mois est-elle
   encore valable ? Aucune expiration n'existe aujourd'hui.
4. **Plusieurs candidats** : quand deux profils correspondent au nom, lequel
   l'agent voit-il en premier ? L'ordre est aujourd'hui celui de la base.
5. **Critère de détection** : faut-il ajouter l'adresse, ou un numéro de
   registre du commerce ?