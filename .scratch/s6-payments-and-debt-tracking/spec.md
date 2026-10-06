Status: ready-for-agent

# S6 — Encaissement et suivi des dettes

## Problem Statement

Le prototype Excel ne sait pas enregistrer un paiement. Sa table
`T_DettesClients` porte une colonne `Paiement effectué` **sur la ligne de la
dette** — et une seule.

Cela rend trois situations réelles **impossibles à représenter** :

1. **Plusieurs paiements sur une même dette.** Un client qui paie trois fois
   ne peut pas être enregistré : une colonne ne contient qu'une valeur.
2. **Paiements en plusieurs devises.** La colonne est unique et sans devise. Un
   client qui paie la moitié en francs et la moitié en dollars n'a aucun moyen
   d'être enregistré.
3. **Un paiement sans rattachement à une dette précise.** L'appartenance est
   implicite, parce que la dette et le paiement vivent sur la même ligne.

Le prototype ne sait pas non plus dire **combien de temps** un client doit, ni
repérer les clients en retard, et sa « Synthèse Dettes » exige de **coller
manuellement la liste des clients en colonne A** pour produire le moindre total
par client.

## Solution

Le **paiement** devient un objet à part entière, à côté de la créance.

- Un paiement porte **un montant, une devise et une date**, et se rattache à un
  client — pas nécessairement à une créance précise.
- Il est **multi-devises par nature** : un client peut solder une dette en
  dollars par des paiements en francs, ou l'inverse.
- Le **taux applicable est le taux en vigueur**, et il ne porte que sur l'USD
  (ADR-0001). Un paiement ne stocke aucun taux.
- Le **reste à payer** est recalculé automatiquement à chaque paiement, et
  l'écran d'encaissement affiche le montant avant et après.
- L'**ancienneté** de chaque créance est calculée et permet de classer les
  clients en retard.
- Rien n'est **supprimé** : une erreur se corrige par une écriture inverse
  tracée.

## User Stories

### Encaisser

1. As the distributor, I want to record a payment against a client, so that their balance decreases.
2. As the distributor, I want to record a payment in francs against a dollar debt, so that I record what was actually handed to me.
3. As the distributor, I want to record a payment in dollars against a franc debt, so that I record what was actually handed to me.
4. As the distributor, I want to record a payment with its date, so that I can enter a payment made earlier.
5. As the distributor, I want to see the client's balance before the payment, so that I confirm I'm starting from the right figure.
6. As the distributor, I want to see the client's balance immediately after the payment, so that I confirm the effect.
7. As the distributor, I want to see how much is left to pay after the payment, so that I know what to chase.
8. As the distributor, I want the remaining amount computed automatically, so that I stop calculating by hand.
9. As the distributor, I want to record several payments on the same debt, so that a client paying in instalments is recorded faithfully.
10. As the distributor, I want a client to overpay, so that I can record an advance that will cover a later order.
11. As the distributor, I want an advance to show as a credit in the client's favour, so that it isn't invisible.
12. As an agent, I want to record a payment at the counter, so that the client sees their balance updated immediately.
13. As an agent, I want to record a payment without a network connection, so that the client isn't kept waiting.
14. As a client, I want to see the amount I paid and the amount I still owe, so that I know where I stand.

### Suivre les dettes

15. As the distributor, I want to see each client's debt and their payments separately, so that I can explain the balance.
16. As the distributor, I want to see how many days a debt has been outstanding, so that I judge urgency.
17. As the distributor, I want to see clients owing more than a given number of days, so that I act on the worst.
18. As the distributor, I want to see the oldest debt per client, so that I know how serious the situation is.
19. As the distributor, I want the total portfolio sorted by amount, so that I know my exposure at a glance.
20. As the distributor, I want to see the total of all client debts, so that I know my overall position.
21. As the distributor, I want to see a client's debt history over time, so that I understand their behaviour.
22. As the distributor, I want to see who has never paid, so that I can stop extending credit.
23. As a client, I want to see my own debt history, so that I can check the distributor's figures against mine.

### Corriger

