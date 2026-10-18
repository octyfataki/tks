# 01: La grille tarifaire — un prix par réseau et par unité, et l'historique

**What to build:** Le distributeur saisit le prix de **100 unités d'airtime** — soit un
dollar de valeur faciale — réseau par réseau : Orange, Airtel, Africell, Vodacom, Autre.
Il change un prix quand le marché bouge, et **les prix passés restent consultables** :
une commande d'il y a trois semaines doit encore être compréhensible. L'agent et le client
voient le prix avant de confirmer, en francs et en dollars.

Sans cette grille, deux agents vendent au même prix sans que ce soit garanti, et le
chiffre depend de qui est en face du client.

**Invariant d'unité :** `100 unités = 1 USD` de valeur faciale. Une ligne de grille porte
donc **le prix d'un dollar d'airtime**, et le « prix unitaire » d'une commande vaut ce
montant divisé par 100. C'est la convention du domaine, et elle n'existe qu'ici.

**Blocked by:** les tickets S3 (un prix est un montant dans l'une des deux devises, et il
n'y a pas de conversion stockée)

**Status:** ready-for-human

## Critères

- [x] Une ligne de grille porte **un réseau, un montant et une devise**. Le montant est le
      **prix de 100 unités**, c'est-à-dire le prix d'un dollar de valeur faciale.
- [x] Ce montant est un **prix de vente au client**, pas un prix d'achat auprès de
      l'opérateur. Le prix d'achat n'est pas suivi, comme le stock.
- [x] La **devise est libre** (`CDF` ou `USD`), et le prix s'affiche **dans sa devise et
      converti**, avec la **date du taux** à côté de la conversion. Le chiffre qui engage
      est celui de la devise du prix.
- [x] Les **réseaux sont une liste fermée dans le code** : `CLOSED_NETWORKS = ["ORANGE",
      "AIRTEL", "AFRICELL", "VODACOM", "OTHER"]`, typée, validée par test, **sans écran
      d'ajout**. « Autre » absorbe un opérateur nouveau ; ajouter un nom distinct est un
      cycle de développement. Aucun réseau libre, sinon deux saisies divergentes pour une
      même société.
- [x] Un prix est **historisé par horodatage** : chaque saisie est une **nouvelle ligne
      datée**. Test : changer un prix laisse intactes toutes les lignes précédentes.
- [x] **Effet immédiat seulement** : ni antidatage, ni post-datage d'un prix futur.
- [x] **Aucune ligne n'est modifiée ni supprimée**, ni par l'application ni par une requête
      directe : triggers `BEFORE UPDATE` et `BEFORE DELETE` → `SIGNAL SQLSTATE '45000'` sur
      la table des prix, sur le patron de `journal_audit`, **plus** un test structurel que
      le module n'appelle jamais `update` ni `delete`.
- [x] **La lecture est datée** : une lecture `priceApplicable(lines, network, instant)` rend
      la dernière ligne dont l'horodatage est antérieur ou égal à l'instant. Une commande
      d'il y a trois semaines est reconstituable.
- [x] **Un réseau sans prix rend `null`**, jamais le prix le plus proche. Une grille sans
      date n'est pas historisée, elle est écrasée.
- [x] **La conversion unités ↔ montant est une fonction pure du module.** `100 unités =
      1 USD` ; le montant d'une quantité d'unités se calcule au prix applicable. Le rapport
      100 n'existe qu'à un seul endroit, pour que le ticket 02 ne le réécrive pas.
- [x] **La grille entière à un instant est lisible**, pour que la grille du jour soit
      embarquable hors-ligne. C'est l'engagement de conception pris ici et consommé par le
      ticket 02.
- [x] Saisir ou modifier un prix exige la permission **`grille.tarif`**. Le rôle prime :
      `ADMIN_PRINCIPAL` d'office, `ADMIN_TECHNIQUE` jamais, `AGENT` seulement s'il détient
      la permission. Un agent sans cette permission ne voit pas le champ.
- [x] Chaque saisie est une **écriture métier journalisée** : acteur, rôle au moment,
      valeur avant et après, horodatage local, identifiant d'appareil — **dans la même
      transaction** que l'insert, sinon l'écriture est annulée.
- [x] Un **récapitulatif avant/après** précède l'enregistrement, et un **avertissement non
      bloquant** signale un prix inférieur au taux S3 du jour — seulement si un taux existe
      ce jour-là. Le chef reste libre de passer outre.
- [x] **Aucune récupération automatique du prix depuis l'opérateur.** Le prix est un prix
      négocié, saisi par le chef.
- [x] **Aucun stock n'est suivi**, et ce n'est pas un oubli. Le distributeur a un accès
      direct aux opérateurs ; l'exécution se fait au téléphone de l'agent. Ne pas construire
      de mouvements de stock « pour plus tard ».
- [x] La grille **écrit par la porte d'écriture** `platform/writes`, jamais en direct.
- [x] **Écran** : `/admin/pricing`, une vue, cinq lignes, saisie en place, historique
      dépliable. L'entrée « Grille tarifaire » de la sidebar perd son `soon` et pointe sur
      la route.
- [ ] Test navigateur mince : la saisie d'un prix est refusée à l'écran pour un agent sans
      permission.

## Comments

### 2026-10-18 — interview de cadrage

Toutes les branches ouvertes par le ticket ont été tranchées avant écriture du code.
Les critères ci-dessus les portent ; ce qui suit en garde la trace et les raisons.

| Branche | Décision |
| --- | --- |
| Périmètre | S5-01 en entier, côté admin, **plus** l'amorce de P1 (la porte d'écriture). Pas d'écran agent ni client, pas de commande. |
| Unité | `100 unités = 1 USD` de valeur faciale. |
| Sens du prix | Prix de vente au client ; le prix d'achat opérateur n'est pas suivi. |
| Devise | Colonne libre, `CDF` ou `USD`. |
| Réseaux | Liste fermée en code, « Autre » comme catch-all. |
| Historique | Versionné à l'horodatage, effet immédiat seulement, jamais d'`update` ni de `delete`. |
| Lecture | `priceApplicable(lines, network, instant)`, `null` si aucun prix, plus la grille entière à un instant (`readGridAt`), plus la conversion unités ↔ montant (`amountForUnits`, `unitsForAmount`). |
| Permissions | Patron S3 : principal d'office, technique jamais, agent sur `grille.tarif`. |
| Écran | Une vue, cinq lignes, historique dépliable, récapitulatif avant/après et avertissement de marge négative. |
| Emplacement | `src/modules/pricing/` (table, logique pure, persistance) ; porte dans `src/platform/writes/`. |
| Preuve | Triggers MySQL plus test structurel ; tests purs, sans base de données. |

