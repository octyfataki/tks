Status: ready-for-agent

# S3 — Socle : taux de change et modèle monétaire

## Problem Statement

Le prototype Excel ne sait pas compter ce qu'un client doit.

Chaque écriture financière porte **deux colonnes** en double — `Montant dette
CDF` et `Montant dette USD`. Le classeur ne contient **aucun taux de change**.
Résultat : la formule de synthèse du prototype, *Reste à payer = detteCDF +
detteUSD − paiement*, **additionne des francs et des dollars**. Le chiffre
affiché au chef est faux, et il ne le sait pas.

Le prototype ne peut pas non plus représenter la situation réelle du métier : un
client endetté en dollars qui vient solder en francs. Il n'y a qu'une seule
colonne `Paiement effectué`, sans devise. La situation la plus fréquente en RDC
n'est pas modélisable.

Enfin, aucun taux n'existe dans le classeur : il n'y a rien à quoi rattacher une
conversion, et rien pour reconstituer ce qu'un client devait le mois dernier.

## Solution

Un modèle monétaire explicite, avec une seule devise par écriture et un taux
historisé.

- **CDF est la devise pivot.** Tout s'affiche en francs.
- **Chaque créance et chaque paiement porte exactement une devise** (`USD` ou
  `CDF`). Les colonnes en double disparaissent.
- **Un client peut payer en CDF une créance en USD**, et payer une partie en
  chaque devise sur la même période.
- **Le taux est saisi par l'administrateur principal, une fois par jour**, et
  chaque saisie est conservée.
- **Le taux applicable est le taux en vigueur au moment de la consultation, et il
  ne mord que sur les montants en USD.** Une écriture ne porte pas de taux. Un
  montant en CDF ne bouge jamais. Voir ADR-0001.
- **La dette et le reste à payer sont dérivés**, jamais saisis ni modifiés.

## User Stories

### Taux de change

1. As the distributor, I want to record today's exchange rate once, so that every conversion uses the same reference.
2. As the distributor, I want previous rates kept, so that I can reconstruct what a client owed last month.
3. As the distributor, I want to change tomorrow's rate without altering today's entries, so that history stays intact.
4. As the distributor, I want to see who recorded a given rate, so that I trust the figure.
5. As the distributor, I want to see the rate history, so that I can spot an unusual day.
6. As the distributor, I want a day's rate to be recorded once and reused, so that two payments at the same hour give the same result.
7. As the distributor, I want to be warned if I try to record a second, different rate for a day already recorded, so that I don't create an inconsistency.

### Écritures financières

8. As the distributor, I want to record a debt with its currency, so that I record what actually happened.
9. As the distributor, I want to record a payment with its currency, so that I record what actually happened.
10. As the distributor, I want to record a payment in francs against a dollar debt, so that I record what the client actually handed me.
11. As the distributor, I want a single entry to have exactly one currency, so that no arithmetic mixes francs and dollars.
12. As the distributor, I want to be prevented from saving an entry with no currency, so that no orphan amount exists.
13. As the distributor, I want to record a manual debt outside any order, so that I can migrate an old one.
14. As the distributor, I want to know that a manual debt is distinguishable from an order-generated one, so that I can explain it to the client.

### Soldes et restes

15. As the distributor, I want a client's outstanding balance computed automatically, so that I don't calculate by hand.
16. As the distributor, I want to see a client's debts and their payments listed separately, so that I can explain the balance.
17. As a client, I want to see my balance in francs, so that I know what I can pay.
18. As a client, I want to see my balance in dollars too, so that I know what I really owe.
19. As a client, I want to see the exchange rate used for the conversion, so that I can verify it myself.
20. As a client, I want to pay half my debt in francs and half in dollars, so that I can use the cash I actually have.
21. As the distributor, I want the system to tell me the exact amount a client still owes after a mixed-currency payment, so that I stop recalculating.
22. As the distributor, I want the total of all client debts, so that I know my exposure at a glance.
23. As a client, I want the rate's date displayed next to any converted amount, so that I do not compare it against a rate I heard elsewhere.
24. As a client, I want a dollar debt shown in dollars first and in francs second, so that I know it is a dollar debt and not a fixed franc amount.
25. As the distributor, I want to be reminded that a franc payment settles a dollar debt only as of that day, so that I never tell a client he is clear for good.

### Fiabilité et corrections

26. As the distributor, I want to correct an erroneous entry without deleting it, so that the trace of what happened survives.
27. As the distributor, I want a correction to be visible as a correction, so that I know something was adjusted.
28. As the distributor, I want negative amounts prevented, so that no entry can corrupt a balance.
29. As the distributor, I want to see the balance before and after a payment, so that I confirm the effect immediately.
30. As the distributor, I want every balance change to be traceable to a cause, so that no figure appears from nowhere.
31. As the distributor, I want the balance to be correct offline on an agent's phone, so that I can answer a client in the field.

