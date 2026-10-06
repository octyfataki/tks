# Architecture globale — découpage en 10 specs

> Document de travail, pas une spec. Il sert à valider la **forme** du projet
> avant de découper chaque spec en tickets. Les specs sont dans `.scratch/sN-*/spec.md`.

**Total** : 10 specs, 308 user stories, **47 tickets** publiés (10 specs
entièrement découpées).

---

## Le graphe de dépendances

```
S1  Authentification
 │
 ▼
S2  Rôles, permissions, audit
 │
 ▼
S3  Taux de change et modèle monétaire
 │
 ▼
S4  Clients et lignes de crédit
 │
 ▼
S5  Commandes, grille tarifaire, preuve de paiement
 │
 ▼
S6  Encaissement et suivi des dettes
 │
 ▼
S7  Trésorerie
 │
 ├──▶ S9  Tableaux de bord et rapports
 ├──▶ S10 Migration des dettes en cours
 └──▶ S8  Offline-first et synchronisation   (construit en dernier)
```

### Deux choses à savoir sur ce graphe

**1. Le projet est une chaîne, pas un arbre.** Presque chaque spec dépend
immédiatement de la précédente. Il n'y a qu'une seule frontière à chaque étape, donc
**aucun parallélisme naturel** entre gens différents. C'est le prix d'un modèle
monétaire unique et d'un journal d'audit unique : ce sont des socles, et les
socles se construisent avant les features.

Il y a une seule exception exploitable : **S3 et S1 peuvent avancer en
parallèle** si les premiers tickets de S3 se limitent à la **mathématique
monétaire pure** — saisie du taux, conversion, calcul du reste à payer — sans le
rattacher à un acteur authentifié. Le câblage du journal d'audit arrive quand S2
atterrit. Cela raccourcit le chemin critique de deux specs. Ce n'est pas une
décision prise : c'est une option, et elle te revient.

**2. S8 n'est pas à sa place dans le graphe, et c'est volontaire.** L'offline
n'est pas une feature à la fin du projet, c'est une **contrainte qui traverse
tout**. Elle est écrite dans les décisions de chaque spec de S1 à S7, mais
construite en dernier, parce qu'on ne peut pas prouver la convergence de
réplication avant d'avoir quelque chose à répliquer.

Conséquence pratique : si S8 révèle une incompatibilité, elle retombe sur une
spec déjà écrite. D'où la règle inscrite dans `AGENTS.md` — toute écriture doit
être capable de se faire sans réseau — qui doit être appliquée **pendant** la
construction, pas vérifiée après.

---

## ADR-0001 est tranché — le chemin critique est ouvert

**Statut : *Accepté*.** Ce qui bloque S3 depuis le début de la rédaction est levé.

La question posée au client était « le taux est-il figé au moment du paiement ? ».
La réponse : *le taux sera le taux actuel renseigné par l'administrateur*,
**applicable que si la dette est en dollars**.

Ce n'est donc pas un taux figé. C'est le **taux en vigueur**, et sa portée est
restreinte aux montants en USD. Trois règles en découlent :

- une écriture porte **un montant et une devise**, et **aucun taux** ;
- **un montant en CDF ne bouge jamais** ;
- **un montant en USD vaut le taux en vigueur** au moment où on le regarde.

**La conséquence à annoncer au client**, parce qu'elle est commerciale et pas
seulement technique : une dette en dollars **ne peut pas être close définitivement
en francs**. Un client qui paie en francs est à jour *à la date de son paiement*,
et ne l'est plus le lendemain si le taux a bougé. **La seule extinction définitive
d'une dette en USD passe par un paiement en USD.** C'est cohérent avec le métier —
il n'y a pas de contrat en francs, il y a un montant en dollars — mais cela
change ce qu'on peut promettre à un client.

Une version antérieure de l'ADR décrivait un cas hybride, où le paiement restait
imputé à son taux d'origine et la créance valorisée au taux du jour. **Ce cas a
été abandonné** : il affichait deux chiffres sans dire lequel est celui qu'on
réclame, ce qui ne peut pas fonder une logique de recouvrement.

