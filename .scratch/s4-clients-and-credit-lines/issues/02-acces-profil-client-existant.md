# 02 — Accès au profil client existant

Status: ready-for-agent

Blocked by: 01

**Objectif :** supprimer le rattachement manuel comme étape systématique. Le client
métier est la boutique ; son compte permet à son propriétaire d'accéder au profil
correspondant. Lorsqu'une boutique semble déjà exister, un agent autorisé confirme
l'accès avant que des données financières soient révélées.

**Remplace :** `02-rattachement-compte-dossier.md` dans sa version précédente.

**Dépendances :** S1 (inscription, pièce d'identité et validation du compte) ; S4
(profil client, statut, plafond et historique financier).

**Statut :** proposition de refonte — décisions ouvertes listées en fin de ticket.

## Règle de parcours

- **Nouvelle boutique confirmée :** création du compte et du profil client dans le même
  parcours contrôlé. Pas de tâche séparée de rattachement.
- **Correspondance possible avec un profil existant :** ne pas créer de doublon, ne pas
  révéler de solde ou d'historique et ne pas accorder l'accès automatiquement. Créer un
  cas « confirmation d'accès » pour un agent autorisé.
- **Compte validé :** la validation prouve que la personne a été vérifiée ; elle ne
  prouve pas à elle seule qu'elle est autorisée à gérer un profil client préexistant.
- **Compte non validé :** aucun accès métier, même si un profil semble correspondre.

## Critères d'acceptation

- [ ] Une nouvelle boutique peut être créée et rendue accessible sans étape manuelle
      distincte de rattachement.
- [ ] Les doublons plausibles déclenchent une confirmation par un agent autorisé.
- [ ] Avant confirmation, le demandeur ne voit ni nom complet du profil candidat si cela
      divulgue une donnée privée, ni adresse détaillée, solde, créances, paiements,
      commandes ou historique. L'écran agent peut montrer les informations nécessaires
      à la vérification selon ses permissions.
- [ ] La recherche peut utiliser nom, téléphone de contact et adresse, mais aucun champ
      seul, y compris le téléphone ou le nom, ne sélectionne automatiquement un profil.
- [ ] L'agent vérifie l'identité de la personne et son autorité à gérer la boutique.
      La pièce d'identité déjà contrôlée est réutilisée selon S1 ; elle n'est pas redemandée
      uniquement pour cette étape.
- [ ] La confirmation est atomique et vérifie que le compte n'a pas déjà accès à un autre
      profil et que le profil n'a pas déjà un compte principal actif.
- [ ] Toute confirmation, tentative refusée, révocation et correction est auditée avec
      l'acteur, l'horodatage, le compte, le profil visé, le résultat et le motif.
- [ ] La correction d'un accès erroné coupe l'accès au mauvais profil, mais ne supprime,
      ne modifie et ne déplace aucune commande, créance ou paiement.
- [ ] Le profil et l'historique financier ne changent pas quand le propriétaire change de
      téléphone ; la récupération suit une procédure sécurisée et auditée.
- [ ] Le client ne voit que le profil auquel son compte dispose d'une autorisation active.
- [ ] Un conflit de synchronisation ne peut pas accorder le même profil à deux comptes
      principaux actifs.
- [ ] Le parcours ne crée aucune écriture financière et ne modifie aucun solde.

## Cas de test

1. **Nouvelle boutique :** compte validé, aucune correspondance plausible ; création du
   profil et accès accordé conformément au parcours approuvé.
2. **Homonyme :** deux profils de même nom ; aucun choix automatique, finances séparées.
3. **Téléphone partagé :** plusieurs profils portent le même numéro de contact ; aucune
   sélection automatique.
4. **Profil existant :** le compte validé ne voit aucune donnée financière avant décision
   de l'agent.
5. **Confirmation positive :** accès accordé au profil exact ; historique existant inchangé.
6. **Confirmation négative :** aucun accès accordé ; motif audité.
7. **Compte déjà autorisé ailleurs :** deuxième autorisation refusée.
8. **Profil déjà doté d'un compte principal actif :** deuxième accès principal refusé, sauf
   si une future décision métier autorise explicitement plusieurs comptes.
9. **Correction d'erreur :** accès incorrect révoqué ; aucune écriture financière modifiée.
10. **Téléphone perdu :** nouveau moyen de connexion, même profil, aucune dette dupliquée.
11. **Compte non validé ou révoqué :** aucun accès, même si le profil est connu.
12. **Hors-ligne :** aucune autorisation d'accès à un profil existant n'est accordée sur
    la seule base d'une correspondance locale non vérifiée.

## Permissions

Remplacer les permissions de rattachement `dossier.rattacher` et `dossier.detacher` par
des permissions exprimant l'intention :

- `client.acces_confirmer`
- `client.acces_revoquer`
- `client.acces_corriger`

La matrice exacte des rôles autorisés reste à confirmer. Les permissions ne doivent pas
être attribuées à l'administrateur technique par défaut, car il n'a pas de pouvoir métier.

## Journal d'audit minimal

- type d'action ;
- compte demandeur et profil client visé ;
- acteur authentifié ayant pris la décision ;
- date/heure ;
- résultat et motif ;
- référence de la vérification d'identité utilisée, sans dupliquer la pièce elle-même ;
- identifiant de corrélation permettant de relier la demande, la décision et une éventuelle correction.

## Décisions ouvertes

1. Une personne peut-elle gérer plusieurs boutiques, chacune avec un profil financier séparé ?
2. Plusieurs personnes/comptes peuvent-ils accéder à la même boutique ? Si oui, avec quels rôles ?
3. Quels critères déclenchent « correspondance possible » plutôt que « nouvelle boutique » ?
4. Quelles preuves démontrent qu'une personne est propriétaire ou gestionnaire autorisé de la boutique ?
5. La confirmation d'accès peut-elle être effectuée hors-ligne, ou exige-t-elle une validation en ligne ?
6. Comment transférer l'accès quand le propriétaire change, sans transférer automatiquement des droits financiers ?
7. Quelle est la procédure de récupération du compte si le téléphone est perdu ou réattribué ?
8. Quelle stratégie de migration permet de transformer les dossiers existants en profils clients sans créer de doublons ni modifier les soldes ?

## Traçabilité

Les contrats S1 attendus par ce ticket sont appliqués dans
`.scratch/s1-authentication/spec.md` (PR 1) à partir de
`S1-amendements-proposes.md`, conservé comme historique de la refonte.
