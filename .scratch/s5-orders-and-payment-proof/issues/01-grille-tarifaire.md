# 01: La grille tarifaire — un prix par réseau et par unité, et l'historique

**What to build:** Le distributeur saisit le prix d'une unité d'airtime, réseau par
réseau : Orange, Airtel, Africell, Vodacom, Autre. Il change un prix quand le marché
bouge, et **les prix passés restent consultables** : une commande d'il y a trois
semaines doit encore être compréhensible. L'agent et le client voient le prix avant
de confirmer, en francs et en dollars.

Sans cette grille, deux agents vendent au même prix sans que ce soit garanti, et le
chiffre depend de qui est en face du client.

**Blocked by:** les tickets S3 (un prix est un montant dans l'une des deux devises,
et il n'y a pas de conversion stockée)

**Status:** ready-for-agent

- [ ] Le prix porte **un réseau et un montant dans une devise**, comme toute écriture
      financière. Les **réseaux sont une liste fermée** : Orange, Airtel, Africell,
      Vodacom, Autre. Aucun réseau libre, sinon deux saisies divergentes pour une
      même société.
- [ ] Un prix est **historisé** : chaque modification est datée et **ne modifie
      aucun prix antérieur**. Test : changer un prix laisse intactes toutes les
      valeurs précédentes.
- [ ] **Le prix est figé sur la commande**, et c'est le test central de ce ticket
      dès qu'une commande existe — c'est-à-dire dans le ticket 02, où la commande
      naît. Ici, le contrat à tenir est que le prix **a une date**, donc qu'une
      lecture à une date donnée est possible. Une grille sans date n'est pas
      historisée, elle est écrasée.
- [ ] **L'agent voit le prix avant de confirmer**, pour ne pas annoncer un chiffre
      faux.
- [ ] **Le client voit le prix avant de confirmer**, pour qu'il n'y ait pas de
      surprise au comptoir.
- [ ] Le prix s'affiche **en francs et en dollars**, avec la **date du taux** à côté
      de la conversion, pour que le distributeur puisse annoncer l'une ou l'autre.
      Le chiffre qui engage est celui de la devise du prix.
- [ ] Saisir ou modifier un prix exige la permission **`grille.tarif`**. Un
      agent sans cette permission ne voit pas le champ.
- [ ] **Aucune récupération automatique du prix depuis l'opérateur.** Le prix est un
      prix négocié, saisi par le chef.
- [ ] **Aucun stock n'est suivi**, et ce n'est pas un oubli. Le distributeur a un
      accès direct aux opérateurs ; l'exécution se fait au téléphone de l'agent.
      Ne pas construire de mouvements de stock « pour plus tard ».
- [ ] **La grille du jour est embarquée dans le paquet local** : hors-ligne, un
      agent peut chiffrer une commande. C'est un engagement de conception pris ici,
      consommé par le ticket 02.
- [ ] Test navigateur mince : la saisie d'un prix est refusée à l'écran pour un agent
      sans permission.