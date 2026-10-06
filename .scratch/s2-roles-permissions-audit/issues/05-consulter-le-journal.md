# 05: Consulter le journal et remonter le fil d'un enregistrement

**What to build:** Face à une contestation — un client qui dit ne pas devoir cette
somme, un écart de caisse qui ne tombe pas juste — le distributeur ouvre le journal
et trouve ce qui s'est passé, sans deviner. Il filtre par acteur, par date et par
enregistrement. Il reconstruit une journée entière. Il ouvre un enregistrement et
voit **qui l'a touché, quand, et ce qui a bougé**.

Ce ticket ne crée pas de journal : il rend le journal **lisible**. C'est la
différence entre une trace et une preuve.

**Blocked by:** 01 — Le journal d'audit existe et la base le rend immuable

**Status:** ready-for-agent

- [ ] Le distributeur peut **filtrer le journal** par acteur, par date et par
      enregistrement, et trouver un événement précis.
- [ ] Le distributeur peut **reconstruire une journée d'activité** entière, pour
      répondre à la question d'un client.
- [ ] Le distributeur ouvre un enregistrement et voit **qui a agi dessus**, pour
      instruire un écart.
- [ ] Chaque ligne affiche l'**horodatage local** et l'**horodatage de réception**
      côte à côte quand ils diffèrent. Une action faite hors-ligne est ainsi
      repérable comme telle, et l'on sait à quel moment elle est parvenue.
- [ ] Un changement affiche ses **valeurs avant et après**. Sans elles, une trace
      dit qu'un plafond a bougé, pas de combien.
- [ ] Un échec s'affiche **comme un échec**, avec son motif, et non comme une ligne
      d'action réussie.
- [ ] **Aucune suppression n'existe nulle part dans le système.** Un enregistrement
      ne disparaît que par **une écriture inverse tracée**. C'est ce qui rend la
      promesse « rien ne s'efface » crédible plutôt que décorative.
- [ ] Le journal se lit librement : sa propre consultation n'est pas journalisée,
      sinon chaque lecture de l'historique en produirait une nouvelle et le journal
      croîtrait en boucle. Décision assumée, écrite dans le ticket 01.
- [ ] **Le journal survit à la perte du téléphone d'un agent.** Un appareil hors-ligne
      n'efface pas sa propre trace : ses événements non synchronisés restent sur
      l'appareil et arrivent à la synchronisation. Test : appareil réinitialisé,
      événements retrouvés intacts.
- [ ] Test navigateur mince : la reconstruction d'une journée fonctionne sur des
      données réelles issues de la base, pas sur un jeu d'essai en dur.