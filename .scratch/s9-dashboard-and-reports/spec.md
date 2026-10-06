Status: ready-for-agent

# S9 — Tableaux de bord et rapports

## Problem Statement

Le prototype Excel a un « Dashboard », mais ce n'est pas un tableau de bord :
c'est une grille de `SUM()` sur des plages fixes (`A2:C201`), avec deux graphiques
figés. Trois défauts le rendent inutilisable en l'état.

1. **Le tableau de synthèse exige un travail manuel.** La feuille « Synthèse
   Dettes » ne produit aucun total tant que le chef **n'a pas collé la liste des
   clients en colonne A à la main**, à partir de la ligne 3. C'est une étape
   manuelle sur le calcul le plus important du système.
2. **Les plages sont fixes et bornées.** Au-delà de la ligne 201, plus rien
   n'est compté. Rien ne signale que les données sont tronquées.
3. **Les indicateurs sont faux par construction.** Le total « Dettes Clients » est
   `SUM('Dettes Clients'!F2:F201)` — la colonne F étant elle-même un calcul dont
   la formule est *detteCDF + detteUSD − paiement*, c'est-à-dire
   **des francs plus des dollars moins un paiement sans devise** (voir ADR-0002).

Et ce qui manque entièrement, alors que ce sont les questions du matin du chef :

- Combien ai-je encaissé aujourd'hui, en espèces et en monnaie électronique ?
- Qu'ai-je vendu aujourd'hui, par réseau ?
- Combien chaque agent a-t-il servi et encaissé ?
- Qu'est-ce qui attend une décision de ma part ?

## Solution

Des tableaux de bord **calculés à partir des données**, sans aucune saisie
préalable, et **honnêtes** sur leurs limites.

- Les indicateurs sont **dérivés** et recalculés, jamais saisis.
- Aucune liste à coller : la liste des clients est un agrégat, pas une entrée.
- Les **alertes sont un état de première classe**, pas une note en bas de page.
- Les **conflits de réconciliation** apparaissent sur le tableau de bord du
  chef, tant qu'ils sont ouverts.
- Le périmètre par réseau, par agent et par période est filtrable.

## User Stories

### Le matin du chef

1. As the distributor, I want to see today's takings at a glance, so that I know how the day started.
2. As the distributor, I want to see cash and mobile money separately, so that I know which account grew.
3. As the distributor, I want to see today's takings per agent, so that I know who is producing.
4. As the distributor, I want to see today's sales per network, so that I know which network is moving.
5. As the distributor, I want to see this month's sales compared to the previous month, so that I know the trend.
6. As the distributor, I want to see the day's cash in my pocket, so that I can count and compare.
7. As the distributor, I want to see how much my clients owe me in total, so that I know my exposure.
8. As the distributor, I want to see the debt portfolio sorted by amount, so that I know who to chase.
9. As the distributor, I want to see clients overdue beyond a threshold, so that I act on the worst.
10. As the distributor, I want to see which clients are close to their ceiling, so that I anticipate refusals.

### Alertes

11. As the distributor, I want to be told about payment proofs waiting, so that no sale is lost to a forgotten validation.
12. As the distributor, I want to see how long a proof has been waiting, so that old ones surface.
13. As the distributor, I want to be told about unresolved synchronisation conflicts, so that no double credit stays hidden.
14. As the distributor, I want to see conflicts per client, so that I spot an organisational problem.
15. As the distributor, I want to see clients who exceeded their ceiling, so that I address it before it repeats.
16. As the distributor, I want alerts ordered by urgency, so that the important one is first.
17. As the distributor, I want to go from an alert to the thing needing a decision, so that acting takes one click.

### Performance des agents

18. As the distributor, I want to see orders served per agent, so that I know who is working.
19. As the distributor, I want to see takings per agent, so that I know who produces revenue.
20. As the distributor, I want to see proofs validated and refused per agent, so that I spot a lax validation.
21. As the distributor, I want to see how long each agent takes between order and service, so that I know where the delay is.
22. As an agent, I want to see my own figures, so that I know how I'm doing.

### Cohérence et honnêteté

