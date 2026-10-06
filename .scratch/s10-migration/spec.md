Status: ready-for-agent

# S10 — Migration des dettes en cours

## Problem Statement

Des clients existent et **doivent de l'argent au moment de la bascule vers
l'application**. L'interview a tranché : on reimporte **les dettes en cours**,
pas l'historique.

La tentation inverse — « on repart de zéro » — a été formulée puis **écartée**,
et il faut que la raison soit écrite quelque part, parce qu'elle ne sera pas
évidente le jour où quelqu'un la=rediscutera.

**Repartir de zéro n'est pas un choix de propreté, c'est une perte d'argent.**

- La créance d'un client disparaît des livres. Le chef ne sait plus qui lui doit
  quoi, et l'argent est sorti sans trace.
- Le client se réinscrit avec un solde à zéro. Il peut recommencer à prendre du
  crédit **plafond plein**, alors qu'il doit déjà 300 USD. Le plafond de 200 USD
  qu'on a mis en place est faux dès le premier jour.
- En cas de contestation, il n'y a **aucune preuve** de ce qui était dû.

Une dette est un **fait**, pas une donnée. Un logiciel de gestion ne peut pas
effacer la réalité comptable. Ce qu'on peut effacer, c'est le superflu :
l'historique des ventes, les tickets, les réalisations airtime.

Ce que l'on **ne fait pas** : importer l'historique des ventes, des
« réalisations airtime », des mouvements de caisse et de monnaie électronique.
Ces données ont une valeur de démonstration, pas une valeur comptable.

## Solution

Un import **ponctuel, supervisé et vérifiable** qui crée les clients et leurs
dettes en cours, sans le reste.

- Les **clients** sont créés avec leur identité, leur statut et leur plafond.
- Les **dettes en cours** sont créées comme des **créances sans commande**,
  clairement distinguables de celles qui viendront des commandes futures.
- Le tout est **idempotent** : réexécuter l'import ne crée pas de doublon.
- Un **rapport d'import** dit exactement ce qui a été créé, ce qui a été ignoré
  et ce qui a posé problème.
- Un passage en **simulation** permet de vérifier avant d'écrire.

## User Stories

### Préparation

1. As the distributor, I want to know exactly what will be imported before anything happens, so that I can check.
2. As the distributor, I want a dry run first, so that I see the result without committing.
3. As the distributor, I want to see errors before committing, so that I fix them in the source.
4. As the distributor, I want to import my clients, so that they exist in the application.
5. As the distributor, I want to import each client's outstanding amount, so that I know who owes me what.
6. As the distributor, I want to import the currency of each debt, so that the debt is meaningful.
7. As the distributor, I want to import each client's status, so that privileged clients keep their access.
8. As the distributor, I want to import each client's credit ceiling, so that limits are realistic from day one.

### Contrôle

9. As the distributor, I want the import to refuse a client whose phone number is already used, so that I don't create a duplicate.
10. As the distributor, I want to be told which rows were refused and why, so that I can fix the source.
11. As the distributor, I want the imported debt total to be shown, so that I compare it with my own figure.
12. As the distributor, I want to see the import report afterwards, so that I know what happened.
13. As the distributor, I want to re-run the import after fixing the source, so that I don't have to start over.
14. As the distributor, I want a re-run to not duplicate anything already imported, so that I can retry safely.
15. As the distributor, I want to know which import an amount came from, so that I can trace it.

### Après

16. As a client, I want to be recognised when I first connect, so that my existing debt is there.
17. As the distributor, I want the imported debt to behave like any other debt, so that repayment works normally.
18. As the distributor, I want imported debt to be correctable like any other debt, so that a wrong figure can be fixed.
19. As the distributor, I want to know which debts existed before the application, so that I can explain an old figure to a client.
20. As the distributor, I want the migration not to require the historical sales, so that the work stays reasonable.

## Implementation Decisions

### Périmètre strict

Trois catégories importées, et **rien d'autre** :

| Catégorie | Importée | Origine |
| --------- | -------- | ------- |
| Clients (identité, statut, plafond) | **oui** | fichier source du client |
| Créances en cours | **oui** | fichier source du client |
| Historique des ventes | **non** | sans valeur comptable |
| Commandes passées | **non** | sans valeur comptable |
| Mouvements de caisse et monnaie électronique | **non** | sans valeur comptable |
| Objectifs airtime | **non** | non définis (cf. S9) |

### Créances importées