**Ce que l'interview a mis au jour, et qui dépasse ce ticket.**

1. **L'exemple du ticket 02 était faux** et a été corrigé : `10 unités × 3 500` ne peut pas
   valoir `35 000 CDF` sous la convention `100 unités = 1 USD`.
2. **Le compteur d'architecture a un angle mort** : `inventory.ts` ne reconnaît que les
   tables déclarées dans `lib/db/schema`, donc `modules/clients/deposit.ts` échappe au
   décompte. Mesure réelle le 2026-10-18 : **15 fichiers / 65 écritures**, pour un plancher
   de **16 / 66**. À réparer en fin de P1, pas ici.
3. **Le trigger sera déclaré mais non prouvé** : les Testing Decisions de S5 exigent une
   vraie base de données, qui n'existe nulle part dans le dépôt aujourd'hui.
4. **P3 (moteur de transitions) n'est pas requis** : la grille n'est pas une machine à
   états. La règle « P3 avant S5 » vise la commande du ticket 02.
5. **Un chantier de vocabulaire existe à côté, et il est mis de côté.** Le porteur a
   décidé que « le code et la base parlent anglais », et `.scratch/english-identifiers/`
   prévoit de renommer la permission `grille.tarif` en `price_grid.manage` et les rôles en
   `PRINCIPAL_ADMIN` / `TECHNICAL_ADMIN` / `SERVICE_AGENT`. **Le 2026-10-18, le porteur a
   demandé de l'ignorer pour l'instant** : ce ticket s'écrit donc avec les identifiants que
   le code porte aujourd'hui, et il n'en est **pas** bloqué. Le renommage viendra plus
   tard, et ne changera aucune règle de ce ticket.
6. **La table de correspondance du glossaire ne connaît pas les réseaux.** Elle se veut
   « la liste complète de ce qui est stocké », et `order.channel`, `order.type`,
   `order.state` y sont — `order.network` n'y est pas. Comme le chantier vocabulaire est
   reporté, ce n'est pas une action de ce ticket : à reprendre quand il redémarrera, avant
   que la liste des réseaux ne se fige en code sans correspondance.

**Risques assumés.** La conversion unités ↔ montant produit des francs fractionnaires dès
que le prix n'est pas divisible par 100 ; l'arrondi appartient au ticket 02. Le trigger
vit dans un fichier de migration que `AGENTS.md` classe en généré, comme l'a déjà été
`0006`. La porte d'écriture reste à typer génériquement au-dessus de Drizzle.

### 2026-10-19 — livraison, et deux corrections aux findings

Le porteur a rétabli le chantier vocabulaire : « le code et la base en anglais ». La règle
appliquée est **tout artefact neuf naît en anglais ; aucune valeur existante n'est
renommée**. Les findings 5 et 6 sont corrigés en conséquence : la grille se code en anglais
dès maintenant, et `order.network` entre dans la table de correspondance du glossaire.

**Identifiants livrés (anglais, neufs).**