Effets sur les artefacts déjà écrits :

| Fichier | Ce qui a changé |
| ------- | --------------- |
| `docs/adr/0001-taux-applicable-est-le-taux-en-vigueur.md` | réécrit, statut *Accepté*, ancien fichier supprimé |
| `GLOSSARY.md` | « Taux figé » remplacé par « Taux applicable » ; ajout de « Dette en dollars, solde en francs » ; invariant 5 réécrit |
| `S3` | plus aucun taux stocké ; trois histoires ajoutées sur l'affichage de la date du taux et la clôture en USD ; deux tests qui remplacent le test de taux figé |
| `S6` | le paiement ne porte pas de taux ; l'écran d'encaissement annonce le montant en USD qui solde pour de bon |
| `S10` | une créance importée ne porte aucun taux ; c'est la **date d'origine** qui est déclarée au rapport |

**Ce qui n'a pas bougé** : l'exemple de référence — dette 100 USD à 2 300, paiements
de 50 000 CDF puis 50 USD, reste 65 000 CDF — reste exact, parce que tout s'y
évalue au même taux. Les deux tests de S3 sur le taux en vigueur le disent
explicitement.

Le même type de blocage existait sur **S1**, avec la question du SMS : si le SMS
fonctionne en production, l'inscription du client gagnait une vérification de
numéro, ce qui changeait l'API d'inscription — donc les premiers tickets de S1.
**Cette question est close.** Le vrai trou n'était pas le SMS : le numéro de
téléphone servait à la fois de clé du compte et de clé du dossier financier. La
validation par un humain, et un dossier désigné par son nom, ferment cette porte
sans code SMS et sans ralentir le comptoir. Si le SMS se met un jour à
fonctionner, ce n'est pas l'inscription qu'il faut rouvrir, c'est la 2FA des
administrateurs.

---

## Le détail par spec

Pour chaque spec : ce qu'elle livre, ce qui la bloque, et les **tranches
verticales** découpées en tickets. La colonne `Ticket` donne le fichier dans
`.scratch/<slug>/issues/`, et chaque ticket y déclare ses propres critères et son
propre `Blocked by`. Ce qui suit est maintenant un plan d'exécution, plus seulement
un axe de découpe.

### S1 — Authentification, validation des comptes · 42 stories · ~6 tickets

**Livre** : des comptes, une validation humaine avant qu'un compte client serve à
quoi que ce soit, et une session qui tient debout sans réseau.
**Bloquée par** : rien. Premier socle du projet.

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Le client s'inscrit et se connecte ; son compte est `EN_ATTENTE_VALIDATION` et ne peut rien faire | `issues/01-inscription-client-compte-bloque.md` |
| 2 | L'administrateur valide ou refuse un compte client après avoir vu une pièce d'identité | `issues/03-validation-compte-client.md` |
| 3 | L'administrateur se connecte avec second facteur obligatoire | `issues/02-administrateur-second-facteur.md` |
| 4 | L'administrateur invite un agent ; l'agent s'inscrit par le lien | `issues/04-invitation-agent.md` |
| 5 | Mot de passe oublié : pièce d'identité, remise par l'administrateur | `issues/05-mot-de-passe-oublie.md` |
| 6 | Cycle de vie de session hors-ligne : survit à la coupure, expire quand même | `issues/06-cycle-de-vie-session-hors-ligne.md` |

**Point d'attention à la découpe** : la tranche 6 est celle que les cinq autres
rendent possible. Si on la sort de l'ordre, on écrit des tranches qui reposent sur
une session non définie.

**Les six tickets sont publiés** dans `.scratch/s1-authentication/issues/`. Le
premier ticket à traiter est `01-inscription-client-compte-bloque.md` : il est le
seul sans bloquant, et il pose le squelette de l'application ainsi que la couture
de test. Sans lui, les cinq autres n'ont rien sur quoi s'appuyer.

**Deux dépendances que les tranches ne montrent pas**, et qu'il faut avoir en tête :

