# 04: Le plafond de crédit — une limite qui ne bouge pas avec le taux

**What to build:** Chaque dossier porte un plafond : le maximum qu'il peut devoir
simultanément. Une valeur par défaut s'applique à la création, et le distributeur
peut en fixer une autre pour un client donné. Le **plafond restant** est déduit, et
c'est la seule quantité qui autorise une commande crédit.

Ce ticket porte la distinction que le modèle doit tenir : **un plafond est une
décision, une créance est un fait**. Un fait se valorise au taux du jour ; une
décision non. Le chef a choisi 200 USD le mardi, et le fait que le dollar vaut
2 400 le mercredi ne transforme pas sa décision en 240 000.

**Blocked by:** 01 — Le dossier client, et deux homonymes qui restent deux clients ;
les tickets S3 (les créances portent une devise, et il n'y a pas de conversion
stockée)

**Status:** ready-for-agent

- [ ] Le plafond porte **un montant et une devise**, comme toute écriture
      financière. Il porte la devise **dans laquelle le client contracte**.
- [ ] **Un plafond en USD se compare au montant en USD que le client doit**, c'est-à-dire
      la somme de ses créances en USD, **sans conversion**. Un plafond en CDF se
      compare de même à ses créances en CDF. Comparer deux montants de même devise
      évite de dépendre d'un taux qui bouge. Voir ADR-0001.
- [ ] **Test, dans les deux sens : le changement de taux ne déplace aucun plafond
      restant.** Un client avec un plafond de 200 USD et 180 USD de créances en USD
      dispose de 20 USD ; un client avec un plafond de 460 000 CDF et 414 000 CDF
      dispose de 46 000 CDF. On fait varier le taux et **aucun** des deux disponibles
      ne bouge. Sans ce test, une comparaison par conversion peut passer par
      hasard, si le taux n'a pas bougé entre les deux mesures.
- [ ] **Plafond restant = plafond − créances de la même devise, et seulement
      celles-là.** Un client dont les créances sont en USD a un plafond restant calculé
      sur ses créances en USD.
- [ ] **Le plafond restant est dérivé, jamais stocké.** Test indirect : créer une
      créance fait baisser le plafond restant sans qu'aucune écriture ne touche au
      plafond.
- [ ] **Une valeur par défaut vit dans la configuration**, modifiable par
      l'administrateur principal. Elle s'applique aux clients créés **après** le
      changement et **ne modifie pas** les clients existants. Test : changer la
      valeur par défaut ne touche pas un dossier existant, et s'applique au suivant
      créé. **Ne pas coder en dur** — le montant du plafond n'est pas tranché par le
      client.
- [ ] **Le distributeur peut fixer un plafond individuellement et le modifier à tout
      moment**, pour réagir à une grosse commande.
- [ ] **Modifier un plafond ne touche jamais à la dette existante.** Augmenter le
      plafond n'annule rien. Test : le total du portefeuille est inchangé.
- [ ] **Diminuer un plafond ne crée pas de créance** et laisse la dette intacte. Le
      plafond restant devient négatif, il est **affiché tel quel** et non écrêté à
      zéro, et le disponible pour commander est nul.
- [ ] **Deux chiffres sont affichés séparément** : *plafond restant*, qui peut être
      négatif, et *disponible pour commander*, qui ne l'est jamais. Écrêter à zéro
      ferait croire que le client est dans les clous.
- [ ] **Une commande crédit qui dépasse le disponible est refusée**, et le refus est
      journalisé — invariant 4 du glossaire. Le refus est propre : le client sait
      où est la limite avant d'essayer.
- [ ] Le plafond s'affiche **dans la devise où il a été fixé**, avec l'équivalent en
      francs à titre indicatif et la date du taux à côté. Le chiffre qui autorise la
      commande est celui de la devise du plafond.
- [ ] **Hors-ligne, le plafond restant est identique** : même client, même taux
      embarqué, même chiffre sans réseau. C'est ce qui garantit qu'un agent
      n'annonce pas une limite fausse à un client.
- [ ] **Fixer ou modifier un plafond exige `plafond.modifier`.** C'est une décision
      du distributeur, pas une saisie d'agent : une permission qu'on peut retirer
      est ce qui rend la limite réelle.
- [ ] Test navigateur mince : le champ de plafond n'apparaît pas pour un agent sans
      cette permission, en ligne comme hors-ligne.