24. As the distributor, I want to correct an erroneous payment without deleting it, so that the trace survives.
25. As the distributor, I want a correction to be visible as a correction, so that I know the figure was adjusted.
26. As the distributor, I want a correction to restore the previous balance exactly, so that I can fix my mistake cleanly.
27. As the distributor, I want to know who made a correction and when, so that the adjustment is accountable.

## Implementation Decisions

### Paiement

- Le paiement est une entité distincte : client, date, montant, devise, agent ou
  auteur, et **un rattachement optionnel** à une créance précise. **Pas de taux** :
  un montant en CDF vaut son montant, un montant en USD vaut le taux en vigueur.
- **Le rattachement à une créance est optionnel.** Dans la pratique une dette n'est
  pas toujours soldable ligne par ligne : un client rembourse globalement. Le
  système calcule le solde agrégé ; le rattachement précis est une commodité,
  pas le modèle.
- Le **reste à payer est dérivé**, jamais stocké. Invariant 1 du glossaire.
- **Un paiement en francs ne solde une dette en USD que pour la journée.** Un
  client qui solde en francs est à jour *à la date du paiement*, et peut ne plus
  l'être le lendemain. L'écran d'encaissement **le dit**, et propose le montant en
  USD qui solderait pour de bon. Voir ADR-0001.
- **Un paiement en USD solde une dette en USD définitivement.** Les deux bougent
  ensemble, le solde reste à zéro. C'est le seul moyen de clore une dette en USD.

### Avance et surpaiement

- Un paiement supérieur au reste à payer est **autorisé** et crée un **solde
  créditeur**. Ce n'est pas une erreur : un client qui avance 100 000 FC pour une
  dette de 30 000 FC a fait une avance.
- Un solde créditeur **se compense automatiquement** sur la prochaine commande
  crédit.
- Le solde créditeur est **affiché explicitement**, jamais absorbé en silence dans
  un reste à payer à zéro. Un solde créditeur invisible est de l'argent perdu de
  vue.

### Ancienneté

- L'ancienneté est calculée à partir de la **date de la créance**, pas de la
  date du dernier paiement. C'est ce qui distingue « il paie peu et souvent » de
  « il ne paie plus du tout ».
- Chaque créance peut être soldée **partiellement** sans être close : le reliquat
  continue de vieillir.
- Le seuil « en retard de N jours » est **configurable**, pas codé en dur.

### Correction

- **Aucune suppression.** Une correction crée une **écriture inverse** qui
  ramène le solde à sa valeur exacte d'avant. Invariant 9 du glossaire.
- L'écriture inverse est **elle-même journalisée**, avec son motif.
- Le motif d'une correction est **obligatoire**. Une correction sans motif n'est
  pas une correction, c'est une suppression maquillée.
- Les écritures corrigées restent **consultables** et visibles sur l'historique
  du client, marquées comme corrigées.

### Contraintes offline

- Le paiement est **réplicable** : identifiant généré sur l'appareil, horodatage
  local conservé. Aucun taux n'est embarqué, parce qu'aucun n'est stocké.
- Le reste à payer est **calculable localement** à partir des créances et
  paiements embarqués et du taux en vigueur sur l'appareil, dont la date est
  affichée.
- Deux agents enregistrant **en même temps** deux paiements pour le même client
  ne produisent pas de conflit : les deux sont des ajouts indépendants et
  cumulables. C'est le seul cas financier où l'additivité évite le conflit.
- Une **correction**Offline d'un paiement déjà synchronisé produit un conflit si
  un autre agent a modifié le même paiement. Traitement par ADR-0005.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** On teste par les soldes, jamais par la structure des lignes.

**Les tests qui comptent :**

- **Le paiement fractionné.** Un client avec une dette de 100 USD reçoit trois
  paiements. Le reste à payer est exact après chacun. C'est le test principal :
  c'est précisément le cas que le prototype ne pouvait pas représenter.
- **Le paiement multi-devises.** Dette en USD, paiements en CDF puis en USD. Le
  reste est exact. Le test inverse aussi : dette en CDF, paiement en USD.
- **L'exemple de référence du glossaire**, exécuté tel quel : dette 100 USD à
  2 300, paiements de 50 000 CDF et 50 USD, reste 65 000 CDF. Ce test vient de
  S3 et doit continuer à passer : c'est la preuve que S6 n'a pas altéré le modèle
  monétaire.
