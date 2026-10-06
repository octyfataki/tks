# 01: Encaisser — un paiement, sa devise, son solde

**What to build:** Le distributeur enregistre ce que le client a réellement tendu,
dans la devise réellement tendue. Il voit le solde **avant**, le solde **après**,
et le reste à payer. Le reste est **calculé**, jamais saisi — arrêter de
calculer de tête, c'est précisément ce que le prototype exigeait.

Le client peut payer en francs une dette en dollars, et l'inverse. C'est le cas
dominant en RDC, et le prototype ne sait pas le représenter : une seule colonne
`Paiement effectué`, sans devise, sur la ligne de la dette.

**Blocked by:** les tickets S5 (un paiement s'inscrit à côté d'une créance née
d'une commande), les tickets S3 (le reste à payer se déduit au taux en vigueur)

**Status:** ready-for-agent

- [ ] Un paiement porte **un montant, une devise, une date, un auteur**. La devise
      est **obligatoire** : un paiement sans devise est refusé.
- [ ] **Pas de taux sur un paiement.** Un montant en CDF vaut son montant, un
      montant en USD vaut le taux en vigueur. **Test structurel : la table des
      paiements n'a pas de colonne taux** — le test échoue si quelqu'un l'ajoute
      « pour plus tard ». C'est le même test que sur les créances, et il se répète
      sur chaque nouvelle écriture.
- [ ] **Le rattachement à une créance précise est optionnel.** En pratique, une
      dette n'est pas toujours soldée ligne par ligne : un client rembourse
      globalement. Le système calcule le **solde agrégé** ; le rattachement précis
      est une commodité, pas le modèle. Ne pas introduire de lettrage automatique :
      ce serait une politique comptable qui n'a jamais été discutée.
- [ ] **Le reste à payer est dérivé, jamais stocké.** Invariant 1 du glossaire. Test
      indirect : créer un paiement fait bouger le reste sans que la colonne ait été
      écrite.
- [ ] **Le solde s'affiche avant et après** le paiement, pour que le distributeur
      confirme qu'il part du bon chiffre et voit l'effet immédiatement.
- [ ] **L'exemple de référence du glossaire, exécuté tel quel** : dette 100 USD à
      2 300, paiements de 50 000 CDF puis de 50 USD, reste **65 000 CDF**. Il vient
      de S3 et doit continuer à passer : c'est la preuve que S6 n'a pas altéré le
      modèle monétaire.
- [ ] **Le test de paiement multi-devises, dans les deux sens.** Dette en USD avec
      paiements en CDF puis en USD ; et l'inverse, dette en CDF avec un paiement en
      USD. Le reste est exact dans les deux cas. Le test inverse est indispensable :
      sans lui, une implémentation qui convertit tout en CDF passerait le premier.
- [ ] **Un paiement en francs ne solde une dette en USD que pour la journée.**
      L'écran **le dit**, et propose le montant en USD qui solderait **pour de
      bon**. Voir ADR-0001. Sans cette phrase à l'écran, un agent promet la tranquillité
      à un client qui ne l'a pas.
- [ ] **Un paiement en USD solde une dette en USD définitivement.** Les deux bougent
      ensemble. Test : après un changement de taux, le reste reste à zéro.
- [ ] **Un paiement peut porter une date antérieure**, pour enregistrer un
      règlement fait plus tôt. La date saisie est celle qui compte, pas celle du
      clic.
- [ ] **Un agent encaisse au comptoir** et le client voit son solde se mettre à
      jour immédiatement.
- [ ] **Un encaissement est possible sans réseau.** Le client n'est pas mis en
      attente pendant qu'on cherche un signal. Test exécuté sans serveur.
- [ ] **Le client voit ce qu'il a payé et ce qu'il doit encore**, lui-même, sans
      appeler.
- [ ] Enregistrer un paiement exige **`paiement.creer`**. Un agent sans cette
      permission n'accède pas au formulaire.
- [ ] **Deux paiements enregistrés en même temps, hors-ligne, pour le même client,
      ne produisent aucun conflit** : les deux sont des ajouts indépendants et
      cumulables. C'est le seul cas financier où l'additivité évite le conflit, et il
      est testé explicitement.
- [ ] Test navigateur mince : le solde avant/après est visible à l'écran du
      comptoir.