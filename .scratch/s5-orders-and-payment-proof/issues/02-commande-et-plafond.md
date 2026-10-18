# 02: La commande — réseau, unités ou montant, canal, et le plafond qui bloque

**What to build:** Le client appelle pour « 100 USD d'airtime », ou pour
« 50 unités Orange ». Les deux demandes produisent la même commande, au même prix,
et il n'y a qu'un chemin pour les saisir. La commande sait d'où elle vient — en
ligne ou au comptoir — et si elle sera payée d'avance ou portée en dette.

Au comptoir, l'agent saisit le numéro, le réseau, le montant. **C'est ici que la
commande naît, c'est ici que le plafond la refuse si elle dépasse, et c'est ici
qu'on peut l'annuler.** L'état de la commande est déduit des événements, jamais
écrit à la main.

**Blocked by:** 01 — La grille tarifaire ; les tickets S4 (la commande appartient à
un client et teste son plafond)

**Status:** ready-for-agent

- [ ] La commande porte **un réseau** (liste fermée), **un canal**
      (`EN_LIGNE`/`PRESENTIEL`) et **un type** (`PREPAYE`/`CREDIT`). **Deux axes
      distincts** : le mode de paiement (`ESPECES`/`MOBILE_MONEY`) est un axe
      séparé, porté par S3/S7, et **ne figure pas dans l'état de la commande**.
      Test : passer un canal de `EN_LIGNE` à `PRESENTIEL` ne change pas le type.
- [ ] **Deux modes de saisie équivalents : en unités ou en montant.** La commande
      est **crétée, elle s'écrit en créance plus tard** — ici, elle est simplement
      créée.
- [ ] **Commande en unités et commande en montant sont équivalentes** au même prix :
      les deux produisent le **même montant** et le **même nombre d'unités**. Test
      central de ce ticket : au prix de `2 350 CDF les 100 unités`, `1 000 unités` et
      `23 500 CDF` sont la même commande. La conversion vient du ticket 01, qui porte
      seul la convention : `100 unités = 1 USD` de valeur faciale, et le prix d'une
      unité vaut le prix affiché divisé par 100.
- [ ] **L'arrondi de la conversion est tranché dans ce ticket**, et c'est un point
      ouvert : le prix d'une unité n'est pas toujours un entier de francs (2 350 ÷ 100 =
      23,5). Dire quel montant est réclamé, et lequel est seulement affiché.
- [ ] **Le prix est figé au moment de la création**, dans les deux sens. Commande en
      unités : le prix unitaire est retenu. Commande en montant : le prix unitaire
      est **aussi** retenu, pour pouvoir afficher les unités équivalentes. Test :
      créer une commande, changer le prix, vérifier que le montant **et** le nombre
      d'unités de la commande sont inchangés. C'est le test qui empêche l'historique
      d'être réécrit par la grille tarifaire.
- [ ] Le client voit **combien d'unités il obtient** pour le montant demandé, avant
      de confirmer.
- [ ] **Le plafond bloque réellement.** Une commande `CREDIT` qui dépasse le
      disponible est **refusée**, et le refus est **journalisé** — invariant 4 du
      glossaire. Le client est prévenu immédiatement, **avant** d'être refusé au
      comptoir.
- [ ] **Le refus est net et préventif.** Il indique le disponible restant, pour que
      le client sache où est la limite avant de l'essayer. Aucun dispositif de
      dérogation : le refus est refus.
- [ ] **Une commande `PREPAYE` n'est pas soumise au plafond** — l'argent est déjà
      là. Test : la même commande, `PREPAYE`, passe là où `CREDIT` échoue.
- [ ] **La commande d'un client en `EN_EVALUATION` de type `CREDIT` est refusée**
      (S4). Le statut et le plafond sont deux bornes distinctes, et les deux
      s'appliquent.
- [ ] **Un client qui commande sans compte** est enregistré par le distributeur :
      une commande au comptoir crée ou retrouve le **dossier** (S4), et **ne crée
      jamais un compte pour lui**. Un dossier sans compte est normal ; un compte
      sans validation ne l'est pas.
- [ ] **Annulation possible depuis `EN_ATTENTE_PREUVE`, `EN_FILE` et `VERROU`**,
      et tracée — qui, quand, pourquoi. L'annulation est **terminale**. Le cas
      `VERROU` → `ANNULÉE` ne devient accessible qu'avec le verrou, dans le ticket
      04 ; les deux cas autres le sont ici.
- [ ] **L'état n'est jamais un champ qu'on écrit.** Il se déduit des événements.
      Test : un dossier d'événements reconstruit le même état que la lecture.
- [ ] **L'état et les transitions suivent le tableau exhaustif de la spec.** Toute
      transition hors tableau est refusée. Ici, les transitions implémentées sont
      celles de la création, de la preuve (ticket 03) et de l'annulation (ticket 04).
- [ ] **Chaque commande porte un identifiant généré sur l'appareil** et un
      horodatage local, et **ne peut être créée que hors-ligne**. C'est une
      contrainte de développement, pas une user story : une commande qui exige le
      réseau n'est pas une commande.
- [ ] Créer une commande exige la permission **`commande.creer`** ; l'annulation,
      **`commande.annuler`**. Un client ne crée **que** les siennes.
- [ ] Test navigateur mince : le formulaire de création tient sans navigation, et
      le refus de plafond s'affiche à l'écran.

## Comments

### 2026-10-18 — exemple de conversion corrigé

L'exemple central de ce ticket était faux. Il donnait `10 unités × 3 500` pour
`35 000 CDF`, ce qui suppose un prix de 3 500 CDF **par unité** et contredit la
convention fixée dans le ticket 01 : `100 unités = 1 USD`, le prix de la grille
étant celui de 100 unités. Sous cette convention, `10 unités` valent `235 CDF` au
prix Orange de `2 350 CDF les 100 unités`, pas `35 000 CDF`.

L'exemple est remplacé par `1 000 unités` = `23 500 CDF` au même prix, et le ticket
porte désormais la convention d'unité en clair plutôt que de la supposer.

**Ce qui n'a pas bougé** : tout le reste du ticket. Le prix est toujours figé sur la
commande, les deux modes de saisie restent équivalents, et le plafond bloque
toujours une commande `CREDIT` qui dépasse.

**Point ouvert ajouté, pas tranché** : l'arrondi, parce que le prix d'une unité
n'est pas toujours un entier de francs.

**Ce que cette intervention n'a pas touché.** `.scratch/s5-orders-and-payment-proof/amendements.md`
porte trois amendements à ce même fichier — points 6 (permission du client), 7
(« ne peut être créée que hors-ligne ») et 9 (refus par le statut) — et ils restent
**non appliqués**. Ils appartiennent à un autre chantier, qui les appliquera avec le
ticket 07. Seule la correction de l'exemple de conversion est faite ici.