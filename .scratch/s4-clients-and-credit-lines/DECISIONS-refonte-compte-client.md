# Journal de décisions — refonte compte/client

## Décisions confirmées par la demande

- L'entité métier « client » représente la boutique elle-même, gérée par son propriétaire.
- Le rattachement manuel compte–dossier ne doit plus être une étape systématique.
- Lorsqu'un profil existant semble correspondre à une inscription, un agent doit confirmer
  l'accès avant toute révélation de données financières.
- La validation d'identité, la confidentialité, l'historique financier, les règles de crédit
  et l'audit doivent être préservés.

## Contradictions détectées dans les sources actuelles

1. **Compte validé vs accès au profil.** Le glossaire actuel dit qu'un compte validé peut
   être utilisé, mais le ticket de rattachement exige une association distincte. La nouvelle
   règle doit explicitement distinguer authentification, validation d'identité et autorisation
   d'accès à un profil existant.
2. **Pièce d'identité personnelle vs client-boutique.** La pièce vérifie une personne physique,
   alors que le client est la boutique. Il faut donc vérifier séparément le droit de gérer
   la boutique préexistante.
3. **Téléphone unique vs téléphone partagé.** Le téléphone est unique comme identifiant de
   compte mais le numéro de contact d'une boutique est non unique. Le modèle et les libellés
   doivent éviter de confondre ces deux champs.
4. **Un compte / un profil vs plusieurs boutiques ou gestionnaires.** Les sources imposent
   implicitement une relation 1:1. Cela devient une limitation métier significative si une
   personne possède plusieurs boutiques ou si plusieurs employés doivent accéder à une même
   boutique.
5. **Hors-ligne vs confirmation d'accès.** Une confirmation d'accès à un profil préexistant
   exige une vérification sûre ; il n'est pas défini si cette décision peut être prise hors-ligne.
6. **Récupération du compte.** Les sources utilisent la pièce d'identité pour récupération de
   mot de passe, mais la pièce seule ne devrait pas suffire à reprendre un compte ou à
   accéder à un profil financier.
7. **Profil existant vs nouvelle inscription.** Les critères qui signalent un possible doublon
   ne sont pas définis. Un faux positif ne doit pas bloquer indéfiniment un nouveau client ;
   un faux négatif ne doit pas créer un doublon ni divulguer des finances.

## Décisions restant à trancher

- Une personne peut-elle gérer plusieurs boutiques ?
- Une boutique peut-elle avoir plusieurs comptes autorisés ?
- Qui peut confirmer, révoquer ou corriger un accès : agent de service, administrateur principal,
  ou les deux selon permissions ?
- Quelles preuves attestent l'autorité sur une boutique existante ?
- Quels champs déclenchent une revue de doublon, et comment l'agent tranche-t-il ?
- La création automatique du profil pour une nouvelle boutique est-elle permise hors-ligne ?
- Quelle procédure suit-on en cas de changement de propriétaire de la boutique ?
- Comment migrer les dossiers existants sans modifier les créances, paiements, plafonds ou
  historiques ?
- Le statut de crédit et le plafond appartiennent-ils toujours à la boutique même si le
  propriétaire change ? Proposition : oui, sauf décision métier contraire, car l'historique
  financier est celui de la boutique.

## Proposition de principe

Le profil client (boutique) est l'identité métier stable. Le compte est un moyen d'accès.
Les opérations financières appartiennent au profil client. La création d'un profil et
l'autorisation d'accès sont deux opérations différentes, mais le rattachement manuel n'est
pas requis pour chaque inscription : il n'intervient que dans le cas exceptionnel où un
profil existant doit être retrouvé et confirmé.
