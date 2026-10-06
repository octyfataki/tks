# 02: Un compte par réseau, et l'entrée automatique au service d'une vente

**What to build:** La monnaie électronique n'est pas une casserole unique : le
Vodacom, le Orange, l'Airtel et l'Africell sont des lieux différents où l'argent
ne se mélange pas. **Un compte par réseau.**

Et quand un agent sert une commande **comptant**, l'entrée existe
**d'elle-même** — c'est la partie de l'histoire 8 qui ne dépend pas des sorties.
Un encaissement manuel reste possible pour tout revenu qui ne vient pas d'une
commande : les entrées ne se limitent pas aux ventes.

**Blocked by:** 01 — Les comptes, et un solde qui descend aussi ; les tickets S5
(servir une commande crée l'entrée exactement une fois)

**Status:** ready-for-agent

- [ ] **Un compte par réseau de monnaie électronique**, et le nombre de comptes
      suit les réseaux du pays. Un réseau ajouté a son compte ; un réseau supprimé
      ne disparaît pas de l'historique — ses écritures restent.
- [ ] **Chaque compte porte un solde d'ouverture**, comme la caisse. Aucune
      exception : un solde initial absent chez un seul compte rend toute la vue
      globale inexplicable.
- [ ] **Servir une commande comptante crée une entrée, exactement une fois.** Le
      test **compte les entrées** : une commande servie, une entrée. C'est le
      pendant en trésorerie du test « une créance, jamais deux » de S5 — les deux
      se vérifient par le même principe, le décompte.
- [ ] **La même commande ne crée pas d'entrée si elle est de type crédit.** Test
      symétrique : servir une commande crédit crée une **créance** (S5) et **aucune**
      entrée. Servir en comptant et servir en crédit sont deux cas, pas deux
      réglages du même cas.
- [ ] **L'entrée automatique dit d'où elle vient : la commande.** La référence de
      la commande est visible, donc l'entrée est explicable.
- [ ] **On sait qui a créé chaque entrée**, automatique ou manuelle. Une entrée
      anonyme est une entrée qu'on ne peut pas défendre devant un client.
- [ ] **Une entrée automatique est tracée comme telle** — créée par le service
      d'une commande, pas saisie. Les deux cas sont visibles comme tels.
- [ ] **Une entrée manuelle reste possible**, pour un revenu qui n'est pas une
      vente. Les entrées ne se limitent pas aux ventes.
- [ ] **L'entrée automatique et la commande sont la même décision.** Elles ne
      peuvent pas diverger : brancher l'entrée derrière l'événement « commande
      servie » (S5), pas à côté de lui. Deux endroits qui savent que la vente a eu
      lieu, c'est deux endroits qui peuvent se contredire.
- [ ] **Hors-ligne, l'entrée automatique existe de la même façon** — servir une
      commande sans réseau crée la créance ou l'entrée sur l'appareil, et la
      synchronisation ne la recrée pas.
- [ ] Le service d'une commande crée l'entrée **en plus** de l'état de la commande,
      jamais **à la place** : l'état est celui de S5, la trésorerie ne réécrit
      aucun état.
- [ ] **Les frais et commissions restent hors trésorerie** — décision explicite de
      la spec. Les sortir des totaux de flux **maintenant** tuerait un modèle de
      données qui le voudrait plus tard : une opération supprimée n'est pas
      réversible.
- [ ] Enregistrer une entrée manuelle exige **`tresorerie.mouvement`**, comme tout
      mouvement. Le service automatique, lui, n'exige **pas** cette permission au
      moment du service : l'agent a déjà `commande.servir`, et exiger deux
      permissions pour un seul geste le rendrait injouable.
- [ ] Test navigateur mince : le compte de rattachement est visible avant la
      saisie, et l'agent sans permission ne voit pas le formulaire.