## Implementation Decisions

### Taux de change

- Le taux est une entité à part : une date, une valeur, et l'utilisateur qui l'a
  saisi. Il est **journalisé** comme toute autre écriture.
- Un jour porte **au plus un taux**. Une tentative de réécrire un taux existant
  est refusée ; corriger un taux erroné passe par un taux d'ajustement daté et
  tracé, jamais par une modification.
- Le taux est saisi manuellement. **Aucune récupération automatique** depuis une
  banque centrale : le taux est un taux négocié, donc maîtrisé.
- Le taux du jour est un **paramètre de lecture**, pas une donnée d'écriture. Il
  est résolu au moment du calcul, jamais capturé. Voir ADR-0001.
- Le taux en vigueur est celui de **la date de la consultation**. Il n'est pas
  nécessairement celui du jour : un rapport portant sur un mois passé se lit au
  taux de ce mois-là, sinon il est faux.

### Devises

- Deux devises : `CDF` et `USD`. Une **troisième devise n'est pas prévue**. Voir
  ADR-0002.
- Chaque créance et chaque paiement porte exactement une devise, obligatoire.
- Les colonnes en double du prototype (`Montant dette CDF` / `Montant dette USD`)
  sont **supprimées**, pas conservées sous une forme dégradée.
- La conversion vers CDF est un calcul **dérivé**, jamais une colonne stockée. Une
  valeur convertie stockée diverge de son taux à la première modification du
  taux.

### Dérivés

- **Dette** = somme des créances, chaque montant converti en CDF au taux en
  vigueur.
- **Reste à payer** = dette moins paiements, chaque montant converti en CDF au
  taux en vigueur.
- **Une créance ou un paiement en CDF n'est jamais converti.** Il vaut son
  montant. Un total en USD est la simple somme des montants en USD, sans
  conversion.
- Aucune de ces valeurs n'est stockée. Elles sont recalculées, et recalculables
  hors-ligne avec le taux embarqué.
- Les agrégats sont donc **identiques en ligne et hors-ligne** tant que le taux
  embarqué est le même.

### Taux applicable

- **Une écriture ne porte pas de taux.** Elle porte un montant et une devise, et
  rien d'autre. C'est la règle structurante du modèle monétaire.
- **Le taux n'a de prise que sur l'USD.** Un montant en CDF vaut son montant, hier
  comme demain.
- **Une dette en USD ne peut être close définitivement que par un paiement en
  USD.** Un paiement en CDF règle la position à la date du paiement, et repart dès
  le lendemain. Cette conséquence doit être comprise avant d'écrire la logique de
  recouvrement.
- **La date du taux est affichée** à côté de tout montant converti. Sans elle, un
  client compare avec le taux qu'il a entendu ailleurs et conteste un chiffre
  juste.
- **Une dette en USD n'est jamais présentée comme une dette en francs.** Le
  montant natif passe en premier, son équivalent en francs ensuite. Voir ADR-0001.

### Exemple de référence

Cet exemple est normatif et doit être couvert par un test :

> Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF.
> Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF.
> **Reste à payer : 65 000 CDF.**

### Contraintes offline

- Le taux en vigueur est embarqué dans le paquet local. Un agent hors-ligne
  calcule des soldes avec le taux qu'il a reçu, et l'interface indique
  explicitement **de quelle date est ce taux**.
- Un taux embarqué est **toujours périmé dès le lendemain**. Ce n'est pas une
  anomalie, c'est le modèle : le solde d'un client en USD est une fonction du taux
  du jour. Un agent en zone rurale annonce donc un reste à payer daté, pas un
  reste éternel.
- À la synchronisation, le taux se rafraîchit et les soldes affichés changent.
  **Ce changement n'est pas un conflit** et ne doit pas produire de dossier de
  réconciliation : aucune donnée n'a été écrite en désaccord, seul un paramètre a
  changé. Voir S8.
- Toute écriture financière est réplicable : identifiant généré sur l'appareil,
  horodatage local conservé.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** Aucun mock de persistance. On teste par les soldes et les restes
résultants, jamais par la structure des lignes.

**L'exemple de référence est le test central de cette spec.** Il est écrit une
fois, en entier, tel quel dans le `GLOSSARY.md`, et il doit passer. C'est le
meilleur test de régression qui soit pour un modèle monétaire : il combine trois
cas (dette en USD, paiement en CDF, paiement en USD) et un résultat non trivial.

**Autres tests qui comptent :**