- Une créance importée porte `source = ` une valeur qui la distingue d'une
  créance née d'une commande. Un debt arisen d'une **commande** a toujours une
  commande liée ; une créance importée n'en a pas.
- Elle porte sa **devise**, son **montant** et sa **date d'origine** — la date à
  laquelle la dette a été contractée, si elle est connue. C'est cette date qui
  alimente l'ancienneté (S6).
- Elle **ne porte aucun taux**, comme toute écriture (ADR-0001). Une créance
  importée en CDF vaut son montant ; une créance importée en USD vaut le taux en
  vigueur à la date de consultation.
- Ce qui doit être **visible dans le rapport d'import**, c'est donc la **date
  d'origine** de chaque créance, pas un taux : elle est ce qui permet de dire
  depuis quand la dette court, et elle alimente l'ancienneté en S6. Le rapport
  affiche les totaux du portefeuille **au taux du jour**, en indiquant la date du
  taux utilisé.
- Une créance importée **compte dans le plafond restant** immédiatement. C'est le
  but de l'import.

### Idempotence

- L'import est **idempotent** : le réexécuter ne crée aucun doublon. L'identité
  d'une ligne source est dérivée de son contenu (client + date + montant +
  devise), pas d'un numéro de ligne du fichier, pour que le même fait réimporté
  depuis un fichier réorganisé soit reconnu.
- Un client existant est **mis à jour**, pas dupliqué.
- Un **numéro de contact** partagé par plusieurs lignes source ne provoque **aucun
  refus** : le dossier accepte un numéro de contact non unique (S4). Deux clients
  qui partagent un téléphone sont deux clients.
- En revanche, si la ligne source porte un numéro **déjà pris comme identifiant de
  compte** par un compte existant, l'import ne touche pas à ce compte : il n'a
  rien à dire sur les comptes, qui ne sont pas importés. Les comptes se font par
  inscription puis validation (S1), jamais par import. C'est ce qui garantit qu'un
  compte ne peut pas apparaître par la porte de la bascule.
- Aucun dossier n'est désigné automatiquement par son numéro seul. Un numéro qui
  correspond à plusieurs dossiers est **signalé**, pas tranché.

### Rapport

- Le rapport d'import indique, **par catégorie** : nombre de lignes lues,
  nombre créées, nombre mises à jour, nombre refusées, avec le motif de chaque
  refus.
- Il indique le **total des créances importées par devise**, pour comparaison
  directe avec la figure du chef.
- Il indique le **taux en vigueur et sa date**, ainsi que le total du portefeuille
  converti à ce taux. Le taux n'est pas une donnée de la créance : c'est un
  paramètre de lecture, donc le rapport le déclare plutôt que de l'associer à
  chaque ligne.
- Le rapport est **conservé** et consultable. C'est la trace de la bascule.

### Passage en simulation

- Une exécution en **simulation** produit le rapport complet **sans aucune
  écriture**. C'est le seul moyen de vérifier avant de basculer.
- La simulation est exécutable autant de fois que nécessaire.

### Contraintes offline

- L'import est un outil **d'administrateur**, exécuté en ligne. Il n'a pas de
  version hors-ligne : importer un fichier de dettes depuis un téléphone en
  zone rurale n'est pas un besoin.