23. As the distributor, I want a figure to say when it was computed, so that I know how fresh it is.
24. As the distributor, I want to know if some agents haven't synced, so that I know the figures are incomplete.
25. As the distributor, I want to see which period a figure covers, so that I don't confuse a day with a month.
26. As the distributor, I want to filter any figure by period, network and agent, so that I can drill into an anomaly.
27. As the distributor, I want every figure to be clickable through to the underlying records, so that I can verify it.
28. As the distributor, I want two people looking at the same screen to see the same figures, so that we agree.

## Implementation Decisions

### Agrégation

- **Aucune liste à coller, nulle part.** L'ensemble des clients est un
  agrégat. La colonne « entered by hand » du prototype disparaît.
- Tous les indicateurs sont **dérivés**, recalculés à partir des mêmes données que
  les écrans opérationnels. Il n'existe pas de calcul parallèle dans un rapport.
- Aucune **plage fixe**. Un agrégat ne s'arrête pas à une ligne 201.
- Les agrégats sont **calculables hors-ligne** avec les données embarquées, afin
  qu'un agent puisse répondre « combien ont-ils vendu aujourd'hui ? » sur le
  terrain.

### Périmètres

- Filtres par **période**, **réseau**, **agent** et **client**.
- Une période est un intervalle de dates explicite. Aucune période implicite
  comme « le mois courant » qui changerait sous les pieds de l'utilisateur.

### Alertes

- Les alertes sont des **entités**, pas des notifications transitoires. Elles ont
  un état : ouverte, résolue.
- Une alerte est **liée à l'objet** qui la cause, et le clic mène directement
  dessus. Une alerte qui ne mène nulle part n'est pas une alerte.
- Catégories d'alerte, au minimum :
  `PREUVE_EN_ATTENTE`, `PREUVE_AGE`, `CONFLIT_OUVERT`, `CONFLIT_AGE`,
  `PLAFOND_DEPASSE`, `SYNC_RETARD`.
- Un **conflit de réconciliation ouvert reste visible** sur le tableau de bord du
  chef et **compté dans les alertes**. Il ne peut pas être masqué, et il n'est pas
  seulement visible sur un écran de support.

### Fraîcheur

- Chaque figure affiche **son horodatage de calcul**.
- Un bandeau indique le **nombre d'appareils n'ayant pas synchronisé** sur la
  période, quand il y en a. Le chef doit savoir si ses chiffres sont incomplets.
- Les données en attente de synchronisation sont **comptées quand elles sont
  connues de l'appareil**, et signalées comme partielles.

### Ventes par réseau

- Une vente est une **commande servie** (S5), pas une « réalisation » comme dans
  le prototype. Le rapport est une vue dérivée des commandes `SERVIE`.
- La période est la date de **service**, pas la date de commande : une commande
  passée le 30 et servie le 2 compte en février.

### Contraintes offline

- Les agrégats sont **réplicables** ou **recalculés localement** à partir des
  événements embarqués.
- Les alertes sont **des entités locales** qui se propagent. Une alerte créée
  hors-ligne n'est pas perdue.
- Un agent hors-ligne voit **ses** chiffres, pas ceux du portefeuille complet
  qu'il n'a pas localement. L'interface le distingue explicitement : ne pas
  afficher un agrégat partiel comme s'il était complet.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** Un indicateur est testé par sa valeur affichée pour un jeu de données
construit dont le résultat attendu est connu à la main.

**Les tests qui comptent :**

- **Les indicateurs concordent avec les écrans opérationnels.** Un test qui prend
  les données et vérifie que l'indicateur du tableau de bord est **exactement**
  égal à la somme des enregistrements sous-jacents. C'est le test qui empêche la
  dérive entre un rapport et la réalité. Il doit être généralisé, pas écrit
  indicateur par indicateur.
- **L'exemple de référence de S3, repris tel quel comme test de non-régression du
  tableau de bord** : dette de 100 USD au taux 2 300, paiements de 50 000 CDF puis
  de 50 USD. Le total des dettes clients affiche **230 000 CDF**, et le reste à
  payer de ce client affiche **65 000 CDF**. C'est le même chiffre que l'écran du
  client, au même taux, à la même date. Si un jour un rapport annonce autre chose,
  c'est le rapport qui a tort — et ce test le dit avant qu'un client le dise.