- **La tranche 3 (second facteur) précède la tranche 2 (validation)** dans
  l'ordre des numéros, parce qu'il n'y a pas d'administrateur avant. Les tranches
  4 et 5 en dépendent aussi.
- **La validation par un agent au comptoir n'est pas dans ces tickets.** Elle
  dépend du contrôle de permission, donc de S2, et le défaut sera zéro
  permission. Ce n'est pas un oubli : ouvrir cette porte ici reviendrait à
  laisser valider n'importe qui.

**La tranche 2 est le verrou du produit, pas seulement du code.** Un compte non
validé ne fait rien, donc toute la valeur du projet pour un client passe par la
rapidité de cette validation. Le ticket doit livrer la **file des comptes en
attente** avec leur ancienneté, et l'action de validation accessible à un agent
au comptoir — sinon la décision est juste et l'application est inutilisable.

### S2 — Rôles, permissions, audit · 32 stories · ~5 tickets

**Livre** : qui peut faire quoi, et la trace de ce qui a été fait.
**Bloquée par** : S1 (il faut des comptes pour attribuer des droits).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Le journal d'audit existe, et la base le rend immuable | `issues/01-journal-daudit-immuable.md` |
| 2 | Le rôle, et l'absence de permission vaut refus | `issues/02-role-et-refus-par-defaut.md` |
| 3 | Le distributeur accorde et retire une permission, une par une | `issues/03-accorder-retirer-une-permission.md` |
| 4 | La frontière de l'administrateur technique | `issues/04-frontiere-administrateur-technique.md` |
| 5 | Consulter le journal et remonter le fil d'un enregistrement | `issues/05-consulter-le-journal.md` |

**L'ordre des tranches ne suit pas l'ordre des problèmes.** Le journal est la
tranche 1, et c'est le seul cas du projet où je recommande de ne pas suivre
l'ordre naturel. Un journal qu'on ajoute après coup se branche mal : chaque action
métier a alors été écrite sans lui, et il faut la rattraper partout. Le posant
d'abord, chaque permission des tranches 2 à 4 est écrite **avec** son événement
d'audit, sans qu'on ait à y revenir.

La tranche 4 est séparée de la tranche 2 volontairement. Les deux partagent le même
test — « l'administrateur technique ne peut pas déplacer d'argent » — mais la
tranche 2 pose le refus par défaut pour *tous*, et la tranche 4 ajoute ce que le
support peut quand même faire, et ce qu'il ne peut surtout pas s'attribuer.

**Les cinq tickets sont publiés** dans `.scratch/s2-roles-permissions-audit/issues/`.

### S3 — Taux de change et modèle monétaire · 31 stories · ~5 tickets

**Livre** : la capacité de dire ce qu'un client doit, en deux devises.
**Bloquée par** : S2 (toute écriture financière est journalisée et soumise au
contrôle de permission — le taux en particulier est une écriture métier).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Le taux du jour, et une créance qui porte sa devise | `issues/01-taux-du-jour-et-creance.md` |
| 2 | Un paiement dans l'autre devise, et le reste à payer | `issues/02-paiement-dans-l-autre-devise.md` |
| 3 | Le taux bouge : en USD le reste bouge, en CDF il ne bouge pas | `issues/03-le-taux-bouge.md` |
| 4 | Un jour, un taux : historique, avertissement, correction | `issues/04-un-jour-un-taux.md` |
| 5 | Le calcul est juste hors-ligne, et les erreurs se corrigent sans disparaître | `issues/05-hors-ligne-et-corrections.md` |

**Le test de référence** : dette 100 USD à 2 300, paiements de 50 000 CDF puis
50 USD, reste 65 000 CDF. Il est écrit dans la spec, il est dans le ticket 02, et il
doit passer tel quel. C'est le meilleur test de régression du modèle monétaire du
projet : il combine trois cas — dette en USD, paiement en CDF, paiement en USD — et
un résultat non trivial.

