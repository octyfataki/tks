# 04: Transferts atomiques, et rien qui se supprime

**What to build:** Le chef sort de l'argent de la caisse pour le faire passer sur
un compte mobile money — ou l'inverse. **Deux mouvements liés**, jamais un. Et un
mouvement erroné se **corrige**, il ne se supprime pas.

C'est la dernière pièce de S7, et c'est celle qui peut le plus facilement casser
le modèle : un transfert est la seule opération du système qui doit produire
**deux écritures indivisibles** sans en faire **quatre**.

**Blocked by:** 01 — Les comptes, et un solde qui descend aussi ; 02 — Un compte par
réseau, et l'entrée automatique au service d'une vente

**Status:** ready-for-agent

- [ ] **Un transfert de la caisse vers un compte monnaie électronique** existe, et
      l'inverse aussi. Le mouvement sort d'un compte et entre dans l'autre.
- [ ] **Un transfert est atomique : les deux mouvements existent ou aucun.** Test :
      tenter de produire la sortie sans l'entrée est impossible — la moitié d'un
      transfert est un argent qui a disparu d'un côté sans arriver de l'autre.
- [ ] **Un transfert est neutre dans le total des entrées et des sorties.** C'est
      le test qui sépare un transfert d'un vrai mouvement : si les transferts
      gonflent les entrées, le chiffre d'affaires devient faux. C'est la
      conséquence directe des frais restés hors trésorerie — on écarte deux fois
      le même malentendu.
- [ ] **Les soldes totaux sont identiques avant et après un transfert.** Le
      transfert déplace, il ne crée ni ne détruit. Test sur la somme de tous les
      comptes.
- [ ] **Un transfert montre ses deux mouvements liés**, consultable comme tel : on
      sait que c'est la même opération, pas deux écritures indépendantes.
- [ ] **Un transfert peut être enregistré hors-ligne**, sur l'appareil, avec ses
      deux mouvements liés, et se synchronise comme une seule écriture — jamais
      comme deux écritures séparées susceptibles de se reconnecter à moitié.
- [ ] **Un mouvement erroné ne se supprime jamais.** On écrit un mouvement
      inverse qui ramène le solde à sa valeur exacte d'avant. Invariant 9.
      Test structurel : la suppression directe est **rejetée par la base**, pas
      seulement cachée par l'interface.
- [ ] **La correction restaure exactement le solde**, au centime. Un solde
      « à peu près rétabli » s'accumule en écart invisible.
- [ ] **Une correction exige un motif, obligatoire**, et un refus sans motif est
      lui-même **journalisé**. Une correction sans motif est une suppression
      maquillée.
- [ ] **La correction est visible comme telle**, avec son auteur et son horodatage.
      L'historique garde l'écriture originale, marquée comme corrigée.
- [ ] **Un transfert erroné se corrige**, lui aussi — pas de cas particulier. Le
      même mécanisme, deux mouvements inversés.
- [ ] **Un transfert et une correction sont journalisés** : qui, quand, quel compte,
      quel sens. Invariant 5.
- [ ] Un transfert ou une correction exige **`tresorerie.mouvement`**, et la
      correction **`ecriture.corriger`** en plus. Les deux restent révocables
      séparément — c'est la frontière que S2 a posée.
- [ ] Test navigateur mince : les deux mouvements du transfert sont visibles sur
      l'écran de confirmation, et le motif de correction est exigé.
