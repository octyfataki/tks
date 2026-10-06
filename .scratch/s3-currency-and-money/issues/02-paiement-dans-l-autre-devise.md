# 02: Un paiement dans l'autre devise, et le reste à payer

**What to build:** Un client endetté en dollars vient solder en francs. Le
distributeur enregistre ce que le client a réellement tendu, dans la devise
réellement tendue. Le système calcule le reste à payer, en francs, et lui dit le
chiffre exact. C'est la situation la plus fréquente en RDC, et le prototype ne sait
pas la représenter : une seule colonne `Paiement effectué`, sans devise.

**Cet exemple est normatif et doit être couvert par un test, tel quel :**

> Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF.
> Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF.
> **Reste à payer : 65 000 CDF.**

C'est le meilleur test de régression du modèle monétaire du projet : il combine
trois cas — dette en USD, paiement en CDF, paiement en USD — et un résultat non
trivial.

**Blocked by:** 01 — Le taux du jour, et une créance qui porte sa devise

**Status:** ready-for-agent

- [ ] Un paiement porte **exactement une devise**, obligatoire. Un paiement sans
      devise est refusé.
- [ ] **Test structurel, répété sur les paiements** : la table des paiements **n'a
      pas de colonne taux**. Le test échoue dès qu'on ajoute la colonne.
- [ ] **Reste à payer** = dette moins paiements, chaque montant converti en CDF au
      taux en vigueur. Aucun de ces montants n'est stocké.
- [ ] **Une créance ou un paiement en CDF n'est jamais converti.** Il vaut son
      montant, hier comme demain.
- [ ] **L'exemple de référence passe, tel quel.** Dette 100 USD à 2 300, paiement
      de 50 000 CDF puis de 50 USD, reste 65 000 CDF.
- [ ] **Test d'asymétrie des devises.** Un paiement en CDF sur une créance en USD
      réduit le reste en CDF. Le même montant payé en USD ne le réduit pas de la même
      façon. C'est exactement le piège du prototype Excel, et c'est un test
      obligatoire.
- [ ] Le distributeur voit **les créances et les paiements séparément**, pour
      pouvoir expliquer le solde ligne par ligne.
- [ ] Le solde **avant et après** le paiement est affiché, pour confirmer l'effet
      immédiatement.
- [ ] Le client voit son solde **en francs et en dollars**, avec **le taux utilisé
      et sa date**. Il peut vérifier lui-même.
- [ ] **Chaque variation de solde est traçable à une cause.** Aucun chiffre
      n'apparaît de nulle part. C'est l'application directe du journal de S2 : une
      écriture financière sans événement d'audit est un défaut.
- [ ] Le total de toutes les dettes clients est disponible, d'un coup d'œil.
- [ ] Créer une créance exige **`creance.creer`**, enregistrer un paiement exige
      **`paiement.creer`**. Un agent sans l'une ni l'autre n'écrit rien — et l'absence
      est **celle par défaut** de S2, pas un réglage à configurer.