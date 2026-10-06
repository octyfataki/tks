# 02: L'administrateur se connecte, second facteur obligatoire

**What to build:** Un compte d'administrateur — principal ou technique — se
connecte avec son email, son mot de passe, et un second facteur obligatoire fourni
par une application d'authentification. Sans le second facteur, l'accès est refusé.
Si l'administrateur perd son second facteur, il le remplace de bout en bout,
parce que c'est le chemin qu'on utilise quand ça casse.

Aucun SMS nulle part, et pas seulement à l'inscription : le second facteur des
administrateurs ne passe par aucun SMS.

**Blocked by:** 01 — Le client s'inscrit, et son compte ne peut rien faire

**Status:** ready-for-agent

- [ ] L'accès administrateur **sans second facteur est refusé**. Testé par le refus
      observable, jamais par l'état interne du secret.
- [ ] Le second facteur est une application d'authentification. Aucun SMS n'est
      envoyé, nulle part.
- [ ] Le second facteur est exigé **à chaque nouvelle session**, y compris après
      une session expirée. Il n'est pas proposé une fois puis oublié.
- [ ] Le remplacement d'un second facteur perdu fonctionne **de bout en bout**,
      parce que c'est le chemin qu'on utilise quand ça casse.
- [ ] Deux profils d'administrateur existent : l'administrateur principal et
      l'administrateur technique. Le second n'a aucun accès au métier — il voit ce
      qu'il faut pour diagnostiquer un problème signalé, pas davantage.
- [ ] Un compte administrateur est créé par une **commande de mise en route**
      explicite, hors de l'application, et ce geste est tracé. Il n'existe aucune
      auto-inscription d'administrateur.
- [ ] Les échecs d'authentification administrateur sont journalisés.
- [ ] Test navigateur mince : le second facteur est demandé à l'écran, il n'est pas
      facultatif et il n'est pas contournable par un lien direct.