# 04: L'honnêteté des chiffres — fraîcheur, périmètre, cliquabilité

**What to build:** Un chiffre de tableau de bord doit dire **quand il a été
calculé**, **quelle période il couvre**, et **mener aux lignes qui le
composent**. Sinon, deux personnes devant le même écran peuvent discuter une
demi-heure sans jamais savoir si elles regardent la même chose.

C'est le dernier ticket de S9, et c'est celui qui empêche le dashboard de
reprendre les défauts du prototype : des totaux faux par construction, bornés à
200 lignes, et impossibles à vérifier.

**Blocked by:** 01 — Le matin du chef ; 02 — Les alertes ; 03 — La performance
des agents

**Status:** ready-for-agent

- [ ] **Chaque chiffre indique quand il a été calculé** (histoire 23). Un chiffre
      sans horodatage est un chiffre qu'on ne peut pas juger.
- [ ] **On sait si certains agents n'ont pas synchronisé** (histoire 24) — les
      chiffres sont alors **incomplets**, et le mot est écrit. Présenter un
      total partiel comme un total est la faute la plus grave qu'un tableau de
      bord puisse commettre : il ne laisse aucun moyen de la détecter.
- [ ] **Chaque chiffre indique la période qu'il couvre** (histoire 25) — un jour et
      un mois ne se confondent pas. Le prototype mélangeait déjà des formules de
      périodes différentes dans le même cadre.
- [ ] **Filtrage par période, réseau et agent** (histoire 26) — pour descendre
      dans une anomalie. Le filtre **modifie le chiffre, pas l'affichage d'un
      tableau figé** : filtrer sans recalculer montrerait la même valeur déplacée.
- [ ] **Chaque chiffre est cliquable jusqu'aux enregistrements sous-jacents**
      (histoire 27). C'est le test qui sépare un chiffre vérifiable d'une
      affirmation. Sans lui, une erreur ne se trouve jamais.
- [ ] **Deux personnes devant le même écran voient les mêmes chiffres**
      (histoire 28). C'est le test qui attrape l'horloge locale : si le chiffre
      dépend de l'appareil, deux employés ne seront jamais d'accord — et se
      disputeront sur un écart qui n'existe pas.
- [ ] **Aucun total n'est stocké** : tout est recalculé à la consultation. Test
      structurel, répété du ticket 01 — il échoue dès que quelqu'un ajoute une
      table d'agrégat « pour aller plus vite ». C'est précisément à ce moment-là
      que le chiffre devient faux, et que plus personne ne le sait.
- [ ] **Les agrégats affichent leur taux et leur date quand ils convertissent.**
      L'exemple de référence du glossaire sert ici de test de non-régression :
      total des dettes **230 000 CDF**, reste **65 000 CDF**. Vérifié à chaque
      modification du modèle monétaire.
- [ ] **Aucune limite bornée de plages.** Une limite nécessaire est **explicite et
      signalée** sur le chiffre lui-même, jamais silencieuse. Le prototype comptait
      jusqu'à la ligne 201 sans rien dire.
- [ ] **Le filtrage n'introduit pas d'écart** : le total filtré est égal à la somme
      des lignes affichées, au centime. Un filtre qui ne recompose pas exactement
      perd l'argent dans les interstices.
- [ ] **Les catégories affichées viennent de S7**, et S9 ne les redéfinit pas. La
      décision de S9 est explicite : le périmètre est ici, les totaux par catégorie
      sont là-bas. Deux définitions d'un même total produiraient deux totaux
      différents affichés l'un à côté de l'autre.
- [ ] Lire un chiffre n'exige **aucune permission particulière** au-delà du rôle ;
      le filtrage sur un autre agent, lui, n'est ouvert qu'au distributeur.
- [ ] Test navigateur mince : la fraîcheur et la période sont visibles à côté de
      chaque chiffre, et un clic mène aux lignes sources.