**Le test qui verrouille ADR-0001** : dette 100 USD payée en 230 000 CDF à 2 300,
puis taux à 2 400 — le reste repasse à 10 000 CDF. Le même scénario sur une dette
en CDF reste à zéro. Les deux sont dans le ticket 03, et le deuxième est aussi
important que le premier : c'est lui qui prouve que la règle ne mord pas sur les
francs. Voir ADR-0001.

**Le test structurel est dans le ticket 01, pas dans le 03** : la table des
créances n'a pas de colonne taux. C'est volontaire. Un test de valeur vérifie le
comportement ; seul un test de structure échoue quand on ajoute la colonne « pour
plus tard », ce qui est exactement le moment où ADR-0001 serait abandonné sans
qu'on s'en aperçoive. Le test équivalent sur les paiements est répété dans le
ticket 02.

**S3 était bloquée par une décision.** Elle est prise : ADR-0001 est *Accepté*, et
le taux applicable est celui en vigueur, qui ne mord que sur l'USD.

**Les cinq tickets sont publiés** dans `.scratch/s3-currency-and-money/issues/`.

### S4 — Clients et lignes de crédit · 34 stories · ~5 tickets

**Livre** : des clients distincts, et une limite à l'exposition.
**Bloquée par** : S1 (le compte validé se rattache à un dossier), S3 (un plafond
s'exprime dans l'une des deux devises), S2.

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Le dossier client, et deux homonymes qui restent deux clients | `issues/01-dossier-client-et-homonymes.md` |
| 2 | Le rattachement : un compte validé, un dossier, jamais deux | `issues/02-rattachement-compte-dossier.md` |
| 3 | Le statut, et la promotion est une décision humaine | `issues/03-statut-et-promotion.md` |
| 4 | Le plafond de crédit : une limite qui ne bouge pas avec le taux | `issues/04-plafond-de-credit.md` |
| 5 | Le suivi : qui je relance, et depuis combien de temps | `issues/05-tri-et-suivi.md` |

**Le rattachement était laissé à S4, et il est ici.** S1 livre la validation, S4
possède la fiche dossier, et le rattachement est l'opération qui les joint. Le
ticket 02 tient la promesse faite au client depuis la tranche 03 de S1 : un compte
validé qui n'est rattaché à rien ne montre aucun dossier et aucun solde.

**S4 portait une contradiction, et elle est tranchée dans le sens de la spec.** La
section « plafond de crédit » disait à la fois qu'un plafond en USD se compare aux
créances en USD **sans conversion**, et que le plafond « se comporte comme une
dette » au sens d'ADR-0001 — donc que l'espace disponible varie avec le taux. Les
deux ne peuvent pas être vrais.

Le second l'emporte : **une créance est un fait, un plafond est une décision.** Un
fait se valorise au taux du jour, c'est ADR-0001. Une décision ne se valorise pas. Le
chef a choisi 200 USD le mardi ; que le dollar vaut 2 400 le mercredi ne transforme
pas sa décision en 240 000. Et surtout, si le disponible bouge avec le taux, un
client peut se voir refuser une commande qu'on ne lui avait jamais refusée, sans
qu'aucune décision n'ait été prise. C'est inexplicable à un client, donc c'est faux.

**La conséquence est un test écrit dans les deux sens** : le changement de taux ne
déplace aucun plafond restant, en CDF et en USD. Pas « le disponible n'a pas bougé
aujourd'hui », mais « aucun taux ne le fait bouger » — sans quoi une comparaison par
conversion peut passer par hasard. Ce test est dans le ticket 04.

**Les cinq tickets sont publiés** dans `.scratch/s4-clients-and-credit-lines/issues/`.

### S5 — Commandes, grille tarifaire, preuve · 38 stories · ~6 tickets

**Livre** : l'objet central du système — la commande, et l'argent qui bouge.
**Bloquée par** : S4 (la commande appartient à un client et teste son plafond),
S3 (grille tarifaire en devise), S2 (le journal et les permissions).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | La grille tarifaire : un prix par réseau et par unité, et l'historique | `issues/01-grille-tarifaire.md` |
| 2 | La commande : réseau, unités ou montant, canal, et le plafond qui bloque | `issues/02-commande-et-plafond.md` |
| 3 | La preuve de paiement : téléversée, validée ou refusée, jamais écrasée | `issues/03-preuve-de-paiement.md` |
| 4 | La file d'attente, et le verrou local | `issues/04-file-et-verrou.md` |
| 5 | Servir : une créance, jamais deux | `issues/05-servir-une-creance.md` |
| 6 | Le mode caisse rapide — le parcours le plus fréquent, le plus visible | `issues/06-mode-caisse-rapide.md` |

