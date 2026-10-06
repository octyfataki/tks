Status: ready-for-agent

# S2 — Socle : rôles, permissions et journal d'audit

> Cette spec répond à deux questions : **qu'as-tu le droit de faire ?** et
> **qu'est-ce qui s'est passé ?**
> La question précédente — **qui es-tu ?** — est en S1.

## Problem Statement

Le prototype Excel n'a ni séparation des pouvoirs, ni traçabilité. Le classeur
s'ouvre sans rien, et **la seule règle d'accès est le droit d'accès au fichier**.

Appliqué à une application où quatre populations aux pouvoirs complètement
différents partagent le même téléphone et le même serveur, cela
produit trois défauts :

1. **Les pouvoirs ne sont pas séparés.** Si tous les agents ont les mêmes droits,
   n'importe lequel peut accorder du crédit à n'importe quel client, modifier un
   plafond, valider une preuve de paiement, ou sortir de l'argent de la caisse.
   Le chef ne le saura jamais, et ne pourra pas le prouver.
2. **Le développeur a trop de pouvoir.** Dès qu'un accès de support existe — et il
   en faut un, sinon personne ne peut aider un utilisateur bloqué — la tentation
   est de donner à cette personne les mêmes droits que le chef. Un support
   technique qui peut déplacer de l'argent n'est plus du support.
3. **Rien n'est tracé.** Une action faite hier par un agent n'a pas d'auteur. Le
   journal d'audit du prototype est une **feuille de calcul qu'on peut éditer**,
   ce qui n'est pas un journal.

Et il n'y a aucun moyen de faire croître l'organisation : dès qu'une personne de
confiance doit accéder au système, il faut soit tout ouvrir, soit refuser.

## Solution

Quatre rôles, des permissions **granulaires et attribuables une par une**, et un
journal d'audit **immuable par la base elle-même**.

- Quatre rôles, et pas un de plus : administrateur principal, administrateur
  technique, agent de service, client.
- Les permissions ne sont **pas** portées par des profils figés : elles sont
  accordées **une par une**, avec un profil prédéfini comme simple raccourci.
- **Zéro permission par défaut.** Tout est une décision tracée.
- L'**administrateur technique n'a aucun pouvoir métier.** Il diagnostique et
  débloque. Il ne déplace pas d'argent, et chaque action de sa part est visible
  par le chef.
- Le **journal d'audit est append-only**, et son immuabilité est garantie par la
  base, pas par l'application.

## User Stories

### Rôles

1. As the distributor, I want one role per person, so that permissions are predictable.
2. As the distributor, I want an agent's role to be fixed at creation, so that nobody promotes themselves.
3. As the distributor, I want to change an agent's role only by revoking and recreating the account, so that the change is unmistakable.
4. As the distributor, I want to see the list of accounts by role, so that I know who holds what.
5. As a client, I want my role to prevent me from reaching the management screens, so that I can't see other clients.

### Permissions

6. As the distributor, I want to grant a specific permission to a single agent, so that a junior agent can't change credit ceilings.
7. As the distributor, I want to revoke a permission from a single agent, so that I can react to a behaviour without revoking their whole access.
8. As the distributor, I want to see which permissions an agent has, so that I know exactly what they can do.
9. As the distributor, I want a new agent to have zero permissions, so that nothing is granted by accident.
10. As the distributor, I want a predefined role profile as a starting point, so that I don't configure permissions by hand for every hire.
11. As the distributor, I want the predefined profile to be a shortcut rather than a constraint, so that I can deviate for one person.
12. As the distributor, I want an agent to be refused an action they lack permission for, so that the boundary is real and not advisory.
13. As an agent, I want to know which permissions I actually have, so that I don't attempt something and get refused.
14. As the distributor, I want to see who changed which permission, and when, so that an escalation is traceable.

### Administrateur technique

