# 05: Le calcul est juste hors-ligne, et les erreurs se corrigent sans disparaître

**What to build:** Un agent en zone rurale, sans réseau, annonce un reste à payer
et **le chiffre est le même** qu'en ligne. Si l'agent se trompe de montant, il
corrige — et la correction est visible comme une correction, jamais une
disparition. Deux choses dans cette tranche, parce qu'elles répondent à la même
question : *est-ce que ce que je vois est vrai ?*

**Blocked by:** 03 — Le taux bouge — en USD le reste bouge, en CDF il ne bouge pas

**Status:** ready-for-agent

- [ ] **Le taux en vigueur est embarqué dans le paquet local.** L'interface indique
      explicitement **de quelle date est ce taux**. Un agent qui annonce un chiffre
      doit pouvoir dire de quel taux il vient.
- [ ] **Test : hors-ligne et en ligne donnent le même chiffre** avec le même taux
      embarqué. C'est le test qui garantit qu'un agent en zone rurale n'annonce pas
      un montant faux à un client. Exécuté deux fois : une fois en ligne, une fois
      sur le paquet local sans serveur.
- [ ] **Un taux embarqué est toujours périmé dès le lendemain.** L'interface le dit.
      Ce n'est pas une anomalie, c'est le modèle : le solde d'un client en USD est
      une fonction du taux du jour. Un agent annonce donc un **reste à payer
      daté**, pas un reste éternel.
- [ ] **À la synchronisation, le taux se rafraîchit et les soldes affichés
      changent — et ce n'est pas un conflit.** Aucune donnée n'a été écrite en
      désaccord, seul un paramètre a changé. Ce changement **ne doit produire aucun
      dossier de réconciliation**. Le test le vérifie explicitement. Voir S8.
- [ ] Corriger une écriture erronée se fait **par une écriture inverse**, jamais
      par une suppression ni par une modification. La trace de ce qui s'est passé
      survit.
- [ ] **Une correction est visible comme une correction.** L'administrateur sait
      qu'un chiffre a été ajusté, et de combien. Un historique qui ressemble à un
      historique parce que les corrections sont invisibles n'est pas un historique.
- [ ] Aucune écriture n'est supprimable, et cette impossibilité est **garantie par
      la base**, comme pour le journal d'audit de S2. Test : tentative directe en
      base, rejetée par la base.
- [ ] Les deux écritures — l'originale et l'inverse — restent consultables côte à
      côte, avec leurs horodatages.
- [ ] Une écriture financière est **réplicable** : identifiant généré sur l'appareil,
      horodatage local conservé, jamais réécrit par le serveur.
- [ ] Écrire une correction exige **`ecriture.corriger`**, distincte de
      **`creance.creer`** : corriger n'est pas écrire, et la distinction est ce qui
      permet de retirer l'une sans l'autre.