**Deux défauts trouvés avant de découper, et tranchés ici.**

**Le schéma d'états se contredisait.** Le dessin montrait `SERVIE → ANNULÉE`, alors
que les règles juste en dessous disaient `SERVIE` est terminale. Un agent qui
implémentait le dessin ouvrait exactement la porte que les notes de fin disent
fermer : une commande servie puis annulée, donc renvoyable. Le dessin a été
remplacé par le **tableau des transitions, exhaustif et normatif** — toute
transition absente du tableau est illégale et doit être refusée. Un tableau ne se
lire pas autrement qu'un dessin. `RÉCONCILIER` reste un dossier référençant la
commande, pas un état.

**Aucune permission de S5 n'existait dans la liste fermée.** S2 ticket 02 déclarait
cinq noms — taux, plafond, promotion, écriture financière, mouvement de trésorerie.
Ils couvraient S3, S4, S6, S7, et **aucun** ne couvrait le travail quotidien d'un
agent : poser un verrou, valider une preuve, **servir une commande**. S4 n'en
nommait pas non plus pour créer un dossier. Sous « zéro permission par défaut », un
agent se serait authentifié à la perfection sans pouvoir faire le métier.

La liste de S2 ticket 02 a été complétée avec les noms de **dossier client**,
**grille tarifaire** (ticket 01), **preuve de paiement** (03), **commande** (02, 04,
05) et **réconciliation**. La règle reste la même et est écrite en toutes lettres :
une spec qui introduit une action métier nouvelle **ajoute son nom à la liste**, elle
ne la contourne pas. La liste reste fermée à l'exécution.

**Deux priorités, et elles ne sont pas la même.** Celle qui se sent le plus vite
est le **mode caisse rapide** (ticket 06) : c'est le parcours le plus fréquent et
celui par lequel les agents jugent l'application — s'il est lent, ils repassent au
cahier. Celle qui se voit le moins est le **test du double envoi** (ticket 05) : deux
agents servent la même commande hors-ligne, on obtient **une** commande `SERVIE`,
**une** créance, **un** mouvement de trésorerie, plus un dossier de réconciliation
qui tient les deux exécutions. Ce test doit exister **avant toute ligne de code de
synchronisation**, même échouant. Le premier sauve l'adoption, le second sauve
l'argent.

**Le mouvement de trésorerie n'est pas créé ici, et c'est écrit.** Servir crée la
créance ; le mouvement de caisse correspondant appartient à S7 et sera branché
derrière le même événement « commande servie ». Ne pas improviser un compte de
trésorerie en attendant — c'est ainsi qu'un modèle devient double.

**Les six tickets sont publiés** dans `.scratch/s5-orders-and-payment-proof/issues/`.

### S6 — Encaissement et suivi des dettes · 27 stories · ~4 tickets

**Livre** : le paiement comme objet multi-devises — et le suivi des dettes que le
prototype est structurellement incapable de produire.
**Bloquée par** : S5 (une créance naît d'une commande crédit servie), S3 (le reste
à payer se déduit au taux en vigueur).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Encaisser — un paiement, sa devise, son solde | `issues/01-encaisser-un-paiement.md` |
| 2 | Paiements fractionnés, et les dettes suivies séparément | `issues/02-paiements-fractionnes-et-suivi.md` |
| 3 | L'avance — un solde créditeur, visible | `issues/03-avance-et-solde-crediteur.md` |
| 4 | Corriger sans supprimer — l'écriture inverse | `issues/04-correction-par-ecriture-inverse.md` |

**Ce que la découpe a tranché.**