15. As the distributor, I want my technical administrator to have no business power, so that a support mistake can't move money.
16. As the distributor, I want to see every action performed on my behalf by a technical administrator, so that I can trust the system.
17. As the developer, I want to read data without being able to change money, so that a mistake of mine cannot move funds.
18. As the developer, I want to be unable to grant myself a permission, so that my access can't creep.
19. As the developer, I want every action of mine traced like everyone else's, so that accountability is uniform.
20. As the developer, I want to see the technical state of synchronisation without seeing business figures, so that I can debug without holding business data.

### Journal d'audit

21. As an administrator, I want every business action recorded, so that nothing happens invisibly.
22. As an administrator, I want the audit journal to be append-only, so that the log itself cannot be falsified.
23. As an administrator, I want to record who acted, in which role, when, and on which record, so that an action is reconstructible.
24. As an administrator, I want the before and after values recorded for a change, so that I can see what moved.
25. As an administrator, I want to record which device acted, so that I can distinguish two agents on two phones.
26. As an administrator, I want to record the local timestamp and the server receipt time separately, so that I can diagnose a synchronisation.
27. As an administrator, I want a failed action recorded as failed, so that the journal isn't a list of successes only.
28. As the distributor, I want to see who acted on any given record, so that I can investigate a discrepancy.
29. As the distributor, I want to be able to reconstruct any given day of activity, so that I can answer a client's questions.
30. As the distributor, I want to filter the journal by actor, by date and by record, so that I can find a specific event.
31. As the distributor, I want to know that no deletion happened anywhere in the system, so that records only ever disappear by a traced reversal.
32. As the distributor, I want the journal to survive the loss of an agent's phone, so that an offlining device doesn't erase its own trace.

## Implementation Decisions

### Rôles

- Quatre rôles, exactement : `ADMIN_PRINCIPAL`, `ADMIN_TECHNIQUE`, `AGENT`,
  `CLIENT`. Aucun rôle supplémentaire. Une personne n'a qu'un rôle.
- Le rôle est **immuable** une fois le compte créé. Changer de rôle se fait par
  révoquer l'accès et créer un nouveau compte, **les deux tracés**. Cette
  contrainte est délibérée : elle rend visible le passage d'une capacité de
  gestion à une autre.
- Le compte `CLIENT` est créé par auto-inscription (S1). Les trois autres sont
  créés par l'administrateur principal, le compte agent par lien d'invitation.

### Permissions

- Les permissions sont **granulaires et indépendantes**, attribuables **une par
  une**. Elles ne sont pas portées par des profils figés.
- Un **profil de rôle prédéfini** existe comme raccourci de configuration. Il
  n'est pas contraignant : l'administrateur principal peut ajouter ou retirer
  n'importe quelle permission à n'importe quel agent, individuellement.
- **Zéro permission par défaut** à la création. Rien n'est accordé
  implicitement. C'est ce qui rend le modèle auditable.
- La liste des permissions est **fermée et définie dans le code**. Elle n'est pas
  modifiable à l'exécution, pour qu'une permission invoquée ne puisse pas
  inexister.
- **Permission par défaut d'une permission non accordée : refus.** L'absence de
  permission vaut refus, jamais « accès libre ». C'est le sens par défaut, et il
  est non négociable.

### Frontière administrateur technique

C'est la décision la plus importante de cette spec, parce qu'elle est
contre-intuitive : on donne à quelqu'un un accès large pour qu'il soit efficace,
et ce même accès est le risque.

