# 10 — Écran agent : la file des demandes d'accès

Status: ready-for-agent

Blocked by: 02 (table `demandes_acces_profil` et décisions), 07, 09

## Le trou que ce ticket comble

Aujourd'hui, une correspondance possible ouvre une demande et **personne ne la
voit**. Le demandeur lit « Un profil semble déjà connu du distributeur », et il
ne se passe rien. C'est le premier maillon manquant de la chaîne : les règles
de décision existent, testées, mais leur sortie n'a pas d'écran.

C'est aussi le dernier obstacle avant que la chaîne S4 soit utilisable de bout
en bout : inscription → détection → confirmation → accès au profil.

## Ce que la page doit permettre

1. **Voir la file** des demandes en attente, triées par **ancienneté**. Comme
   la file de validation des comptes : le plus ancien d'abord, sinon personne
   ne sait qui attend.
2. **Décider** : confirmer ou refuser, avec motif obligatoire au refus.
3. **Revoquer** un accès déjà accordé, quand c'est une erreur de saisie.

## Ce qu'elle ne doit surtout pas faire

- **Montrer le solde, les créances ou l'historique du profil visé.** Le profil
  existe déjà chez quelqu'un : afficher son solde à un agent qui n'a pas encore
  tranché n'est pas nécessaire, et élargit la surface d'erreur. L'agent voit
  le **nom** de la boutique — c'est ce qu'il doit confronter à la personne
  devant lui — et rien de plus.
- **Sélectionner un profil automatiquement** sur le seul nom ou le seul
  téléphone. La demande porte un `profil_client_id` précis ; l'agent tranche
  sur cette demande, il ne cherche pas.
- **Confirmer sans la permission** `client.acces_confirmer`. La garde de page
  et l'action serveur la vérifient toutes les deux — une page protégée sans
  contrôle serveur n'est pas une protection.

## Ce qui existe déjà, et qu'il ne faut pas réécrire

| Brique | Où |
| --- | --- |
| Liste des demandes en attente | `listerDemandesAccesEnAttente()` |
| Confirmer | `confirmerAccesProfil()` |
| Refuser avec motif | `refuserDemandeAcces()` |
| Révoquer avec motif | `revoquerAccesProfil()` |
| Actions serveur, permission vérifiée | `src/app/agent/clients/acces/actions.ts` |

La couche métier est **complète et testée**. Ce ticket est de l'interface. Il
ne doit modifier aucune règle, seulement les exposer.

## Emplacement

`/agent/clients/acces`, à côté de `/agent/clients/validation` qui suit la même
forme : garde par permission, file triée, actions par ligne.

Le lien entre dans la navigation agent, dans le groupe « Clients ».

## Plan d'exécution

1. **Page serveur + garde** — permission `client.acces_confirmer` requise, sinon
   `PermissionRefusee` comme partout ailleurs.
2. **Liste** — nom du profil, nom du demandeur (le compte client), ancienneté,
   indice de détection. Ligne = une demande, deux boutons.
3. **Refuser** — motif obligatoire (3 à 500), sinon le bouton refuse.
4. **Confirmer** — un clic, accès accordé, ligne retirée de la file.
5. **Revocation** — section séparée, sur les accès actifs du profil, parce que
   ce n'est pas la même décision : on corrige, on valide pas.
6. **Test navigateur mince** — un parcours complet : ouvrir, refuser, confirmer.
7. **Test d'écran vide** — « aucune demande en attente » plutôt qu'une page
   blanche.

## Points à trancher avant de coder

1. **Qui voit la file ?** Un agent avec `client.acces_confirmer` voit tout le
   monde, ou seulement les demandes de sa région ? Today : tout le monde.
2. **Le demandeur est-il nommé dans la file ?** Nom du compte + téléphone
   facilitates la confrontation au comptoir. C'est une donnée personnelle : à
   confirmer.
3. **Nouvel onglet ou nouvelle page ?** Onglet sous `/agent/clients`, ou page
   à part dans la navigation ?
4. **Après une décision**, retour liste avec un message, ou redirection ?

## Test de protocole, une fois l'écran fait

- Créer une inscription en doublon d'un nom existant, valider le compte :
  la demande doit apparaître dans la file.
- Refuser sans motif → refus, message visible.
- Refuser avec motif → la demande disparaît, le demandeur ne lit rien mais son
  accès reste fermé.
- Confirmer → le demandeur accède enfin à son profil.
- Révoquer un accès accordé → il disparaît, le demandeur perd l'accès.
- Un agent **sans** la permission tombe sur l'écran de refus, pas sur la file.