- **Le taux en vigueur, et lui seul** : une créance de 100 USD et un paiement de
  230 000 CDF le 5 janvier, taux 2 300, donnent un reste de 0. Le taux porté à
  2 400 le 10 janvier, le même client doit 10 000 CDF sans avoir rien fait. En
  revanche, une créance de 100 000 CDF et un paiement de 100 000 CDF donnent un
  reste de 0 quel que soit le taux. C'est ce couple de tests qui verrouille
  ADR-0001, et il doit être écrit.
- **Le paiement qui solde pour de bon** : une créance de 100 USD soldée par un
  paiement de 100 USD reste à zéro après un changement de taux, parce que les
  deux bougent ensemble. Le même montant payé en CDF ne solde pas. Ce test dit
  au code ce que le glossaire dit à l'humain.
- **Un jour, un taux** : deux saisies différentes sur la même date sont refusées
  ou journalisées comme ajustement. Jamais la seconde n'écrase la première.
- **L'asymétrie des devises** : un paiement en CDF sur une créance en USD réduit
  le reste en CDF. Le même montant payé en USD ne réduit pas le reste de la même
  façon. C'est exactement le piège du prototype Excel, et c'est un test
  obligatoire.
- **Aucun champ taux sur une écriture** : la table des créances et celle des
  paiements n'ont pas de colonne taux. Le test est structurel et il verrouille
  ADR-0001 mieux qu'un test de valeur, parce qu'il échoue dès qu'on ajoute la
  colonne « pour plus tard ».
- **Rien de dérivable n'est stocké** : la dette et le reste à payer ne sont pas
  des colonnes. Le test est indirect — changer le taux du jour doit faire bouger
  l'affichage sans qu'aucune écriture nouvelle n'ait lieu.
- **Hors-ligne et en ligne donnent le même chiffre** avec le même taux embarqué.
  C'est le test qui garantit qu'un agent en zone rurale n'annonce pas un montant
  faux à un client.
- **Le calcul est correct hors-ligne** : même test, exécuté sur le paquet local
  sans serveur.

**Antériorité** : S2. Une écriture financière est un mouvement de données, donc
elle est journalisée et elle est soumise au contrôle de permission. Le taux de
change en particulier est une écriture métier : il est saisissable uniquement par
l'administrateur principal, et sa saisie est tracée. Cette spec ne définit pas la
couture de test — S1 l'a posée, et elle s'applique ici sans adaptation.

## Out of Scope

- Une troisième devise, ou un niveau de conversion multi-devises.
- Récupération automatique du taux depuis une banque centrale.
- Comptabilisation des gains et pertes de change : le système calcule un solde au
  taux du jour, il ne tient pas une comptabilité en valeur de réalisation.
- Prévision de trésorerie, analyse de change.
- arrondis et modes d'arrondi : une seule règle s'applique uniformément, elle est
  fixée ici et ne varie pas.
- Lettrage d'un paiement sur une créance précise (voir S6, hors périmètre là-bas
  aussi pour l'instant).

## Further Notes

**ADR-0001 est tranché, et l'est dans un sens qui n'était pas celui que la
question posait.** La question posée au client était « le taux est-il figé au
moment du paiement ? ». La réponse a été : *le taux sera le taux actuel
renseigné par l'administrateur*, **applicable que si la dette est en dollars**.

Il ne s'agit donc pas d'un taux figé, mais du taux en vigueur, dont la portée est
restreinte aux montants en USD. Une dette en francs ne bouge jamais. Une dette en
dollars vaut ce que vaut le dollar aujourd'hui.

**La conséquence à annoncer au client, parce qu'elle est commerciale et pas
seulement technique** : une dette en dollars ne peut pas être close définitivement
en francs. Un client qui paie en francs est à jour *à la date de son paiement*, et
le lendemain il ne l'est plus si le taux a bougé. **La seule extinction définitive
d'une dette en USD passe par un paiement en USD.** C'est cohérent avec le métier —
il n'y a pas de contrat en francs, il y a un montant en dollars — mais cela
change ce qu'on peut promettre à un client, et il faut le savoir avant de
construire la logique de recouvrement.

Une version antérieure de cet ADR décrivait un cas hybride, où le paiement restait
imputé à son taux d'origine et la créance était valorisée au taux du jour. Ce cas
a été **abandonné** : il aboutissait à afficher deux chiffres sans dire lequel est
celui qu'on réclame, ce qui ne peut pas fonder une logique de recouvrement.

**Valeur de référence du taux.** Le taux lui-même (~2 300 CDF par USD au moment de
l'interview) n'est pas une décision d'architecture. Il se saisit dans
l'application. Ce qui compte, c'est que la saisie soit unique par jour et
historisée.

**Ce qui n'est pas dans cette spec.** Le plafond de crédit d'un client, qui est un
montant exprimé dans l'une de ces deux devises, arrive en S4. Les mouvements de
trésorerie, qui consomment le taux mais ne sont pas des dettes clients, arrivent
en S7. Cette spec ne construit que le modèle monétaire.
