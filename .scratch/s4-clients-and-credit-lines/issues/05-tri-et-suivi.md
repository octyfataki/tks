# 05: Le suivi — qui je relance, et depuis combien de temps

**What to build:** Le distributeur ouvre la liste de ses clients et la voit **triée
par montant dû**. Il filtre sur ceux qui doivent de l'argent depuis plus de N jours.
Il voit d'un coup d'œil qui est près de sa limite. Il ouvre une fiche et trouve
l'historique complet : créances, paiements, statut, plafond, pièce d'identité.

C'est le ticket qui remplace le « je compte de mémoire » du chef, et la colonne
«entered by hand » du prototype.

**Blocked by:** 04 — Le plafond de crédit — une limite qui ne bouge pas avec le taux ;
03 — Le statut — et la promotion est une décision humaine

**Status:** ready-for-agent

- [ ] **Aucune liste à coller, nulle part.** L'ensemble des clients est un agrégat.
      La colonne « saisi à la main » du prototype disparaît. Si un agrégat est limité
      en volume, la limite est **explicite et signalée** dans l'interface, jamais
      silencieuse.
- [ ] Les clients sont **triés par montant dû**, pour savoir qui relancer d'abord.
- [ ] On voit **depuis combien de temps** un client doit, et on peut **filtrer sur
      ceux qui doivent depuis plus de N jours**.
- [ ] On peut **chercher un client dont la dette est échue**, pour préparer son
      arrivée.
- [ ] Le **plafond restant est affiché dans la liste des clients**, pour voir d'un
      coup d'œil qui est près de la limite. Et une vue dédiée des **clients proches
      de leur plafond**, pour anticiper.
- [ ] La fiche client affiche **l'historique complet en un seul endroit** : créances,
      paiements, statut, plafond, pièce d'identité. C'est le dossier que le chef
      ouvre quand un client conteste.
- [ ] **L'ancienneté de la dette est calculée sur la date de la créance la plus
      ancienne non soldée**, pas sur une date saisie. Une ancienneté saisie est une
      ancienneté fausse au bout de trois mois.
- [ ] Chaque figure affichée porte **le taux et sa date** quand elle est convertie,
      pour que le chiffre soit vérifiable.
- [ ] Lire un dossier n'exige **aucune permission particulière au-delà du rôle** :
      tous les agents voient tous les clients (c'est une décision explicite), un
      client ne voit que le sien. **Modifier** un plafond, lui, exige
      **`plafond.modifier`** — et un agent qui ne l'a pas ne voit pas le champ.
      Lire et écrire ne s'autorisent pas de la même façon, et ne pas les confondre
      ici, c'est le début d'une frontière que S2 a posée.
- [ ] **Le dossier ne se partage pas.** Un client ne voit pas les autres. Test à
      l'écran, pas seulement en couche applicative.
- [ ] **Hors-ligne**, la liste et les filtres fonctionnent sur les dossiers
      embarqués. Un agent en zone rurale doit pouvoir répondre « qui doit de l'argent
      depuis plus d'un mois ? » sans réseau.
- [ ] Test navigateur mince : la liste se charge sans plage fixe, et les filtres se
      recomposent en total exact.