- **Le taux et sa date accompagnent tout agrégat converti.** Un total de dettes
  exprimé en francs sans le taux du jour est un chiffre que personne ne peut
  vérifier. Voir ADR-0001 : un agrégat en USD se comporte comme un solde en USD,
  il bouge avec le taux, et il doit le dire.
- **Une alerte mène à sa cause.** Créer la situation, vérifier que l'alerte
  apparaît, et que l'objet lié est bien celui qui l'a causée.
- **Une alerte ne disparaît pas d'elle-même.** Résoudre la cause fait disparaître
  l'alerte ; ne pas la résoudre ne la fait pas disparaître. Test de propriété.
- **Un conflit ouvert est visible du point de vue du chef**, pas seulement d'un
  écran technique. C'est un test spécifique et il compte : c'est la garantie que
  la réconciliation ne peut pas être oubliée.
- **Aucune plage tronquée.** Un agrégat calculé sur un grand jeu de données
  inclut tout. Test avec un volume supérieur à ce que le prototype supportait, pour
  prouver que la limite n'existe pas.
- **Le périmètre est exact.** Un chiffre par jour, par réseau et par agent se
  recompose exactement en total. Test d'additivité des filtres.
- **La période est la date de service, pas la date de commande.** Une commande
  passé en fin de mois et servie le mois suivant compte dans le bon mois. Test de
  frontière de période — c'est là que ce genre de rapport se trompe.
- **La fraîcheur est annoncée.** Une figure affichée porte son horodatage ; un
  appareil en retard est signalé.
- **Hors-ligne, un agent voit ses chiffres et sait que ce sont les siens.** Test
  qu'un agrégat partiel n'est jamais présenté comme global.

## Out of Scope

- **Objectifs airtime et taux d'atteinte.** La feuille « Objectif Airtime » du
  prototype **ne contient aucune colonne d'objectif** — uniquement du réalisé
  journalier. L'atteinte ne peut donc pas être calculée tant que la cible
  n'est pas définie. Non traité ici, à trancher avec le client.
- Constructeur de rapports personnalisés, requêtes libres.
- Export CSV, Excel, PDF.
- Envoi programmé de rapports par email ou SMS.
- Prévision, projection, tendance saisonnière.
- Comparaison entre agents au sens d'un classement noté. Les chiffres sont
  affichés, pas convertis en note : un classement crée une hiérarchie que le
  client n'a pas demandée.
- Détection d'anomalies automatique.

## Further Notes

**La suppression de la colonne « coller les clients à la main » est le gain
immédiat de cette spec.** C'est la première chose que le chef va sentir, parce
que c'est une tâche qu'il fait aujourd'hui et qu'il va pouvoir supprimer.

**Ne pas réintroduire de plage fixe, nulle part.** La contrainte « jusqu'à la ligne
201 » vient de l'architecture d'un tableur. Une base de données n'a pas de
dernière ligne. Si une limite de volume est nécessaire pour des raisons techniques,
elle doit être **explicite et signalée** dans l'interface, pas silencieuse.

**Les alertes sont des entités persistantes.** Une alerte qui disparaît quand on
ferme la page n'est pas une alerte, c'est une notification. Ici, ce qui attend une
décision reste listé jusqu'à ce que la décision soit prise. C'est ce qui distingue
un tableau de bord d'une impression d'écran.

**Le point ouvert sur les objectifs airtime.** Le prototype avait une feuille
« Objectif Airtime » dont le nom promet une cible et dont le contenu n'en
contient aucune : uniquement du réalisé journalier agrégé par réseau et par mois.
Il faut donc demander au client ce qu'il vise, et sous quelle granularité — par
réseau et par mois semble être ce que les formules du prototype laissaient
deviner. Tant que ce n'est pas défini, le tableau de bord affiche le réalisé sans
toute comparaison, ce qui reste utile mais ne répond pas à la question « suis-je
bon ? ».

**Sur la performance des agents.** Les chiffres sont affichés, pas convertis en
note. Une fois que les chiffres existent, la tentation d'en faire un classement
sera forte, et c'est une décision qui appartient au chef, pas au logiciel.
