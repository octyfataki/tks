# 04: Corriger sans supprimer — l'écriture inverse

**What to build:** Un paiement a été saisi à 80 000 au lieu de 8 000. On ne
l'efface pas : on écrit une **écriture inverse** qui ramène le solde à sa valeur
exacte d'avant. L'écriture originale reste, marquée comme corrigée. Le motif est
obligatoire.

Une correction sans motif, ce n'est pas une correction : c'est une suppression
maquillée. Et une correction qui disparaît de l'historique, c'est un historique
qu'on ne peut plus montrer à un client.

**Blocked by:** 01 — Encaisser — un paiement, sa devise, son solde

**Status:** ready-for-agent

- [ ] **Aucune suppression.** Une correction crée une **écriture inverse**.
      Invariant 9 du glossaire. Test structurel : la tentative de suppression
      directe est **rejetée par la base**, pas seulement par l'interface.
- [ ] **Une correction restaure exactement** le solde antérieur — la comparaison
      est **exacte, au centime**, pas approchante. Un solde « à peu près rétabli »
      s'accumule en écart.
- [ ] **Le motif d'une correction est obligatoire.** Une correction sans motif est
      **refusée**, et le refus est lui-même **journalisé** — un refus n'est pas un
      silence.
- [ ] **Une correction est visible comme une correction.** L'administrateur sait
      qu'un chiffre a été ajusté, et de combien. Un historique qui ressemble à un
      historique parce que les corrections sont invisibles n'est pas un historique.
- [ ] **On sait qui a corrigé, et quand.** L'écriture inverse est elle-même
      journalisée, avec son motif. L'ajustement est imputable.
- [ ] **Après une correction, le paiement original existe toujours**, marqué comme
      corrigé. Test : le nombre d'écritures **augmente**, il ne diminue pas.
- [ ] **Les écritures corrigées restent consultables** sur l'historique du client,
      visibles comme telles.
- [ ] **Le même mécanisme corrige une créance**, pas seulement un paiement — une
      dette importée avec un mauvais montant se corrige de la même façon. Un seul
      mécanisme de correction, pas deux.
- [ ] **Une correction hors-ligne d'un paiement déjà synchronisé produit un conflit**
      si un autre agent a modifié le même paiement. Traité par ADR-0005 : premier
      enregistrement gardé, conflit versé à la réconciliation. C'est le seul cas où
      la correction entre en conflit — les ajouts, eux, s'additionnent.
- [ ] Corriger exige **`ecriture.corriger`**, distincte de `paiement.creer` :
      corriger n'est pas écrire, et la distinction permet de retirer l'une sans
      l'autre.
- [ ] Test navigateur mince : le motif est exigé à l'écran, et le refus est affiché
      quand il manque.