- Les entités créées portent un **identifiant généré par l'outil**, selon la même
  règle que le reste du système (identifiant généré côté client d'écriture),
  pour que les entités importées soient indistinguables des autres une fois
  créées.
- L'import est **journalisé** comme une action à part entière, avec son rapport
  rattaché.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** L'import est testé par ses effets observables : ce qui existe après,
ce qui n'existe pas, ce qui a été refusé.

**Les tests qui comptent :**

- **Le total importé correspond à la source.** Le test central : un fichier de
  dettes source, un import, et la somme des créances créées est **exactement**
  égale à la somme du fichier, par devise. Un écart est un bug d'agrégation.
- **L'idempotence.** Exécuter le même import **deux fois** ne change rien à la
  seconde exécution : même nombre de clients, même nombre de créances, mêmes
  totaux. C'est le test qui rend la reprise après erreur possible, donc c'est le
  test le plus important de cette spec.
- **Le refus motivé.** Un numéro de téléphone déjà pris produit un refus
  **nommé**, pas une fusion et pas un doublon silencieux. Le rapport le dit.
- **La simulation n'écrit rien.** Exécuter en simulation, puis constater que la
  base est inchangée — nombre d'entités et totaux. Test explicite, parce que
  « la simulation écrit quand même » est un bug classique et coûteux.
- **Le rapport est exact.** Le nombre de refus du rapport est égal au nombre de
  refus constatés. Le rapport ne peut pas être un texte figé.
- **La dette importée compte dans le plafond restant immédiatement.** Un client
  importé avec 300 USD de dette et un plafond de 200 USD se retrouve avec un
  **plafond restant négatif**. C'est le comportement correct : il dit la vérité.
- **Aucune créance importée ne porte de taux.** Le test est structurel : changer le
  taux du jour déplace le total du portefeuille importé sans qu'aucune ligne
  n'ait été modifiée. C'est la preuve que l'import n'a pas réintroduit le modèle
  figé que le prototype n'a pas.
- **Le rapport déclare le taux utilisé et sa date**, et le total converti qui en
  découle. Le rapport distingue les totaux par devise, ce qui permet au chef de
  retrouver son chiffre du classeur.
- **Une créance importée se comporte comme une créance normale.** Elle apparaît
  dans le reste à payer du client, se solde par un paiement ordinaire, et
  disparaît quand elle est soldée. C'est le test qui prouve que l'import n'a pas
  créé un cas particulier.
- **Une créance importée est correctable** comme toute autre : une écriture
  inverse ramène le total à sa valeur exacte.
- **Rien d'autre n'est importé.** Un fichier contenant aussi des ventes, des
  caisses et des réalisations **ne crée aucune** de ces entités. Test
  d'exclusion, à écrire explicitement.
- **L'import est journalisé**, avec son rapport rattaché à l'action.

## Out of Scope

- **Migration de l'historique des ventes, des commandes passées, des « réalisations
  airtime », des mouvements de caisse et de monnaie électronique.** Décision
  explicite : ces données n'ont pas de valeur comptable.
- **Réimport automatique depuis Excel.** L'Excel d'origine n'est pas une source
  pilotée. L'import est **ponctuel**, puis l'Excel est abandonné.
- **Fusion de deux fiches client.** Un conflit de téléphone produit un refus, pas
  une fusion. La fusion est une décision humaine, hors outil.
- Migration des comptes des agents, des identifiants, des mots de passe. Les
  agents sont réinvités (S1).
- Migration des **objectifs airtime** : ils ne sont pas définis (cf. S9).
- **Migration des dettes propres du distributeur** (« Mes dettes » du
  prototype) : le besoin n'est pas confirmé.
- Détection et correction automatiques d'anomalies dans le fichier source.
- Versioning des fichiers source importés : l'import conserve le rapport, pas le
  fichier.

## Further Notes

**La décision « dettes en cours seulement » doit être défendue, pas ré-expliquée
à chaque fois.** Elle a été discutée et arbitrée. Si quelqu'un la remet en
question, la réponse est en tête de ce document : repartir de zéro, c'est
perdre l'argent que les clients doivent et réinitialiser leurs plafonds à plein au
moment exact où on les met en place. Ce n'est pas une préférence de propreté.

**Le seuil entre « dette en cours » et « historique » est une décision du client,
pas de l'outil.** Ce que l'application sait faire, c'est importer des créances
avec leur date d'origine, ce qui permet **aussi** d'importer six mois
d'historique si le client le souhaite. Ce qui est exclu ici, c'est l'import du
volume — ventes, tickets, réalisations — pas la profondeur des dettes.

**Le total du portefeuille affiché le jour de la bascule peut différer de ce que
le chef avait en tête, et ce n'est pas une erreur d'import.** Le prototype ne
contenait aucun taux : ses totaux en dollars n'étaient pas convertis du tout. La
première fois que le portefeuille est présenté en francs, chaque créance en USD
est convertie pour la première fois. Le rapport d'import doit donc afficher le
total **avec le taux du jour et sa date**, et rappeler que les montants en USD
sont repris tels quels du fichier source. Comparer le total de la bascule au total
du classeur n'a aucun sens, et le rapport doit le dire au lieu de laisser le chef
conclure à une perte.

**L'idempotence n'est pas un raffinement.** Sans elle, corriger le fichier source
et relancer l'import crée des doublons de dettes, et il n'y a aucun moyen
pratique de les distinguer de créances légitimes. C'est la raison pour laquelle
l'identité d'une ligne importée est dérivée de son **contenu** et non de sa
position dans le fichier.