- L'administrateur technique dispose des permissions **de lecture sur les
  données métier** et **de diagnostic technique** (état de synchronisation,
  journaux d'erreur, déblocage de compte).
- Il ne dispose d'**aucune permission d'écriture métier** : ni taux, ni plafond,
  ni promotion de client, ni création d'écriture financière, ni mouvement de
  trésorerie.
- **Il ne peut pas s'accorder une permission.** Toute tentative est refusée et
  **journalisée** : c'est précisément le genre d'action qui doit laisser une
  trace.
- Il ne peut ni voir ni modifier les **secrets d'authentification** (S1) : ni mot
  de passe, ni second facteur.
- Tout ce qu'il fait reste **visible par le chef dans le journal**, sans filtre.
  Le contrôle d'accès au journal lui-même ne s'applique pas à ses propres
  actions.

### Journal d'audit

- **Append-only.** Aucune mise à jour, aucune suppression, **à aucun niveau
  d'accès**, y compris technique.
- L'immuabilité est **garantie par la base**, pas par l'application : les droits
  d'écriture sur le journal sont retirés pour tous les rôles, et une contrainte de
  base n'autorise que des insertions. C'est la seule façon de prouver
  que le journal ne peut pas être falsifié — une règle applicative se contourne.
- Enregistré : acteur, **rôle au moment de l'action**, type d'action, entité
  concernée, **valeurs avant et après**, identifiant d'appareil.
- **Deux horodatages distincts** : l'horodatage local de l'appareil, conservé tel
  quel, et l'horodatage de réception serveur. Les deux sont visibles. C'est ce qui
  permet de diagnostiquer une synchronisation, et de savoir qu'une action a été
  faite hors-ligne et quand.
- Une action qui **échoue** est journalisée comme échouée, pas seulement les
  actions réussies. Un refus de permission est journalisé.
- Le journal enregistre aussi les **consultations** de données sensibles par un
  administrateur technique : lire la dette d'un client est une action.

### Contraintes offline

- Tout événement d'audit et toute modification de permission est **réplicable** :
  identifiant généré sur l'appareil, horodatage local conservé.
- Un événement d'audit produit **hors-ligne** est valide et propagé à la
  synchronisation. Il n'est pas recalculé par le serveur.
- Une **modification de permission faite hors-ligne** entre en conflit si une
  autre modification de la même permission a été propagée entre-temps. Traitement
  par ADR-0005 : les deux versions sont conservées, un administrateur tranche. On
  n'écrase pas un retrait de permission par un accord concurrent, ni l'inverse.
- Un journal d'audit local **non synchronisé** reste sur l'appareil. Il n'est pas
  purgé au démarrage : le purger ferait perdre la trace, ce qui est exactement ce
  que le journal sert à empêcher.

## Testing Decisions

**La couture principale est la couche applicative, contre une vraie base de
données.** Elle est posée en S1 et s'applique ici sans adaptation.

**Les tests qui comptent :**

- **L'administrateur technique ne peut pas déplacer d'argent.** Le test le plus
  important de cette spec, parce qu'une régression ici est **silencieuse** : rien
  ne casse, l'écran de support fonctionne, et l'argent a bougé. On tente
  **chaque** écriture métier avec son compte et on attend un refus à chaque fois.
  Une liste de refus, testée.
- **Un agent sans permission ne peut rien faire.** Le symétrique, côté agent. Un
  compte qui s'authentifie parfaitement mais ne peut valider aucune preuve de
  paiement.
- **Zéro permission par défaut.** Un agent créé n'a rien. Le test compte les
  permissions : zéro, et non « les permissions par défaut ».
- **Le profil prédéfini est un raccourci, pas une contrainte.** L'administrateur
  retire une permission d'un agent qui a reçu le profil complet, et l'agent perd
  cette action. Le test vérifie que le profil n'a pas de pouvoir propre.
- **L'absence de permission vaut refus.** Une action non listée est refusée. Le
  test utilise une permission inventée pour prouver que le défaut est « refus ».
- **Le journal est immuable par la base.** On tente une mise à jour et une
  suppression **directement en base**, avec les droits applicatifs, et les deux
  sont rejetées par la base. C'est la seule preuve réelle ; un test qui passe par
  l'application ne prouverait rien, puisque l'application est précisément ce qu'on
  essaie de protéger.
- **Un échec est journalisé.** Une action refusée pour permission manquante laisse
  une ligne, avec son motif. Une action qui échoue pour une raison technique aussi.
- **Les deux horodatages sont distincts et visibles.** Un événement produit
  hors-ligne arrive avec un horodatage local antérieur à son horodatage de
  réception, et les deux sont consultables. C'est le test qui prouve que
  l'horodatage local n'est pas réécrit par le serveur.
- **Le rôle est immuable.** Tenter de modifier le rôle d'un compte est refusé. Le
  seul chemin est révocation + création, et les deux sont journalisées.
- **Un administrateur technique ne peut pas s'accorder une permission**, et la
  tentative est journalisée.
- **Une permission concédante hors-ligne en conflit** produit un dossier de
  réconciliation contenant les deux versions, sans qu'aucune soit appliquée en
  silence. Test conforme à ADR-0005.
- **Le journal survit au redémarrage.** Un agent travaille hors-ligne, l'appareil
  redémarre, les événements d'audit non synchronisés sont toujours là. C'est ce qui
  distingue un journal d'un cache.

**Deuxième couture, mince** : un parcours navigateur par rôle, traversant
l'interface réelle, pour prouver que le contrôle d'accès est appliqué à l'écran et
pas seulement en couche applicative.

**Antériorité** : S1. On a besoin de comptes avant de leur attribuer des droits.

## Out of Scope

- **La question « qui es-tu ? »** : authentification, sessions, invitations,
  réinitialisation de mot de passe et 2FA sont en **S1**.
- Rôles configurables à l'exécution, ou structures d'autorisation définies par
  l'utilisateur (RBAC dynamique, hiérarchies de rôles héritables).
- Autorisations par **objet** : « cet agent ne peut voir que ses propres clients ».
  Le modèle est par permission, pas par ligne. Voir « Further Notes ».
- Multi-distributeur, ni cloisonnement entre entités.
- Journal d'audit exportable, ou signé cryptographiquement.
- Conservation légale du journal, purge, archivage.
- Détection d'anomalies dans le journal, alerte sur une action inhabituelle.

## Further Notes

**La frontière de l'administrateur technique est la décision à faire valider en
premier.** C'est celle qui touche le plus directement l'argent, et c'est celle où
les réflexes vont à l'encontre : on veut aider le support technique, donc on lui
donne de l'accès, donc on lui donne beaucoup. Ici, la ligne est nette : lecture et
diagnostic oui, écriture métier jamais. Si le client trouve ça trop strict, la
question à lui poser n'est pas « combien de droits lui donner » mais « quelles
opérations métier un diagnostic peut-il nécessiter ». La réponse est presque
toujours : aucune.

**L'immuabilité du journal doit venir de la base.** C'est le point technique le
plus important de cette spec et le plus souvent raté. Une règle applicative du
genre « l'application ne modifie jamais le journal » ne prouve rien : elle
suppose que personne n'écrit directement en base, alors que c'est exactement ce
qu'un administrateur technique malveillant ou un script mal écrit ferait. La
preuve se fait par la tentative directe en base, et c'est le test qui doit exister
pour que la promesse soit crédible.

**Le journal enregistre les consultations, pas seulement les écritures.** Lire les
dettes de tous les clients est une action qui laisse une trace. C'est peu
habituel dans un logiciel de gestion, et c'est pourtant ce qui rend la promesse
« mes données ne sont pas consultées en douce » vérifiable. Le coût est
un journal plus volumineux ; le bénéfice est que le contrôle d'accès technique
devient lui-même auditable.

**L'absence de permission vaut refus.** Ce n'est pas une évidence à écrire, mais
c'est le genre de défaut qui s'implante : on code un accès par défaut permissif,
ça marche, et six mois plus tard on ne sait plus qui peut voir quoi. L'écrire dans
la spec, c'est le rendre impossible à contourner sans violer le texte.

**Pas d'autorisation par objet, pour l'instant.** « Chaque agent ne voit que ses
clients » a été discuté lors de l'interview, et la réponse a été : **tous les
agents voient tous les clients**. C'est cohérent avec le mode « caisse » du
comptoir, où l'agent sert la personne qui est en face, pas celle qu'on lui a
attribuée. Un modèle par ligne serait à revoir si ce choix change, car il change la
forme des permission checks.