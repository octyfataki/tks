# ADR-0005 : Premier enregistrement gagne, réconciliation humaine obligatoire

**Statut** : Accepté
**Date** : 2026-10-06
**Dépend de** : ADR-0003, ADR-0004

## Contexte

Un conflit de synchronisation (ADR-0004) signifie que **le crédit a été envoyé
deux fois**. Ce n'est pas un doublon de données à nettoyer : c'est de l'argent
réellement parti chez le client, deux fois.

C'est ce qui distingue ce système d'une application de gestion classique. Dans
un logiciel de facturation, un conflit d'écriture se résout en gardant une
version. Ici, « garder une version » ne rend pas l'argent.

## Décision

1. **Le premier enregistrement propagé gagne.** L'écriture qui arrive la
   première en base est conservée comme valide.
2. **La seconde n'est jamais écrasée ni ignorée.** Elle est conservée intégralement
   et versée dans un **fichier de réconciliation**.
3. **Aucune réconciliation automatique, dans aucun cas.** Pas de « si les
   montants sont égaux alors on ignore ». La décision est humaine.
4. **L'administrateur doit réconcilier explicitement**, en tranchant contre
   l'opérateur : ce qui a réellement été envoyé, ce qui doit être remboursé,
   ce qui doit être facturé.
5. **Le fichier de réconciliation est permanent** et fait partie du journal
   d'audit. Un conflit résolu reste consultable.
6. **Un conflit ouvert reste visible dans les totaux**, marqué comme à traiter.
   Un administrateur ne doit pas pouvoir manquer un conflit en regardant un
   dashboard.

## Conséquences

**Positives**

- Rien n'est perdu. L'audit raconte exactement ce que les deux agents ont fait.
- L'argent est récupérable, parce que la trace existe.
- La réconciliation est une activité métier réelle, pas un bug : elle mérite
  son écran et son état.

**Négatives**

- Le dashboard doit traiter les conflits comme un état de première classe, pas
  comme une erreur technique à masquer.
- Un administrateur qui ne réconcilie pas laisse des conflits s'accumuler. Il
  faut une alerte sur leur âge, pas seulement leur nombre.
- Un client abusif peut créer artificiellement des conflits pour masquer sa
  propre activité. La réconciliation trace aussi ça.

## Ce que cette décision ne répare pas

Elle **ne prévient pas** le double envoi. Elle rend le double envoi **réparable
et traçable**.

La seule façon de le prévenir est organisationnelle : l'affectation des tâches
avant le terrain (voir ADR-0004, alternative écartée). L'application doit donc
afficher une alerte au chef si des conflits se répètent sur un même client — le
signal d'un problème d'organisation, pas de logiciel.
