# 03: La performance des agents — qui travaille, et où le délai se trouve

**What to build:** Le chef veut savoir **combien de commandes chaque agent a
servies**, **combien il a encaissé**, et **combien de preuves il a validées ou
refusées** — pour repérer un agent laxiste sur la validation autant qu'un agent
inactif.

Et il veut voir **combien de temps il se passe entre une commande et son service**,
par agent, pour trouver le goulot. Le chiffre sert à diagnostiquer, pas à
noter : les deux se ressemblent et ne se jugent pas de la même façon.

**Blocked by:** 01 — Le matin du chef ; les tickets S5 (commandes servies), S6
(encaissements), S7 (encaissements par agent)

**Status:** ready-for-agent

- [ ] **Les commandes servies par agent** (histoire 18) — qui travaille réellement.
- [ ] **Les encaissements par agent** (histoire 19) — qui produit du chiffre. Le
      servir et l'encaisser sont deux gestes différents et se mesurent séparément.
- [ ] **Les preuves validées et refusées par agent** (histoire 20) — pour repérer
      une validation laxiste. C'est la mesure la plus délicate et la plus utile :
      un taux de refus à zéro n'est pas un signe de qualité.
- [ ] **Le délai entre commande et service, par agent** (histoire 21) — pour
      localiser le retard, pas pour l'imputer. Un délai ne dit pas qui est en
      faute ; il dit où regarder.
- [ ] **L'agent voit ses propres chiffres** (histoire 22) — le même tableau, filtré
      sur lui. Une mesure visible seulement en haut est une mesure subie ; la
      voir de soi-même est ce qui la rend utile au quotidien.
- [ ] **Un délai se calcule entre deux horodatages locaux** et non entre le
      serveur et le client : les horloges ne sont pas synchronisées, et mesurer
      entre elles fabriquerait un délai inventé. Invariant 6.
- [ ] **Un délai ne se calcule pas sur une commande encore en cours.** Calculer
      le délai d'une commande non servie produirait une valeur absurde ou vide
      prise pour un délai nul — et le moyenne serait fausse.
- [ ] **Un agent absent ne fait pas baisser les moyennes.** Ses commandes
      incomplètes sont exclues, pas comptées comme des retards infinis. Sinon,
      l'absence d'un agent pénalise tous les autres.
- [ ] **Chaque agrégat est filtrable par période et par agent**, et la période est
      affichée. Un chiffre sans période est un chiffre qu'on ne peut pas contester.
- [ ] **Aucune plage bornée** dans le calcul — comme partout ailleurs. Une limite
      qui ne se signale pas rend le classement faux au-delà d'un certain volume,
      et personne ne s'en aperçoit.
- [ ] **Aucun agent ne voit les chiffres des autres agents**, si ce n'est dans les
      classements rendus disponibles par le distributeur. La comparaison est
      l'affaire du chef, pas celle du collègue.
- [ ] **Les chiffres sont cliquables jusqu'aux enregistrements sous-jacents** —
      voir l'histoire 27 et le ticket 04. Un agrégat qu'on ne peut pas ouvrir ne
      peut pas se défendre.
- [ ] Test navigateur mince : le même écran, avec et sans filtre agent, et le délai
      n'apparaît que pour les commandes terminées.
