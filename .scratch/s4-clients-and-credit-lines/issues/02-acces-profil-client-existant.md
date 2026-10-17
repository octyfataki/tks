# 02 — Confirmation d'accès à un profil existant

Status: ready-for-agent

Blocked by: 07 (table `acces_profil_clients`, migration 0020)

**Remplace** la version précédente de ce ticket. Le rattachement manuel
n'existe plus : ce qui est livré ici est une **décision humaine** sur une
correspondance possible, jamais une tâche à faire pour chaque client.

## Ce que la tranche livre

1. L'état de **demande de vérification** (`demandes_acces_profil`, migration
   0021) : une correspondance possible ouvre une demande, et n'accorde rien.
2. La décision : un agent habilité **confirme** ou **refuse**, avec motif.
3. La **révocation** d'un accès précédemment accordé.
4. Les **actions serveur** qui vérifient la permission à chaque appel.
5. Le renommage des permissions `dossier.rattacher` / `dossier.detacher` en
   `client.acces_confirmer` / `client.acces_revoquer` / `client.acces_corriger`,
   conformément au découpage.

Elle ne livre pas encore l'écran agent de la file de demandes : la couche
applicative et les actions serveur sont là, l'interface vient ensuite.

## Les règles qui tiennent

- **Avant confirmation, le demandeur ne voit rien.** Ni solde, ni créance, ni
  commande, ni historique. Le seul chemin de lecture est
  `profilAutorisePourCompte`, qui renvoie `null` sans accès actif. C'est cette
  fonction que S5 et S6 devront consommer, **jamais** une lecture de profil
  guidée par un numéro de téléphone.
- **Un compte doit être `VALIDE`** pour détenir un accès. La validation prouve
  qui se connecte ; elle ne remplace pas la décision d'accès au profil.
  L'invariant 7 est appliqué dans la couche, pas seulement dans l'écran.
- **Le téléphone et la pièce d'identité ne prouvent rien sur l'autorité.** Il
  n'existe aucun appel qui accorde un accès depuis une correspondance de
  numéro. L'indice qui a déclenché la détection est **conservé pour l'agent**
  (`indice_detection`), et ne débloque rien : seul un `profil_client_id` visé
  par un humain lisible peut être confirmé.
- **Journal indisponible = rien n'est écrit.** Confirmation, refus et révocation
  passent tous par une transaction unique qui contient l'écriture métier *et*
  l'événement d'audit. Si le journal tombe, l'opération entière est annulée.
- **Révoker ne déplace rien.** Un accès porte `statut`, pas une suppression.
  Aucune écriture financière n'existe encore dans ce modèle (S5, S6 à venir) et
  aucune n'est référencée par cette table : une révocation ne peut donc pas en
  déplacer une.
- **Motif obligatoire** (3 à 500 caractères) pour refuser comme pour révoquer.
  Une décision sans motif lisible est unexpliquable six mois plus tard.

## Permissions

| Permission | Effet |
| --- | --- |
| `client.acces_confirmer` | confirmer ou refuser une demande |
| `client.acces_revoquer` | révoquer un accès accordé |
| `client.acces_corriger` | corriger un accès erroné (conserve l'historique) |

Les trois sont **absentes du profil agent par défaut** : un test le vérifie.
Confirmer qu'une personne gère une boutique est un pouvoir de risque, il se
donne une par une, jamais par défaut. `dossier.creer` reste le seul pouvoir
client du profil par défaut.

L'administrateur technique ne les détient pas non plus : il n'a aucun pouvoir
métier.

## Migration

`0021_round_edwin_jarvis.sql` : un `CREATE TABLE` `demandes_acces_profil`, sans
`ALTER`, sans `UPDATE`, sans `DROP`. Rollback : `DROP TABLE demandes_acces_profil`.
Aucune donnée financière n'est concernée — il n'en existe pas encore.

## Ce que le test protège

Sept cas contre la vraie base, choisis parce qu'ils protègent quelque chose :

1. un compte non validé ne peut même pas ouvrir de demande, ni rien lire ;
2. un agent **sans** permission ne peut pas confirmer, et le compte reste sans
   accès ;
3. une demande ouverte n'accorde rien — `profilAutorisePourCompte` vaut `null` ;
4. après confirmation, l'accès existe et l'événement est journalisé ;
5. un refus exige un motif ;
6. une révocation coupe l'accès et laisse la demande tracée ;
7. révoquer exige `client.acces_revoquer`, pas seulement confirmer.

## Décisions restant à trancher

1. **Critères de « correspondance possible »** : quels champs, et quel seuil,
   ouvrent une demande. Le ticket ne les invente pas — ils viennent de S10 pour
   l'import, et du métier pour l'inscription.
2. **Preuves d'autorité** demandées à l'agent : pièce d'identité du gérant,
   registre de commerce, ou les deux selon la taille de la boutique.
3. **Comportement hors-ligne** : la demande peut être écrite hors-ligne, mais
   la confirmation exige une vérification sûre. Ce qui est écrit ici.
4. **Plusieurs personnes sur une boutique** : verrou, la colonne `profil_actif` ne
   l'autorise pas. Voir le ticket 07.
5. **Changement de propriétaire** : révocation puis nouvel accord sur le même
   profil — la mécanique existe, la procédure reste à écrire.
6. **Matrice exacte des rôles** : l'agent de service peut-il confirmer au
   comptoir ? Recommandé oui, avec `client.acces_confirmer`, jamais par défaut.

## Écarts assumés

- **Aucune clé étrangère**, comme partout ailleurs dans le projet.
- **Aucun écran agent** dans cette tranche : la liste des demandes
  (`listerDemandesAccesEnAttente`) est prête, l'interface vient avec le ticket
  d'interface.
- **`agentConnecte` existe en trois copies** dans les pages agent. Cette
  tranche extrait `staffConnecte()` depuis `profil-session.ts` et l'utilise ;
  remplacer les trois appelants est un nettoyage sans risque, laissé de côté
  pour ne pas mélanger deux sujets dans la même PR.