**L'ancienneté se mesure sur la date de la créance, pas sur celle du dernier
paiement.** L'alternative est plus naturelle — regarder quand il a payé la
dernière fois — et c'est pour cela qu'elle mérite d'être écrite : elle rendrait
invisible le client qui rembourse une petite somme chaque semaine depuis un an,
toujours « à jour » en apparence, et qui doit pourtant depuis toujours. Le
découpage sépare les deux effets : la règle appartient au ticket 02, et le test
qui la verrouille part dans le même ticket, avec un jeu de données construit où
le paiement fréquent et la créance ancienne coexistent.

**Un surpaiement n'est pas une erreur, et le ticket 03 existe pour cela.** Il est
modélisé comme un **solde distinct**, jamais absorbé en silence dans un reste à
payer à zéro — un avance fondue dans le zéro, c'est de l'argent qui disparaît de
la vue du chef. Les deux façons de le rater sont écrites en toutes lettres :
le laisser passer comme un solde nul, ou le rejeter comme une anomalie. La
troisième est de l'afficher.

**Le test de correction est structurel, pas seulement comportemental.** Le ticket
04 verrouille l'impossibilité de suppression **par la base** et non par
l'interface — comme le journal de S2. Une règle qui ne tient que dans le code
d'application est une règle qu'une requête contourne.

**Les quatre tickets sont publiés** dans `.scratch/s6-payments-and-debt-tracking/issues/`.

### S7 — Trésorerie : caisse et monnaie électronique · 26 stories · ~4 tickets

