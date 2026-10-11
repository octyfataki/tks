# 06: Les étiquettes d'annotation client (issue #7)

**What to build:** Le distributeur (ou un agent autorisé) pose à la main un
repère visible sur un compte client — « À surveiller », « Bon payeur »,
« Client de confiance » — et le retire quand il n'a plus lieu d'être. Le
badge est visible sur la fiche du compte. C'est le repère « qui je relance »
du ticket 05, posé par un humain.

**Blocked by:** 01 — Le dossier client et homonymes (la fiche porte le
geste) ; S2 liste fermée (toute action métier nouvelle ajoute son nom) ;
S1-03 file de validation (fiche partagée admin/agent, issue #9).

**Status:** ready-for-agent

**Position hors-périmètre :** la spec exclut « notation, scoring ». Ceci
n'en est pas : aucune note, aucun seuil, aucune probabilité, aucun calcul.
Une étiquette est un repère opérationnel posé par un humain autorisé
(`client.annoter`), comme un post-it sur un dossier papier.

- [ ] La liste des étiquettes est **fermée et vit dans le code**
      (`ETIQUETTES_FERMEES`), comme `PERMISSIONS_FERMEES` : une étiquette
      inconnue vaut refus, jamais une étiquette implicite.
- [ ] La permission **`client.annoter`** rejoint la liste fermée S2 ; les
      agents du profil par défaut la tiennent (geste de comptoir, comme
      `client.valider`), l'administrateur principal peut la retirer.
- [ ] Poser et retirer sont deux **lignes append-only**, jamais une mise à
      jour ni une suppression (invariant 10). L'état courant se dérive
      (événement le plus récent par paire compte/étiquette), il n'est
      jamais stocké.
- [ ] Chaque geste est **journalisé** (`annotation.poser`,
      `annotation.retirer`) dans la même transaction : journal indisponible
      = geste annulé. Le résumé du journal reste lisible (S2).
- [ ] Une pose contestée depuis le journal n'ouvre pas de corrective : on
      retire **depuis la fiche**, l'écriture inverse est déjà tracée.
- [ ] La table est **réplicable** (invariant 9) : `id` généré sur
      l'appareil, `horodatageLocal` conservé, `recuLe` serveur — comme le
      journal S2. L'égalité d'horodatage se tranche par `recuLe`.
- [ ] Lire les étiquettes n'exige **aucune permission** (comme lire un
      dossier, ticket 05) ; **modifier** exige `client.annoter`, et sans
      elle la zone explique le refus au lieu d'afficher des boutons sans
      effet. Pas de bouton mort. Seul l'administrateur principal annote
      sans attribution (le distributeur) ; **l'administrateur technique
      n'annote jamais** (aucun pouvoir métier, GLOSSARY — comme
      `taux.saisir`, S3).
- [ ] Un code inconnu n'affiche **jamais de brut** : ni badge, ni bouton.

**Tests :** dérivation (le plus récent gagne, égalité par `recuLe`,
inconnus ignorés, vide, plusieurs comptes), liste fermée (contenu,
ordre d'affichage), structure migration (table + index, aucune colonne
d'état stocké), liste des permissions (20 noms), badge (libellés, code
inconnu = rien).
