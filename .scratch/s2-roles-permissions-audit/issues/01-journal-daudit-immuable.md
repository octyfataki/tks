# 01: Le journal d'audit existe et la base le rend immuable

**What to build:** Chaque action métier du système laisse une ligne dans un journal
qu'on ne peut ni modifier ni supprimer — et cette impossibilité vient de la base,
pas de l'application. Une action réussie comme une action refusée y figurent, avec
qui l'a faite, dans quel rôle, sur quel enregistrement, ce qui a changé, depuis
quel appareil, et à deux horodatages distincts.

Ce ticket est **le premier de S2, volontairement**. Un journal qu'on ajoute après
coup se branche mal : chaque action métier a alors été écrite sans lui, et il
faut la rattraper partout. Il est donc posé avant toute permission, et les trois
tickets suivants viennent s'y greffer.

**Blocked by:** the S1 tickets (01 → 06) — il faut des comptes et des actions
réelles à journaliser

**Status:** ready-for-agent

- [ ] **Le journal est append-only, garanti par la base.** Les droits d'écriture
      sur le journal sont retirés pour tous les rôles, y compris technique, et la
      base n'autorise que des insertions.
- [ ] **Le test qui rend la promesse crédible** : on tente une mise à jour et une
      suppression **directement en base**, avec les droits applicatifs, et les deux
      sont rejetées **par la base**. Un test qui passe par l'application ne prouve
      rien, puisque l'application est précisément ce qu'on essaie de protéger.
- [ ] Le journal enregistre : acteur, **rôle au moment de l'action**, type
      d'action, entité concernée, **valeurs avant et après**, identifiant
      d'appareil.
- [ ] **Deux horodatages distincts et visibles** : l'horodatage local de l'appareil,
      conservé tel quel, et l'horodatage de réception serveur. Test : un événement
      produit hors-ligne arrive avec un horodatage local antérieur à sa réception,
      et les deux sont consultables. C'est le test qui prouve que le serveur ne
      réécrit pas l'horodatage local.
- [ ] **Une action qui échoue est journalisée comme échouée**, avec son motif. Un
      refus de permission est journalisé. Un journal qui ne liste que des succès ne
      prouve rien.
- [ ] Le journal enregistre les **consultations** de données sensibles, pas seulement
      les écritures : lire les dettes de tous les clients est une action. Le coût
      est un journal plus volumineux ; le bénéfice est que le contrôle d'accès
      devient lui-même auditable.
- [ ] **Décision à écrire noir sur blanc** : la consultation du journal lui-même
      n'est pas journalisée. Sinon chaque lecture de l'historique en produit une
      nouvelle, et le journal croît en boucle. Le journal se lit donc librement,
      et c'est un choix assumé, pas un oubli.
- [ ] Les événements produits hors-ligne sont **valides et propagés tels quels**,
      jamais recalculés par le serveur.
- [ ] **Le journal survit au redémarrage.** Un agent travaille hors-ligne, l'appareil
      redémarre, les événements non synchronisés sont toujours là. Un journal local
      non synchronisé n'est **jamais purgé** au démarrage : le purger ferait perdre
      la trace, ce qui est exactement ce que le journal sert à empêcher.
- [ ] Un événement du journal porte un identifiant généré sur l'appareil, jamais
      attribué par la base.
- [ ] Les actions déjà existantes sont raccordées : inscription, connexion,
      validation de compte, invitation, réinitialisation de mot de passe. Une
      action métier qui n'écrit pas dans le journal est un défaut de cette tranche.