# 03: L'administrateur technique ne modifie pas sa propre fiche

**What to build:** La fiche de l'administrateur technique est en lecture
seule, et le **serveur** refuse aussi. Aujourd'hui l'écran verrouille la
fiche grâce à `peutModifierAdmin(role, etat)` — une question de *pouvoir sur
un autre compte* — alors que l'action serveur n'exige que l'état `VALIDE` et
accepterait la modification. L'écran et le serveur disent donc deux choses
différentes. La raison affichée désigne le **rôle**, pas l'état du compte.

**Blocked by:** 01 — le socle de la fiche

**Status:** ready-for-agent

- [ ] Un administrateur technique ne peut pas modifier son nom ni son
      téléphone : l'action serveur refuse, et pas seulement l'écran.
- [ ] La fiche de l'administrateur technique affiche « Lecture seule » avec
      une raison qui désigne son rôle.
- [ ] Un administrateur principal peut modifier ses coordonnées.
- [ ] Un agent de service peut modifier ses coordonnées.
- [ ] Un compte staff non `VALIDE` ne peut pas modifier ses coordonnées.
- [ ] Le message de refus du serveur est celui que l'écran affiche : un seul
      texte, pas deux.
