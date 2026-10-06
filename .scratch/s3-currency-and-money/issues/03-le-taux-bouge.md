# 03: Le taux bouge — en USD le reste bouge, en CDF il ne bouge pas

**What to build:** Le taux passe de 2 300 à 2 400. Le client qui doit 100 USD se
retrouve devoir 10 000 CDF de plus **sans avoir rien fait**. Le client qui doit
100 000 CDF ne bouge pas d'un franc. Ce n'est pas un bug, c'est le modèle — et
l'agent doit pouvoir l'expliquer au comptoir sans regarder le taux deux fois.

Cette tranche est celle qui verrouille ADR-0001. Les deux tests qu'elle livre
sont le contrat entre le modèle monétaire et le recouvrement : ils disent au code
ce que le glossaire dit à l'humain.

**Blocked by:** 02 — Un paiement dans l'autre devise, et le reste à payer

**Status:** ready-for-agent

- [ ] **Test 1 — le taux en vigueur, et lui seul.** Une créance de 100 USD et un
      paiement de 230 000 CDF le 5 janvier, taux 2 300, donnent un reste de **0**. Le
      taux porté à 2 400 le 10 janvier, le même client doit **10 000 CDF** sans avoir
      rien fait.
- [ ] **Test 2 — le symétrique exact.** Une créance de 100 000 CDF et un paiement de
      100 000 CDF donnent un reste de **0 quel que soit le taux**. Les deux tests
      ensemble verrouillent ADR-0001. Le second est aussi important que le premier :
      c'est lui qui prouve que la règle ne mord pas sur les francs.
- [ ] **Test 3 — le paiement qui solde pour de bon.** Une créance de 100 USD soldée
      par un paiement de **100 USD** reste à zéro après un changement de taux, parce
      que les deux bougent ensemble. **Le même montant payé en CDF ne solde pas.**
- [ ] Le taux applicable est celui de **la date de la consultation**. Un rapport
      portant sur un mois passé se lit au taux de ce mois-là, sinon il est faux. Le
      système ne suppose pas « le taux du jour » comme seule référence possible.
- [ ] **La date du taux est affichée à côté de tout montant converti.** Sans elle, un
      client compare avec le taux qu'il a entendu ailleurs et conteste un chiffre
      juste.
- [ ] **L'interface avertit qu'un paiement en francs règle une dette en dollars
      seulement à la date du paiement.** Le jour où elle le rappelle, l'agent ne
      promet pas à un client qu'il est quitte pour de bon.
- [ ] **Conséquence commerciale à assumer, et à afficher** : une dette en USD ne
      peut être close définitivement que par un paiement en USD. Un client qui paie
      en francs est à jour *à la date de son paiement*, et ne l'est plus le lendemain
      si le taux a bougé. Cette phrase doit exister dans l'interface, pas seulement
      dans la spec.
- [ ] Un changement de taux est **journalisé**, comme toute écriture métier, et sa
      saisie exige **`taux.saisir`**.