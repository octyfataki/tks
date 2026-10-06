# 05: Servir — une créance, jamais deux

**What to build:** L'agent ouvre sa commande, vérifie le réseau et le montant,
confirme par un geste explicite, et **la commande est servie**. Si elle est de type
`CREDIT`, elle devient **exactement une créance** — pas deux, pas zéro. Si elle est
`PREPAYE`, elle n'en crée **aucune**, parce que l'argent est déjà là. Une commande
servie est **irréversible**.

C'est le point de l'application où l'argent bouge, et c'est ici que le tableau
exhaustif des états est enfin complet.

**Blocked by:** 04 — La file d'attente, et le verrou local ; 03 — La preuve de
paiement ; les tickets S3 (une créance porte une devise)

**Status:** ready-for-agent

- [ ] **Servir une commande `CREDIT` crée exactement une créance.** Pas deux, pas
      zéro. Le test **compte les créances** — invariant 3 du glossaire. C'est le
      test le plus important de S5 : tout le reste du modèle monétaire dépend d'un
      crédit servi qui ne se compte qu'une fois.
- [ ] **Servir une commande `PREPAYE` ne crée aucune créance.** Le test
      symétrique du précédent. On ne réclame pas de l'argent déjà reçu.
- [ ] **Le montant de la créance est le montant figé de la commande**, dans sa
      devise. Aucune relecture de la grille tarifaire au moment du service : le prix
      a été figé à la création, il est consommé ici.
- [ ] **L'agent voit les détails de la commande avant de servir** — réseau, montant,
      unités, client — pour envoyer le bon montant au bon réseau.
- [ ] **La confirmation est un geste explicite.** On ne sert pas par accident, en
      touchant deux fois.
- [ ] **Une commande servie est irréversible.** Test : tentative de retour à
      `EN_FILE` depuis `SERVIE` — **refusée**. C'est la contrepartie de l'irréversibilité
      : le crédit est parti, le renvoyer serait un second envoi.
- [ ] **Une commande annulée ne se sert pas.** Test : tentative de `ANNULÉE` →
      `VERROU` — refusée. Les deux extrémités sont testées dans les deux sens.
- [ ] **Le tableau exhaustif des transitions est vérifié dans cette tranche.** Toutes
      les transitions légales passent, et **chaque** transition illégale échoue.
      Une commande `SERVIE` ne revient jamais en `EN_FILE`. C'est le test central
      de la spec, et il n'est complet qu'ici, parce que c'est ici que la dernière
      transition apparaît.
- [ ] **Le double envoi est détecté et réconciliable.** Deux agents servent la même
      commande hors-ligne : **une** commande `SERVIE`, **une** créance, **un**
      mouvement de trésorerie, plus un **dossier de réconciliation** qui tient les
      deux exécutions (ADR-0005). C'est le test le plus important du projet entier :
      il doit exister, même échouant, avant toute ligne de code de synchronisation.
- [ ] **La commande ne crée pas de trésorerie ici, et c'est écrit pour ne pas être
      improvisé.** Le mouvement de trésorerie correspondant appartient à S7. Cette
      tranche livre la créance et l'état ; le ticket S7 branchera le mouvement de
      trésorerie derrière le même événement « commande servie ». Ne pas inventer un
      compte de trésorerie en attendant — c'est ainsi qu'un modèle devient double.
- [ ] **L'annulation d'une commande `VERROU` est accessible ici**, tracée, et
      terminale. Elle n'était pas atteignable avant le verrou.
- [ ] Servir exige la permission **`commande.servir`** ; annuler,
      **`commande.annuler`**. Un client ne sert **jamais** sa propre commande.
- [ ] **Hors-ligne, la commande atteint le bon état.** Une commande créée **et**
      servie hors-ligne est `SERVIE` à la synchronisation, avec **sa créance, sans
      duplication**. C'est le test qui dit si l'application tient debout sans réseau.
- [ ] Chaque transition est **journalisée** : qui, quand, depuis quel état, vers quel
      état. Une commande qui change d'état sans cause visible est une commande qu'on
      ne peut pas expliquer à un client.
- [ ] Test navigateur mince : le bouton de service n'apparaît que pour un agent
      habilité, et l'état affiché est l'état déduit des événements.