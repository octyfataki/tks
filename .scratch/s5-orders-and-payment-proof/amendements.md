Status: ready-for-human

# Amendements — ce que le chantier commande-client change dans les documents normatifs

Décisions prises en interview. Chaque ligne donne le texte actuel et le texte
proposé, pour que la modification soit relue avant d'être écrite. Ordre
d'application : les points 1, 2 et 8 avec le lot du vocabulaire ; le point 3 avec
S4 ; les points 4 à 7 et 9 avec le ticket `07`.

**Déjà appliqué** à `GLOSSARY.md` : les points 1, 2 et 8. Le point 8 n'était pas
dans la liste validée : il est apparu en corrigeant le point 1, parce qu'une
troisième phrase du glossaire réservait encore le crédit aux `PRIVILEGIE`. Il est
donc écrit ici comme les autres, avant/après, plutôt que corrigé en silence.

## 1. `GLOSSARY.md` — Statut du client

**Actuel**

> `EN_EVALUATION` ou `PRIVILEGIE`. Un client `PRIVILEGIE` peut passer des
> commandes crédit. Un client `EN_EVALUATION` doit prépayer. La promotion est une
> décision libre de l'administrateur principal, sans seuil automatique.

**Proposé**

> `EN_EVALUATION` ou `PRIVILEGIE`. Le statut est une **information de
> pilotage** : il ne ferme ni n'ouvre le crédit. Ce qui borne le crédit est la
> **ligne accordée** (voir « Plafond de crédit »). La promotion est une décision
> libre de l'administrateur principal, sans seuil automatique.

**Pourquoi.** Toute l'application repose sur « tout client validé doit être
servi ». Laisser le statut fermer la dette contredit les deux plafonds, qui sont
désormais la seule porte.

## 2. `GLOSSARY.md` — Plafond de crédit, plafond restant, engagé

**Actuel**

> ### Plafond de crédit
> Montant maximum que le client peut devoir simultanément. Une valeur par défaut
> s'applique à la création du profil client ; l'administrateur principal peut la
> modifier.
>
> ### Plafond restant
> `Plafond de crédit − créances dans la même devise`. Il est dérivé, jamais
> stocké. Une commande qui dépasserait le disponible est refusée.

**Proposé**

> ### Plafond de crédit
> Montant maximum que le client peut devoir simultanément, **dans une devise
> donnée**. Un profil porte **deux plafonds, un par devise**. La valeur par
> défaut est **zéro** : le crédit s'accorde, il ne se présume pas.
>
> ### Engagé
> Somme des **commandes crédit en attente non annulées**, dans une devise. Ce
> n'est pas une créance : c'est une part réservée du plafond.
>
> ### Plafond restant
> `Plafond de crédit − créances de la devise − engagé de la devise`. Il est
> dérivé, jamais stocké, et jamais négatif. Une commande qui dépasserait le
> disponible est refusée.

**Pourquoi.** Sans l'engagé, trois commandes de 100 USD sur une ligne de 100 USD
passent et sont servies : le plafond ne borne rien.

## 3. S4 — `spec.md` **et** `issues/03-statut-et-promotion.md`

**Actuel**, ligne 76

> - Seul `PRIVILEGIE` peut passer des commandes crédit.

**Proposé** — ligne supprimée, remplacée par

> - Tout client validé et autorisé peut demander une commande crédit ; elle est
>   bornée par le plafond de la devise, jamais par le statut.
> - Le plafond d'un nouveau profil vaut zéro ; l'administrateur principal
>   l'accorde.

**Actuel**, lignes 124-125

> - Le plafond porte un montant et une devise. Un plafond USD se compare aux
>   créances USD ; un plafond CDF se compare aux créances CDF, sans conversion.

**Proposé**

> - Un profil porte **deux plafonds**, un en USD et un en CDF. Chacun se compare
>   aux créances **et aux commandes en attente** de sa devise, sans conversion.
>   Un plafond sans créance de sa devise ne borne rien : c'est voulu, et la
>   conséquence est écrite ici pour ne pas être découverte en production.

**Actuel**, `issues/03-statut-et-promotion.md`, lignes 3-4 et 45

> **What to build:** Un client commence en `EN_EVALUATION` : il ne peut pas
> prendre de crédit. […]
>
> - [ ] Test navigateur mince : un client `EN_EVALUATION` ne voit aucun chemin
>       vers la […]

**Proposé**

> **What to build:** Un client commence en `EN_EVALUATION` avec un plafond de
> **zéro** : il ne peut pas prendre de crédit **parce que sa ligne est nulle**, pas
> parce que son statut le lui interdit. Le distributeur lui accorde une ligne,
> puis le promeut en `PRIVILEGIE` quand il estime que c'est un client sûr.
>
> - [ ] Test navigateur mince : un client sans ligne accordée ne voit aucun
>       chemin actif vers la dette, et l'écran **dit pourquoi**.