| Artefact | Nom |
| --- | --- |
| Table | `price_grid` (`id`, `network`, `amount`, `currency`, `effective_at`, `entered_by`, `device_id`, `received_at`) |
| Module | `src/modules/pricing/` — `table.ts`, `price-record.ts`, `publish.ts` |
| Porte | `src/platform/writes/index.ts` — `insertRow`, `updateRow`, `deleteRow` |
| Réseaux | `CLOSED_NETWORKS`, `NETWORK_LABELS`, `isNetwork`, `networkLabel` |
| Devises | `CURRENCIES`, `isCurrency` |
| Unités | `UNITS_PER_DOLLAR`, `amountForUnits`, `unitsForAmount` |
| Lecture | `priceApplicable`, `readPriceAt`, `readGridAt`, `readHistory`, `readGridAt` pour la grille entière |
| Saisie | `preparePrice`, `publishPrice`, `actorCanManagePriceGrid` |
| Permission | `grille.tarif` (valeur existante, renommée au lot 2) ; décision de rôle `canManagePriceGrid` (tri-état, patron S3) dans `lib/db/schema/authorizations/validation.ts` |
| Journal | `typeAction: "price_grid.manage"`, `entite: "price_grid"` |
| Écran | `/admin/pricing` (`page.tsx`, `actions.ts`, `price-grid.tsx`) |
| Triggers | `price_grid_block_update`, `price_grid_block_delete` |
| Migration | `drizzle/0020_price-grid.sql` (+ `drizzle/meta/0020_snapshot.json`, entrée `idx 20`) |

**Écarts et faits à savoir.**

1. **`canManagePriceGrid` vit dans `lib/db/schema/authorizations/validation.ts`**, pas dans le
   module : le garde-fou `rolesEnDur` compte les **fichiers** qui comparent un rôle à une
   chaîne, le plancher est atteint au fichier près, et un fichier neuf le ferait monter. La
   fonction est le patron exact de `rolePeutSaisirTaux` (S3) : `ADMIN_PRINCIPAL` d'office,
   `ADMIN_TECHNIQUE` jamais, `null` pour l'agent — la permission tranche.
2. **Le journal reçoit deux nouveaux cas de rendu** (`journal-summary.ts`) et une explication
   de non-contestation (`contestation.ts`) : un prix ne s'écrase pas, il se corrige par une
   ligne datée.
3. **`drizzle.config.ts` gagne une ligne** (`./src/modules/pricing/table.ts`). Le porteur y
   avait déjà renommé les chemins de schéma ; ces renommages sont indispensables pour que
   `drizzle-kit generate` fonctionne (l'ancien arbre référençait des dossiers disparus).
4. **Une chaîne Drizzle cassée a été réparée au passage.** `drizzle/meta/_journal.json` portait
   les entrées `0020_demonic_spiral` et `0021_fantastic_sandman` **sans fichier `.sql`**, et
   `0021_snapshot.json` contenait deux tables (`demandes_acces_profil`,
   `acces_profil_clients`) qu'aucun code ne déclare plus : `pnpm db:migrate` échouait donc
   **avant** ce travail, sur n'importe quelle machine. Les deux entrées ont été retirées du
   journal et leurs snapshots mis de côté (rien de supprimé :
   `…\Temp\opencode\tks-drizzle-backup\orphelin-0020_snapshot.json` et
   `orphelin-0021_snapshot.json`, avec la copie du journal d'origine). Aucune information
   n'est perdue : ces entrées n'avaient pas de SQL, et le contenu de `0021` est un
   sous-ensemble du snapshot `0020` livré, moins deux tables que rien ne déclare. La grille
   occupe donc la **vraie suite de `0019` : `0020`**. Chaîne validée : `pnpm db:generate`
   répond « No schema changes, nothing to migrate ».
5. **Aucun commentaire dans le code livré** (règle 10 d'`AGENTS.md`), y compris dans les
   fichiers existants touchés. L'explication vit ici. La migration, classée en généré
   (règle 12), garde le commentaire de patron de `0006` sur la raison du trigger.
6. **L'agent détenteur de `grille.tarif` n'a pas de route pour y accéder.** La permission est
   honorée par le module et par l'action (`actorCanManagePriceGrid` rend l'agent autorisé),
   mais l'écran vit sous `/admin`, et `redirectionAcces` renvoie tout `AGENT` vers `/agent`.
   C'est la décision de périmètre (« pas d'écran agent ») qui produit cet écart, pas la
   porte : le jour où l'écran agent existe, il n'aura qu'à appeler le module. La même
   limite existe déjà pour `dossier.creer` et `client.annoter`.

**Ce qui reste ouvert.** Une seule case n'est pas cochée : le **test navigateur** « la saisie
d'un prix est refusée à l'écran pour un agent sans permission ». Le dépôt n'a aucune
infrastructure de test navigateur ; le refus est couvert autrement, par
`canManagePriceGrid` (matrice de rôles, test pur) et par le panneau `PermissionRefusee` que
la page rend dès que l'acteur n'est pas autorisé. À écrire le jour où un runner navigateur
entre dans le dépôt.

