# 03: L'avance — un solde créditeur, visible

**What to build:** Un client avance 100 000 FC alors qu'il doit 30 000 FC. Ce n'est
**pas une erreur**, c'est un comportement normal dans ce métier : il paie d'avance
pour la prochaine commande. Il faut donc l'enregistrer — et surtout **l'afficher**.

Un solde créditeur absorbé en silence dans un reste à payer à zéro, c'est de
l'argent qui disparaît de la vue du chef. C'est pourquoi il est modélisé comme un
**solde distinct** et affiché comme tel, pas comme une absence de dette.

**Blocked by:** 01 — Encaisser — un paiement, sa devise, son solde

**Status:** ready-for-agent

- [ ] **Un paiement supérieur au reste à payer est autorisé**, et crée un **solde
      créditeur**. Test : la tentative de refus échoue — enregistrer un
      surpaiement passe.
- [ ] **Le test vérifie que le solde créditeur est affiché**, et qu'il ne devient
      **ni un reste à payer à zéro, ni une erreur**. Ce sont les deux façons de le
      rater : le laisser passer comme un solde nul, ou le rejeter comme une anomalie.
- [ ] **Un solde créditeur se compense automatiquement** sur la prochaine commande
      crédit. Test : avance, puis commande crédit, vérifier que le total reste juste
      après compensation.
- [ ] **Le montant de l'avance reste visible après compensation** — on peut
      retrouver d'où il venait. Une compensation qui fait disparaître la trace est
      une perte d'information, pas une automatisation.
- [ ] **Un client ne peut pas acheter plus que son disponible en confondant avance
      et plafond.** L'avance augmente son pouvoir d'achat immédiat, mais le plafond
      reste la borne du crédit : les deux se lisent séparément à l'écran. Un
      distributeur qui verrait « disponible » sans distinction croirait à tort que
      tout est cumulable.
- [ ] **Un encaissement au comptoir peut être une avance**, et l'agent voit le solde
      créditeur tout de suite — c'est le moment où le client le comprend.
- [ ] **Un avance est enregistrable hors-ligne**, comme tout paiement, et apparaît
      après la synchronisation.
- [ ] Enregistrer l'avance exige **`paiement.creer`**, comme tout paiement. Ce
      n'est pas un cas particulier avec sa propre porte.
- [ ] Test navigateur mince : le solde créditeur est visible sur la fiche client et
      sur l'écran d'encaissement.