**Livre** : ce que le prototype n'a pas du tout — des sorties, des catégories,
des comptes.
**Bloquée par** : S6 (un paiement client entre en trésorerie), S5 (servir une
commande présentielle crée l'entrée).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Les comptes, et un solde qui descend aussi | `issues/01-comptes-et-sens-du-solde.md` |
| 2 | Un compte par réseau, et l'entrée automatique au service d'une vente | `issues/02-comptes-electroniques-et-entree-automatique.md` |
| 3 | Les sorties expliquées — catégories, totaux, attribution | `issues/03-sorties-expliquees.md` |
| 4 | Transferts atomiques, et rien qui se supprime | `issues/04-transferts-et-correction.md` |

**Ce que la découpe a tranché.**

**Le solde n'est jamais stocké, et le test est structurel.** Un solde qu'on
incrémente devient faux dès la première écriture manquée — et alors plus rien ne
l'explique. Le ticket 01 refuse une colonne solde sur la table des comptes :
elle échoue le jour où quelqu'un l'ajoute « pour aller plus vite », qui est
exactement le jour où le chiffre cesse d'être vrai.

**Entrées automatiques et état de commande sont la même décision, pas deux.**
Le ticket 02 branche l'entrée derrière l'événement « commande servie » de S5,
jamais à côté de lui : deux endroits qui savent que la vente a eu lieu sont deux
endroits qui peuvent se contredire. Le même ticket refuse explicitement
d'exiger deux permissions pour un seul geste — l'agent a déjà `commande.servir`,
et l'empêcherait de servir debout au comptoir.

**Un transfert est la seule opération à deux écritures indivisibles**, et c'est
pourquoi le ticket 04 existe seul. Il écarte deux fois le même malentendu : les
transferts sont neutres dans les totaux de flux, comme les frais et commissions
sont exclus de la trésorerie. Réconcilier ces deux règles aujourd'hui tue un
modèle qui les voudra plus tard.

**Les quatre tickets sont publiés** dans `.scratch/s7-treasury/issues/`.

### S8 — Offline-first et synchronisation · 30 stories · ~5 tickets

**Livre** : le deuxième point de couture du système. **Cette spec est construite
en dernier mais contraint toutes les autres** — une spec S1 à S7 qui introduit un
élément non réplicable l'invalide et devrait être reprise.
**Bloquée par** : S5, S6, S7 (les écritures métier qu'on reproduit hors-ligne),
S4 (les données lues hors-ligne).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Lire sans réseau — les données embarquées, et la session qui survit | `issues/01-lire-sans-reseau.md` |
| 2 | Écrire sans réseau — la file d'attente durable | `issues/02-file-durable-et-ecriture-locale.md` |
| 3 | Synchroniser — succès, échec, et réémission sans doublon | `issues/03-synchroniser-sans-doublon.md` |
| 4 | Les conflits — un dossier de réconciliation, jamais un écrasement | `issues/04-conflits-et-reconciliation.md` |
| 5 | Les photos — compression, file d'attente, envoi en tâche de fond | `issues/05-photos-hors-ligne.md` |

**Ce que la découpe a tranché.**

**La synchronisation n'exige aucune permission métier**, et cette négation est
écrite dans le ticket 03 plutôt que laissée à découvrir. C'est un geste
technique sur sa propre file : l'agent réémet ce qu'il avait déjà le droit
d'écrire. Exiger `commande.servir` ici rendrait la synchronisation inaccessible
à l'agent qui n'a fait qu'enregistrer un paiement — et l'empêcherait de sortir de
la file qui l'attend. L'instinct de poser une porte est naturel ; ici il
enfermerait l'agent dans son propre retard.

**L'idempotence se teste par décompte, jamais par absence d'erreur.** Le ticket 03
coupe l'envoi au milieu, réémet, puis **compte** : une créance, un paiement, un
mouvement, une commande servie. Une écriture qui se répète sans bruit est
exactement le cas qu'un test « aucune erreur affichée » ne voit pas.

**Un conflit et un échec de synchronisation ne sont pas la même chose**, et le
ticket 04 l'écrit parce que les confondre ferait croire qu'une reconnexion
suffit. L'un demande une décision humaine, l'autre demande du réseau. Le même
ticket rappelle qu'une modification concurrente d'un **taux de change** n'est
jamais un conflit — c'est le seul endroit où un même événement ressemble à un
conflit sans en être un.

**Le test le plus important du projet est dans le ticket 04** : deux agents servent
la même commande hors-ligne, et l'on dénombre **une** commande `SERVIE`, **une**
créance, **un** mouvement, plus un dossier de réconciliation. Il doit exister,
**même échouant**, avant toute ligne de code de synchronisation — il relie
ADR-0004, ADR-0005 et les invariants 2 et 3 du glossaire en un seul décompte.

**Les cinq tickets sont publiés** dans `.scratch/s8-offline-sync/issues/`.

### S9 — Tableaux de bord et rapports · 28 stories · ~4 tickets

**Livre** : le chiffre vérifiable — le prototype le rend impossible en exigeant
qu'on colle les clients à la main, en bornant à 200 lignes, et en additionnant
des francs et des dollars.
**Bloquée par** : S5, S6, S7 (les données agrégées), S8 (la fraîcheur).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | Le matin du chef — du jour en cours au portefeuille de dettes | `issues/01-le-matin-du-chef.md` |
| 2 | Les alertes — des entités persistantes, pas des lignes de tableau | `issues/02-alertes-comme-entites.md` |
| 3 | La performance des agents — qui travaille, et où le délai se trouve | `issues/03-performance-des-agents.md` |
| 4 | L'honnêteté des chiffres — fraîcheur, périmètre, cliquabilité | `issues/04-fraicheur-perimetre-cliquabilite.md` |

**Ce que la découpe a tranché.**

**Une alerte ne disparaît jamais d'elle-même, et S9 n'offre aucun bouton pour la
fermer.** C'est la frontière qui a le plus de chances d'être oubliée, et elle est
écrite en toutes lettres dans le ticket 02 : **résoudre la cause fait disparaître
l'alerte ; ne pas la résoudre ne la fait pas disparaître.** Un bouton « marquer
comme traité » produirait exactement ce que la règle refuse — un compteur qui
décroche de la réalité, et une alerte que plus rien ne justifie ni n'explique. Le
test est de propriété et court **dans les deux sens** : résoudre fait disparaître,
et surtout, ne rien faire laisse debout.

**Aucun agrégat n'est stocké**, et le test est structurel et répété : il échoue
dès que quelqu'un ajoute une table d'agrégat « pour aller plus vite ». C'est
précisément à ce moment-là que le chiffre devient faux, et que plus personne ne
le sait. Les tables d'agrégat n'existent pas — c'est la définition qu'une
progression naturelle violerait.

**Les totaux par catégorie vivent en S7, pas ici.** La décision de S9 est
explicite : le périmètre est ici, les calculs sont là-bas. Deux définitions
d'un même total produiraient deux totaux différents affichés l'un à côté de
l'autre, et personne ne saurait lequel croire.

**Le test de l'écran partagé attrape l'horloge locale.** Le ticket 04 exige que
deux personnes devant le même écran voient les mêmes chiffres : si le chiffre
dépend de l'appareil, deux employés ne seront jamais d'accord — et se
disputeront sur un écart qui n'existe pas. C'est le même défaut que la période
du jour, résolu par la même règle : l'horloge du serveur pour ce qui se compare.

**Les quatre tickets sont publiés** dans `.scratch/s9-dashboard-and-reports/issues/`.

### S10 — Migration des dettes en cours · 20 stories · ~3 tickets

**Livre** : la bascule, et l'unique moment où l'on écrit dans la base de ce qui
existait avant le logiciel.
**Bloquée par** : S4 (les dossiers), S3 (les dettes multi-devises), S6 (la
correction par écriture inverse).

| # | Tranche | Ticket |
| - | ------- | ------ |
| 1 | La simulation — un rapport exact, et aucune écriture | `issues/01-simulation-sans-ecriture.md` |
| 2 | L'import — clients, dettes en cours, devise, statut, plafond | `issues/02-import-clients-et-dettes.md` |
| 3 | Idempotence, et l'après-bascule — relancer ne crée rien en double | `issues/03-idempotence-et-apres-bascule.md` |

**Ce que la découpe a tranché — et une erreur qu'il fallait attraper.**

**Les comptes ne sont jamais importés, et mon premier jet le disait à tort.** La
spec est explicite : un compte se fait par inscription puis validation (S1),
**jamais par import**, « c'est ce qui garantit qu'un compte ne peut pas apparaître
par la porte de la bascule ». J'avais écrit dans le ticket 02 qu'un client importé
serait en état `VALIDE` — c'est-à-dire exactement la porte que la règle ferme.
Corrigé.

La conséquence, et c'est une **question ouverte qui se ferme**, était inscrite
jusque-là comme « qui valide en masse les comptes des clients déjà connus à la
bascule, et quand ? ». La réponse est **personne**. La bascule fait le travail
lourd sur les **dossiers** ; chaque client qui vient se connecter passe par la
validation normale, avec son document d'identité, comme n'importe quel nouvel
inscrit. Un client importé **voit** sa dette au moment où son compte est validé
puis rattaché à son dossier — pas avant. La dette existe depuis la bascule, la
**visibilité** du client attend sa validation. C'est le prix de ne laisser aucun
compte entrer par le côté, et il est assumé.

**L'idempotence vient du contenu, pas de la position.** Le ticket 02 fixe que
l'identité d'une ligne est dérivée de son contenu — client, date, montant,
devise — et **jamais du numéro de ligne** : un fichier réorganisé contient les
mêmes faits. Une clé tirée de la position deviendrait fausse au premier tri du
tableur, et produirait des doublons au moment précis où l'on est sûr de ne pas en
faire. Le ticket 03 enchaîne avec le décompte : deux passes successives donnent
exactement le même nombre de clients et de dettes qu'une seule.

**La simulation est le ticket 01, pas une étape de l'import.** Le rapport de
simulation et celui de l'import partagent le même parseur — deux parseurs
différents produiraient deux résultats, et alors la simulation ne prouverait plus
rien de ce qui arrivera. C'est le point structurel qui rend le ticket 01 utile
plutôt que rassurant.

**La migration refuse l'historique des ventes, et ce refus est une décision
écrite**, pas un oubli. Elle reviendra ; la raison doit être retrouvable. On
importe l'état des dettes, pas l'activité passée.

**Les trois tickets sont publiés** dans `.scratch/s10-migration/issues/`.
