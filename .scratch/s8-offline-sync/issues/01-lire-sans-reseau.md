# 01: Lire sans réseau — les données embarquées, et la session qui survit

**What to build:** L'agent arrive chez un client dans une zone blanche. Il doit
pouvoir répondre à la question qu'on lui pose : **« combien je vous dois, et
combien il me reste de plafond ? »** — sans réseau. Le solde est une lecture, et
une lecture doit être possible sans le réseau.

À côté, la session doit **survivre** : l'agent ferme l'application, le téléphone
redémarre, la batterie lâche. Il rouvre et il est toujours connecté, avec le
même état. Ce n'est pas un confort, c'est la condition pour que le reste du
système soit utilisable.

**Blocked by:** les tickets S4 (le dossier et le plafond lus hors-ligne), les
tickets S3 (le reste à payer au taux embarqué)

**Status:** ready-for-agent

- [ ] **Voir le solde d'un client hors-ligne**, et **voir son plafond restant**
      hors-ligne. Ce sont les deux réponses attendues au comptoir, et les deux
      doivent être disponibles sans réseau.
- [ ] **Les deux chiffres sont exactement les mêmes avec et sans réseau** — même
      client, même taux embarqué, même résultat. Un solde qui diffère selon la
      connexion n'est plus un solde.
- [ ] **Le plafond restant hors-ligne ne promet pas trop.** Le taux embarqué
      étant ancien, le chiffre affiché porte la mention de sa **date**, pour que
      l'agent sache qu'il annonce un chiffre peut-être dépassé. C'est la
      conséquence d'ADR-0001 lue en terrain hostile : l'argent a pu bouger.
- [ ] **La session survit à la fermeture de l'application.** Rouvrir ne demande
      pas de se reconnecter.
- [ ] **La session survit au redémarrage du téléphone**, y compris une panne de
      batterie. Test : terminer le processus, redémarrer, ouvrir — connecté, et
      les brouillons de travail sont là.
- [ ] **Les brouillons de saisie survivent au redémarrage.** La session sans les
      écritures locales ne servirait à rien : c'est l'association des deux qui
      fait que rien ne se perd.
- [ ] **On sait quand les données ont été mises à jour** (histoire 14). Une donnée
      affichée sans date est une donnée qu'on ne peut pas juger.
- [ ] **On est prévenu clairement quand les données sont périmées** (histoire 13),
      avec un langage qu'un agent comprend — pas une mention technique. L'agent
      doit savoir s'il agit sur une information vieillie avant d'agir, pas après.
- [ ] **Le distributeur voit l'activité du jour même si certains agents n'ont pas
      synchronisé** (histoire 11). Ce qu'il voit est ce qui existe ; ce qui n'est
      pas encore arrivé est **signalé comme absent**, pas ignoré. S9 traitera la
      fraîcheur des chiffres, mais la donnée vient d'ici.
- [ ] **Les données lues hors-ligne sont embarquées sur l'appareil** : elles y
      sont écrites par la synchronisation, pas lues depuis le réseau. C'est la
      distinction qui fait toute la différence — lire un cache est une décision,
      lire le réseau est un espoir.
- [ ] **Les données lues hors-ligne ne changent pas toutes seules** : sans réseau,
      elles sont **figées** et datées. Le rafraîchissement est un acte explicite.
- [ ] **Un client ne voit que les siennes**, en ligne comme hors-ligne. Le
      contrôle d'accès s'applique aux données embarquées de la même façon —
      c'est le test qu'on peut lire uniquement ce qu'on a le droit de lire,
      même depuis la copie locale.
- [ ] Test navigateur mince : la coupe du réseau pendant une consultation ne
      change pas le contenu affiché, et l'indicateur de fraîcheur apparaît.