**Pourquoi.** Le statut mesurait la confiance ; le plafond mesure le risque. Un
test qui exige « aucun chemin vers la dette » pour un statut donné resterait vert
le jour où la ligne vaut 500 USD, et fermerait le crédit à un client solvable.
C'est le même défaut que le point 1, écrit une portée plus bas.

## 4. S5 — `.scratch/s5-orders-and-payment-proof/spec.md`, table des transitions

**Actuel**

> | — | création, type `CREDIT` | `EN_FILE` | plafond vérifié ; un dépassement est **refusé** et journalisé |

**Proposé**

> | — | création, type `CREDIT` | `EN_FILE` | plafond vérifié **et engagé** ; un dépassement est **refusé** et journalisé |

## 5. S5 — la destination de paiement

**Actuel** : aucune mention. La preuve de paiement suppose que le client sait où
envoyer l'argent.

**Proposé** — ajouter aux décisions d'implémentation

> La destination d'un paiement mobile money est un **numéro par réseau**,
> enregistré par l'administrateur principal (entrée de S7). L'écran de paiement
> affiche le numéro du réseau de la commande et le montant attendu. Sans numéro
> configuré pour ce réseau, une commande `PREPAYE` + `EN_LIGNE` est impossible, et
> l'écran le dit.

## 6. S5 — ticket 02, la permission du client

**Actuel**

> - [ ] Créer une commande exige la permission **`commande.creer`** ; l'annulation,
>       **`commande.annuler`**. Un client ne crée **que** les siennes.

**Proposé**

> - [ ] Créer une commande **au comptoir** exige la permission
>       **`commande.creer`**. Un **compte client** ne détient aucune permission :
>       il crée des commandes parce qu'il a un **accès actif au profil client**,
>       et il ne crée que les siennes. L'annulation par un agent exige
>       **`commande.annuler`**.

**Pourquoi.** `commande.creer` est un droit de staff (`permissions_agents`). Pris
au mot, le texte actuel interdit au client de commander.

## 7. S5 — deux défauts de rédaction à corriger en passant

- Ticket 02 : « et **ne peut être créée que hors-ligne** » — phrase fausse. À
  lire « **peut** être créée hors-ligne ».
- Spec : le paragraphe « `RÉCONCILIER` n'est pas un état de la commande mais un
  **dossier de réconciliation** qui référence la commande » est **écrit deux
  fois** (lignes 143-146 et 148-149). Supprimer la seconde occurrence, qui est la
  version courte.

## 8. `GLOSSARY.md` — Type de commande

**Actuel**

> - `CREDIT` : crée une créance à la livraison ; réservé aux clients
>   `PRIVILEGIE`.

**Proposé**

> - `CREDIT` : crée une créance à la livraison ; borné par le plafond de la
>   devise, jamais par le statut du client.

**Pourquoi.** C'était le **troisième** endroit qui fermait le crédit par le
statut, après « Statut du client » (point 1) et S4 (point 3). N'en corriger que
deux aurait laissé le glossaire se contredire lui-même, à deux paragraphes
d'écart.

## 9. S5 — `issues/02-commande-et-plafond.md`, le refus par le statut

**Actuel**, ligne 47

> - [ ] **La commande d'un client en `EN_EVALUATION` de type `CREDIT` est
>       refusée** […]

**Proposé**

> - [ ] **La commande d'un client dont le plafond est nul de type `CREDIT` est
>       refusée**, et le motif affiché est le plafond, pas le statut. Deux tests :
>       un client `EN_EVALUATION` **avec** une ligne accordée passe ; un client
>       `PRIVILEGIE` **sans** ligne est refusé.

**Pourquoi.** Le test actuel passera pour la mauvaise raison : il sera vert tant
que tous les clients partent à zéro. Le jour où le distributeur accorde une ligne
à un client encore `EN_EVALUATION` — ce qui est exactement le cas normal de
première vente — il rougira. C'est le quatrième et dernier endroit qui ferme le
crédit par le statut ; les quatre sont donc écrits ici.

## Ce que ces amendements laissent ouvert

Rien de mécanique : ils sont tous rédactionnels, et aucun n'oblige à toucher une
autre ligne de code que celles listées. Mais deux questions restent, et elles
n'appartiennent qu'au porteur :

1. Les plafonds sont **deux** (USD et CDF) alors que la table `profils_clients`
   n'en porte qu'un `(plafond_montant, plafond_devise)`. Le passage à deux
   colonnes est une migration de données, donc du ressort de S4, pas de ce
   document.
2. `PRIVILEGIE` garde un sens — « client sûr » — mais ne conditionne plus rien
   d'automatique. S'il ne conditionne plus **rien du tout**, il faut le dire, et
   le supprimer.
