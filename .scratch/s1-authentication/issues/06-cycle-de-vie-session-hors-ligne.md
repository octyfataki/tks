# 06: Cycle de vie de session hors-ligne

**What to build:** Un agent ouvre sa session en ligne, perd le réseau, et
traverse sa journée de terrain. Sa session reste valide — la coupure réseau
n'expire rien. Mais sa session **expire quand même**, à une date qu'il voit en
permanence, et dont il est averti avant l'échéance, pour se reconnecter au moment
qu'il choisit plutôt que subir la coupure au milieu d'une journée.

C'est le point le plus structurant de la spec, parce que l'agent travaille hors-ligne
par définition. Une session expiration pensée pour un site web expire au mauvais
moment.

**Blocked by:** 01 — Le client s'inscrit, et son compte ne peut rien faire ;
02 — L'administrateur se connecte, second facteur obligatoire

**Status:** ready-for-agent

- [ ] **Deux notions distinctes, jamais confondues.** L'expiration de session est
      **temporelle** : elle expire au bout d'un délai, que le réseau soit là ou non.
      La coupure réseau **n'expire rien** : c'est une indisponibilité de
      connectivité, pas une perte de droits.
- [ ] Test : session ouverte en ligne, coupure réseau simulée, usage prolongé,
      session **toujours valide**. C'est le test qui valide la distinction.
- [ ] La durée de vie de la session est **configurable et bornée**. Ni infinie, ni
      en années. Ordre de grandeur : quelques jours pour un agent, plus long pour un
      client qui commande rarement. Passer au-delà transforme un téléphone perdu en
      incident financier.
- [ ] L'agent voit **en permanence la date d'expiration** de sa session et reçoit un
      avertissement **avant** l'échéance. Test : on avance l'horodatage au-delà de la
      durée, la session est refusée, et l'avertissement avait été donné avant — pas
      découvert après coup.
- [ ] Une session **expirée localement** est refusée localement, sans attendre la
      synchronisation. C'est le seul cas où l'expiration agit sans réseau.
- [ ] Le secret de session est conservé sur l'appareil, dans le stockage le plus
      protégé que la plateforme offre au navigateur. Une application web installable
      n'a pas de trousseau système fiable : **on ne prétend pas le contraire**, on
      utilise ce qui existe et la limite est déclarée dans les exigences de
      sécurité.
- [ ] **La révocation est effective à la synchronisation, jamais avant.** Un appareil
      déjà hors-ligne dont la session n'a pas expiré peut encore écrire localement.
      Ces écritures sont **conservées** et produisent un **conflit** à la
      synchronisation. Elles ne sont jamais perdues, et jamais appliquées en silence.
      Test : on compte les écritures avant et après la révocation, et on vérifie
      qu'aucune n'a disparu.
- [ ] Se reconnecter en ligne **avant** l'échéance prolonge la session, sans créer
      de doublon d'écriture.
- [ ] **Conséquence assumée, à écrire dans les exigences de sécurité** : un téléphone
      volé reste utilisable hors-ligne jusqu'à l'expiration de la session. La parade
      opérationnelle est de **révoquer le compte et de le signaler à l'agent**, pas
      d'espérer que la révocation coupe l'accès à l'instant.