- **Le taux en vigueur, et lui seul.** Dette de 100 USD, paiement de 230 000 CDF
  le 5 janvier à 2 300 : reste de 0. Taux porté à 2 400 le 10 janvier : reste de
  10 000 CDF, sans action du client. Le même scénario sur une dette de 100 000 CDF
  soldée par 100 000 CDF donne un reste de 0 quel que soit le taux. Ce couple de
  tests verrouille ADR-0001.
- **Le paiement qui solde pour de bon.** Une dette de 100 USD soldée par 100 USD
  reste à zéro après un changement de taux. Le même montant payé en CDF ne solde
  pas. L'écran d'encaissement annonce le montant en USD qui clôt la dette.
- **Le surpaiement crée un solde créditeur**, pas un reste à payer à zéro, et pas
  une erreur. Le test vérifie qu'il est **affiché**.
- **La compensation automatique** : une avance est absorbée sur la commande
  crédit suivante, et le total reste juste.
- **Une correction restaure exactement** le solde antérieur, pas un solde
  approchant. La comparaison est exacte, au centime.
- **Une correction sans motif est refusée.** Le refus est lui-même journalisé.
- **Rien n'est supprimé** : après une correction, le paiement original existe
  toujours, marqué comme corrigé.
- **L'ancienneté se mesure sur la créance, pas sur le dernier paiement.** Un
  client qui paie peu mais souvent n'a pas une dette ancienne. Le test le vérifie
  sur des données construites.
- **Hors-ligne, le reste à payer est identique** avec les mêmes données
  embarquées.
- **Deux paiements concurrents hors-ligne** sur le même client s'additionnent
  sans conflit et le total est juste.

## Out of Scope

- **Les dettes du distributeur envers des tiers.** Le prototype avait une feuille
  « Mes dettes ». Le client n'a pas su dire si ce besoin existe. **Non traité, à
  confirmer.**
- **Lettrage** : affecter un paiement à une créance précise lorsque le client
  rembourse globalement. Le rattachement existe dans le modèle mais aucune
  allocation automatique n'est faite.
- Échéanciers de paiement, plans de remboursement, nanofinance structurée.
- Recouvrement : relances automatiques, SMS de rappel, segmentation des dettes en
  dossiers de recouvrement. Aucun de ces mécanismes n'existe dans le prototype.
- Actualisation des dettes avec pénalités ou intérêts de retard.
- Effets, escompte, lettre de change.
- Rapprochement bancaire des encaissements.
- Suivi du chiffre d'affaires par client sur une période.

## Further Notes

**Le point le plus important de cette spec est le paiement multi-devises.** Il
n'existe pas dans le prototype et c'est le cas dominant en RDC. Tout ce qui suit
en découle : le solde est agrégé après conversion, donc la question « dans
quelle devise le client rembourse-t-il ? » n'a pas de réponse fixe, et il ne doit
pas y en avoir une.

**Le solde créditeur est une décision de conception, pas un cas limite.** Un client
qui avance est un comportement normal dans ce métier. L'absorber en silence dans
un reste à payer à zéro fait disparaître de l'argent de la vue du chef. C'est
pourquoi il est modelisé comme un solde distinct et affiché comme tel.

**L'ancienneté se mesure sur la créance.** C'est un choix qui mérite d'être
explicite parce que l'alternative est naturelle : beaucoup d'implémentations
prennent la date du dernier paiement, ce qui fait qu'un client qui paie
régulièrement une petite somme paraît toujours à jour alors qu'il doit peut-être
depuis un an. Si le client veut l'autre sémantique, c'est un paramètre à changer —
mais il faut savoir que les deux coexistent dans les discours et que le glossaire
en a choisi un.

**Le lettrage est laissé de côté volontairement.** Il est tentant de l'ajouter
maintenant parce que le modèle le supporte. Mais un lettrage automatique
introduit une politique comptable — quelle créance solder en premier — qui n'a pas
été discutée avec le client. Mieux vaut un solde agrégé, exact et discutable, qu'un
lettrage automatique faux mais précis en apparence.
