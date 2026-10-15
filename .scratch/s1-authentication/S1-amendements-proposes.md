# S1 — Amendements proposés pour le modèle compte/client

**Statut : appliqué dans `spec.md` (PR 1).** Document conservé comme historique
de la refonte ; la spec canonique ci-dessus fait foi.

**Nature :** note de modification proposée, pas une réécriture de S1. Le fichier source S1
n'était pas parmi les documents disponibles ; les formulations ci-dessous doivent être
intégrées à ses sections exactes après examen de la version canonique.

## Contrat fonctionnel

1. Le compte authentifie la personne qui gère la boutique ; le profil client représente
   la boutique et porte toutes ses données métier et financières.
2. La validation du compte confirme l'identité de la personne à partir d'une pièce
   d'identité. Elle n'accorde pas automatiquement l'accès à un profil client préexistant.
3. Une nouvelle boutique peut recevoir un profil client créé dans le même parcours
   contrôlé, sans étape de rattachement manuel distincte.
4. Si une inscription correspond possiblement à un profil client existant, elle est mise
   en attente de confirmation par un agent autorisé. Avant cette confirmation, aucune
   donnée financière ni aucun historique de ce profil ne sont révélés.
5. Un compte non validé, refusé ou révoqué ne peut pas accéder aux fonctionnalités métier.
   Un compte validé mais sans autorisation active sur un profil ne voit aucune donnée
   financière.
6. Le téléphone reste l'identifiant de connexion unique du compte. Il n'est pas la clé
   métier du profil client et ne prouve jamais, à lui seul, le droit d'accès à une boutique.
7. Le changement ou la perte de téléphone ne crée pas un nouveau profil client. La
   récupération doit conserver l'historique et être auditée.
8. La pièce d'identité n'est pas dupliquée par S4 ou par le parcours d'accès au profil.
   Les usages de récupération de compte doivent disposer de leurs propres contrôles et
   ne pas reposer uniquement sur le fait qu'une pièce a déjà été déposée.

## Invariants de sécurité à tester dans S1

- Aucune consultation de solde, commande, créance, paiement ou historique avant validation
  du compte et autorisation d'accès au profil.
- La validation de la personne et la confirmation de son autorité sur un profil existant
  sont deux décisions distinctes.
- Aucun profil candidat n'est sélectionné automatiquement sur la seule base du téléphone
  ou du nom.
- Toute décision d'accès est journalisée et attribuée à un acteur authentifié.
- Une tentative de rattachement/accession refusée ne crée aucune écriture financière.
- La révocation du compte coupe l'accès sans supprimer ni déplacer l'historique du client.

## Points à réconcilier avec S1 existant

- Toute phrase disant qu'un compte validé « peut immédiatement accéder au dossier » doit
  être conditionnée à l'existence d'un profil nouvellement créé dans le même parcours ou
  à une autorisation confirmée.
- Toute exigence imposant un rattachement manuel pour chaque nouveau client doit être
  supprimée.
- Les états `EN_ATTENTE_VALIDATION`, `VALIDE`, `REFUSE` et `REVOQUE` doivent rester
  cohérents avec le modèle d'autorisation de profil.
- Les flux d'inscription, de validation, de récupération et de changement de téléphone
  doivent tous utiliser le même identifiant stable de profil client.
