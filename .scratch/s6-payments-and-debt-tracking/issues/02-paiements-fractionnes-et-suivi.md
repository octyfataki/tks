# 02: Paiements fractionnés, et les dettes suivies séparément

**What to build:** Un client doit 100 USD et rembourse trois fois. Le prototype ne
peut pas le représenter : une colonne ne contient qu'une valeur. Ici chaque
paiement est un objet, ils s'additionnent, et le reste à payer est exact après
chacun.

À côté, le distributeur suit ce qu'il doit : **la dette et le paiement sont listés
séparément**, pour pouvoir expliquer le solde ligne par ligne. Il voit depuis
combien de jours chaque créance court, il filtre sur les clients en retard, et il
découvre ceux qui n'ont **jamais** payé.

**Blocked by:** 01 — Encaisser — un paiement, sa devise, son solde

**Status:** ready-for-agent

- [ ] **Plusieurs paiements sur une même dette**, et le reste à payer est **exact
      après chacun**. C'est le test principal de cette tranche : c'est
      précisément le cas que le prototype ne pouvait pas représenter.
- [ ] **Les créances et les paiements sont affichés séparément**, jamais fondus en
      un chiffre unique. Le distributeur doit pouvoir dire « vous avez pris 100 USD
      le 3, vous avez payé 50 000 le 5 ».
- [ ] **Le paiement fractionné hors-ligne** donne le même reste que sans réseau.
- [ ] **Le client voit le montant qu'il a payé et celui qu'il doit encore**, sans
      appeler — c'est lui aussi qui vérifie.
- [ ] **L'ancienneté se mesure sur la date de la créance, pas sur celle du dernier
      paiement.** C'est ce qui distingue « il paie peu et souvent » de « il ne paie
      plus du tout ». C'est un choix qui mérite d'être explicite, parce que
      l'alternative est naturelle et **fausse** : un client qui rembourse une petite
      somme chaque semaine paraîtrait toujours à jour alors qu'il doit peut-être
      depuis un an.
- [ ] **Un client qui paie régulièrement n'a pas une dette ancienne.** Test sur des
      données construites : créances récentes, paiements fréquents, ancienneté
      faible. Sans ce test, la sémantique de la date du dernier paiement passe
      aussi.
- [ ] **Une créance soldée partiellement n'est pas close** : le reliquat continue de
      vieillir. Une créance soldée à moitié a la même ancienneté qu'avant.
- [ ] **On voit le nombre de jours de retard de chaque créance**, pour juger
      l'urgence.
- [ ] **On filtre sur les clients qui doivent depuis plus de N jours.** Le seuil
      **N est configurable**, pas codé en dur : c'est une règle d'exploitation du
      distributeur, pas une constante du logiciel.
- [ ] **On voit la créance la plus ancienne de chaque client**, pour mesurer la
      gravité.
- [ ] **Le portefeuille est trié par montant**, pour savoir qui relancer d'abord,
      et le **total de toutes les dettes clients** est visible.
- [ ] **On voit l'historique de dettes d'un client dans le temps** — ses prises et
      ses remboursements, pour comprendre son comportement.
- [ ] **On voit qui n'a jamais payé**, pour cesser de lui accorder du crédit. C'est
      l'information que le prototype ne peut pas produire du tout.
- [ ] **Le client voit son propre historique de dettes**, pour confronter les
      chiffres du distributeaux siens. L'écart doit pouvoir se voir, pas se
      discuter.
- [ ] **Un agrégat n'a pas de limite de volume.** Aucune plage bornée. Une limite
      nécessaire pour des raisons techniques doit être **explicite et signalée**,
      jamais silencieuse — c'est le défaut du prototype (« jusqu'à la ligne 201 »).
- [ ] Lire le portefeuille n'exige **aucune permission particulière** au-delà du
      rôle : les agents voient tous les clients, un client ne voit que le sien.