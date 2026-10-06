# 03: Le statut — et la promotion est une décision humaine

**What to build:** Un client commence en `EN_EVALUATION` : il ne peut pas prendre de
crédit. Le distributeur le promeut en `PRIVILEGIE` quand il estime que c'est un
bon payeur, et le rétrograde quand ce n'est plus le cas. La promotion prend effet
immédiatement, et elle **ne crée aucune créance et n'annule aucune dette** — un
client rétrogradé garde ce qu'il doit.

**Il n'y a aucun seuil automatique.** Pas de « trois commandes prépayées à temps
suffisent ». La décision est humaine, c'est un choix explicite du chef, et c'est ce
qu'il a demandé.

**Blocked by:** 01 — Le dossier client, et deux homonymes qui restent deux clients

**Status:** ready-for-agent

- [ ] Deux valeurs seulement : `EN_EVALUATION`, `PRIVILEGIE`. **`EN_EVALUATION` par
      défaut**, à la création du dossier. Personne n'a de crédit avant que le
      distributeur l'ait décidé.
- [ ] **Aucun seuil automatique.** Le test vérifie qu'un dossier qui remplit toutes
      les conditions observables n'est pas promu tout seul. La seule voie est la
      décision.
- [ ] La promotion et la rétrogradation sont **immédiates** : aucune période
      d'attente, aucune expiration automatique du statut `PRIVILEGIE`.
- [ ] **La promotion ne crée aucune écriture financière et ne modifie aucune
      dette.** Test : le total du portefeuille est **identique** avant et après.
      C'est le test qui prouve que le statut ne touche qu'à l'éligibilité.
- [ ] **Un client en `EN_EVALUATION` qui a déjà du crédit non soldé le garde.** La
      rétrogradation ne force aucun remboursement. Test : sa dette est inchangée.
- [ ] **Qui a changé le statut de quel client, et quand** est consultable. La
      décision est journalisée comme toute écriture métier.
- [ ] Le motif de rétrogradation est **conservé et consultable**, pour pouvoir
      l'expliquer au client.
- [ ] Le client **voit son statut**, et sait qu'il peut devenir `PRIVILEGIE` : il
      sait ainsi ce qu'il peut viser.
- [ ] **Un client ne change pas son statut.** Changer un statut exige
      **`statut.modifier`**, et l'attribution est journalisée — qui, quand, vers
      quel statut, et d'où il part.
- [ ] Le distributeur peut **lister les clients par statut**, pour trouver qui
      promouvoir et qui relancer.
- [ ] **Hors-ligne**, une promotion prend effet localement immédiatement et se
      propage. Deux promotions concurrentes de statuts différents sur le même client
      produisent un **conflit** de synchronisation, traité par réconciliation — ni
      l'une ni l'autre n'est appliquée en silence.
- [ ] Test navigateur mince : un client `EN_EVALUATION` ne voit aucun chemin vers la
      commande crédit, à l'écran.