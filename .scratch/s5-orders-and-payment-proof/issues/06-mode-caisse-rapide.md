# 06: Le mode caisse rapide — le parcours le plus fréquent, le plus visible

**What to build:** Le client est devant l'agent. Le numéro, le réseau, le montant —
et c'est confirmé. **Un écran, sans navigation.** Aucune preuve, aucun état
intermédiaire visible par le client.

Ce ticket a une place particulière dans la planification : **le mode caisse rapide
est plus important que le reste de cette spec.** C'est le parcours le plus fréquent
en pratique, et c'est par lui que les agents jugent l'application. S'il est lent ou
pénible, ils passent par un cahier et le système se vide de son intérêt.

**Blocked by:** 05 — Servir — une créance, jamais deux

**Status:** ready-for-agent

- [ ] **Le flux : numéro de téléphone → client trouvé ou créé → réseau → montant ou
      unités → confirmé.** C'est la séquence, et elle tient **sans aucune
      navigation** dans l'application pendant la saisie.
- [ ] **Le strict minimum de champs.** Tout champ supplémentaire est une seconde
      ajoutée au temps d'un client en attente.
- [ ] **Aucune preuve** n'est exigée : le canal `PRESENTIEL` fait foi, l'agent est
      témoin de l'encaissement.
- [ ] **Aucun état intermédiaire visible par le client.** La commande ne passe pas
      sous ses yeux par `EN_ATTENTE_PREUVE` — elle naît en file.
- [ ] **Si le numéro n'appartient à aucun dossier, le dossier est créé dans le
      flux.** Il y a un champ, et c'est tout. Le dossier est créé **par le
      distributeur ou l'agent**, jamais un compte pour le client — un client peut
      être servi sans avoir de compte, c'est le cas normal au comptoir.
- [ ] **Si plusieurs dossiers portent ce numéro, le client est choisi, jamais
      déduit.** La recherche affiche nom, adresse et solde (S4) ; elle n'en
      retient aucun automatiquement.
- [ ] **Le plafond s'applique si la commande est `CREDIT`**, et le refus est affiché
      sur place. **Si elle est `PREPAYE`, il ne s'applique pas** — l'argent est là.
- [ ] **Le prix affiché est celui de la grille du jour, figé au moment de la
      création**, et l'écran dit combien d'unités le montant donne.
- [ ] **La commande entre en file immédiatement**, puis suit le même verrou et le
      même service que toute autre commande. Il n'y a **qu'un chemin d'exécution**,
      un chemin d'entrée rapide.
- [ ] **Test : le mode caisse rapide tient en un écran**, sans navigation. Testé
      comme un **parcours de bout en bout**, pas comme une fonction. Le test compte
      les écrans parcourus.
- [ ] **Le mode caisse rapide est traité en priorité à l'implémentation.** Ce n'est
      pas un ordre de bataille, c'est un avertissement : d'autres éléments
      paraissent plus urgents, et c'est ce parcours qui décidera si les agents
      utilisent le système.
- [ ] Hors-ligne, le parcours fonctionne sur la **grille tarifaire embarquée** et
      le **dossier local**, et la commande se synchronise ensuite. Un agent sans
      réseau au comptoir doit pouvoir servir.
- [ ] Le parcours exige **`commande.creer`**, et rien d'autre pour saisir — la prise
      et le service suivent les permissions du ticket 04 et du ticket 05. Aucun
      chemin ne contourne ces deux-là, fût-ce au comptoir : la vitesse ne se paie
      pas en permissions sautées.
- [ ] Test navigateur mince : le parcours est traversé sur l'interface réelle, sur
      un écran de téléphone, avec un compte `AGENT` habilité.