# 01: Le taux du jour, et une créance qui porte sa devise

**What to build:** L'administrateur principal saisit le taux du jour. Le
distributeur inscrit une créance en indiquant sa devise. Le système calcule ce que
le client doit, en convertissant au taux en vigueur. Personne ne saisit un solde :
le solde est **déduit**, et il est faux dès qu'on le saisit à la main.

C'est le premier des trois chemins qui construisent le modèle monétaire. Les deux
autres — le paiement, et le taux qui bouge — viennent après, parce qu'on ne peut pas
tester « un paiement en francs sur une dette en dollars » avant qu'une dette en
dollars existe.

**Blocked by:** les 5 tickets S2 (toute écriture métier est journalisée et soumise
au contrôle de permission)

**Status:** ready-for-agent

- [ ] Le taux est une entité à part : **une date, une valeur, et qui l'a saisi**. Il
      est journalisé comme toute autre écriture.
- [ ] **Un jour porte au plus un taux.** Une tentative de réécrire un taux existant
      est refusée. Le taux est saisi manuellement — aucune récupération automatique
      depuis une banque centrale, parce que le taux est un taux négocié.
- [ ] Le taux en vigueur est un **paramètre de lecture**, pas une donnée d'écriture.
      Il est résolu au moment du calcul, jamais capturé sur l'écriture.
- [ ] Une créance porte **exactement une devise**, obligatoire. Une créance sans
      devise est refusée : pas de montant orphelin.
- [ ] **Le test structurel qui verrouille ADR-0001** : la table des créances
      **n'a pas de colonne taux**, et le test échoue dès qu'on ajoute la colonne
      « pour plus tard ». C'est le test le plus important de la tranche, parce
      qu'un test de valeur ne rattraperait pas la colonne ajoutée après coup.
- [ ] **Rien de dérivable n'est stocké.** La dette n'est pas une colonne. Test
      indirect : changer le taux du jour fait bouger l'affichage sans qu'aucune
      écriture nouvelle ait lieu.
- [ ] **Aucun montant négatif.** Aucune écriture ne peut corrompre un solde.
- [ ] Les colonnes en double du prototype (`Montant dette CDF` / `Montant dette
      USD`) sont **supprimées**, pas conservées sous une forme dégradée. Trois
      devises ne sont pas prévues.
- [ ] Une **créance manuelle**, hors commande, est possible — c'est ainsi qu'une
      ancienne dette se migre — et elle est **distingable** d'une créance née d'une
      commande, pour pouvoir l'expliquer au client.
- [ ] Une dette en USD est présentée **en dollars d'abord**, son équivalent en
      francs ensuite, avec la **date du taux** à côté de tout montant converti.
      Une dette en USD n'est jamais présentée comme une dette en francs.
- [ ] Test navigateur mince : le contrôle de permission s'applique à l'écran — un
      agent sans la permission **`taux.saisir`** ouvre le modal en lecture seule,
      sans formulaire de saisie ni bouton d'enregistrement.

**Où sont les autres tests.** Cette tranche ne contient pas encore l'exemple de
référence ni les tests de taux changeant : ils sont dans les tranches 02 et 03, et
ils supposent qu'une créance existe. Ce qui doit tenir ici, c'est que la créance
**puisse** exister sans porter de taux — c'est-à-dire que le modèle est capable
d'accueillir les deux autres tranches sans être refait.