Status: ready-for-agent

# S1 — Socle : authentification et identité

> Cette spec répond à une seule question : **qui es-tu ?**
> La question suivante — **qu'as-tu le droit de faire ?** — est en S2.
> La séparation est délibérée : l'authentification est une mécanique, les rôles
> sont une politique, et les deux n'ont pas les mêmes contraintes.

## Problem Statement

Le prototype Excel n'a **aucune notion d'utilisateur**. Le classeur s'ouvre sans
rien : quiconque l'ouvre peut modifier n'importe quelle dette, n'importe quel
solde, n'importe quel client. Il n'y a ni compte, ni mot de passe, ni trace.

Appliqué à une application qui, elle, tourne sur un téléphone partagé entre
plusieurs agents, dans la rue, sur des données financières. Trois conséquences
immédiates :

1. **Aucune action n'est attribuable.** Si un client conteste une dette, il n'y a
   aucune preuve de qui l'a inscrite. C'est le premier problème, parce qu'il rend
   tout le reste contestable.
2. **Le téléphone est un secret partagé.** En pratique, un agent passe son
   téléphone au collègue ou le laisse sur la table du comptoir. Sans comptes,
   la frontière entre les deux n'existe pas.
3. **Un départ ne se gère pas.** Quand un agent quitte l'entreprise, il n'y a rien
   à révoquer, parce qu'il n'y a rien à révoquer.

Et le prototype ne sait rien faire des quatre gestes d'identité du métier :
l'invitation d'un agent, l'inscription d'un client, la **validation** de ce client
par quelqu'un qui le connaît, et la reprise d'un compte après perte du mot de
passe.

Un point de vocabulaire, parce que c'est là que les erreurs se paient : un
**compte** est une connexion, un **dossier** est une fiche financière. Ce ne sont
pas les mêmes objets et ils ne doivent pas être confondus. Une application qui
n'a qu'un seul « client » partout confond les deux, et c'est ainsi qu'un compte
fourni avec le numéro de téléphone de quelqu'un d'autre finit par afficher la
dette de ce quelqu'un d'autre.

## Solution

Des comptes réels, avec une identité vérifiable et un cycle de vie de session
qui tient debout **sans réseau**.

- Trois façons d'entrer, adaptées à trois populations : l'administrateur par
  email, le client par **numéro de téléphone**, l'agent par **lien
  d'invitation**.
- **Un compte client n'est jamais utilisable avant d'avoir été validé par un
  humain.** L'inscription crée une connexion **en attente**, qui ne peut rien
  faire — pas voir de dossier, pas voir de solde, pas commander. Valider exige
  qu'un administrateur ou un agent voit une pièce d'identité, et l'action est
  journalisée.
- **Un compte n'est pas un dossier.** Le numéro de téléphone est la clé du compte,
  **jamais** celle du dossier financier. Le lien entre les deux est établi par un
  humain, et un dossier ne se désigne jamais par son seul numéro.
- L'accès des agents passe par un **lien d'invitation à durée de validité** et à
  usage unique : le distributeur n'a pas de fiche à saisir, et un lien envoyé à
  un ancien employé cesse de fonctionner de lui-même.
- Une réinitialisation de mot de passe **par un administrateur**, conditionnée à
  la production d'une pièce d'identité, parce que beaucoup de clients n'ont pas
  d'email et que le SMS n'est pas disponible.
- **2FA optionnelle pour tous** (issue #3, évolution validée) : chaque compte
  `VALIDE` — administrateur principal, administrateur technique, agent de
  service, client — active son second facteur depuis sa page profil, par code
  à usage unique SMS ou email. Sans facteur actif : mot de passe seul.
- Une **session locale à durée de vie bornée**, qui survit à une coupure réseau
  mais **expire quand même**. Ce n'est pas une session infinie.

## User Stories

### Administrateur principal

1. As the distributor, I want to sign in with my email address, so that I have a stable identifier.
2. As the distributor, I want a second factor in addition to my password, so that a stolen password cannot empty my treasury.
3. As the distributor, I want to name the phones or apps allowed to carry my second factor, so that I control what is registered.
4. As the distributor, I want to replace a second factor I lost, so that a broken phone doesn't lock me out permanently.
5. As the distributor, I want to create an agent account by sending an invitation link, so that I don't fill in a form on their behalf.
6. As the distributor, I want to choose how long an invitation stays valid, so that it works for my recruitment pace.
7. As the distributor, I want an invitation to stop working the moment it has been used, so that the person I sent it to is the only one who registers with it.
8. As the distributor, I want an expired invitation to fail visibly, so that I know to send a new one.
9. As the distributor, I want to see who created each account, so that I can trace how my organisation grew.
10. As the distributor, I want to revoke an agent's access instantly, so that someone leaving today loses access today.
11. As the distributor, I want to reset a forgotten password on behalf of a client, so that they are not permanently blocked.
12. As the distributor, I want to see the identity document a client produced before resetting their password, so that I can verify before granting.
13. As the distributor, I want to be warned when I open a temporary reset access, so that I remember to close it.

### Agent de service

14. As an agent, I want to register myself through an invitation link, so that I don't need an administrator to create my account.
15. As an agent, I want my registration to ask only for what I need to work, so that I'm ready in under a minute.
16. As an agent, I want to choose my own password rather than be given one, so that I remember it.
17. As an agent, I want my session to survive a network cut, so that I don't lose what I was doing.
18. As an agent, I want my session to survive closing and reopening the app, so that I can work a whole day.
19. As an agent, I want to be told when my session is about to expire, so that I can reconnect before it does.
20. As an agent, I want to know how long my session will last, so that I can plan a day of work without surprises.
21. As an agent, I want to find out my session has been revoked as soon as I reconnect, so that I don't keep working on a dead account.
22. As an agent, I want my work queued while offline to be sent when I reconnect, so that a revoked access doesn't discard what I did.

### Client

23. As a client, I want to register myself, so that I can order without coming in person.
24. As a client, I want to register with a phone number and a password, so that I don't need an email address.
25. As a client, I want my phone number to be my identity, so that I don't need to remember another login.
26. As a client, I want to know what to do if I forget my password, so that I'm not permanently blocked.
27. As a client, I want to prove my identity to recover access, so that nobody else can take over my account.
28. As a client, I want to submit my identity document from the app, so that I don't have to make a trip.
29. As a client, I want to recover my account without waiting days, so that I can order again quickly.
30. As a client, I want to see only my own data, so that I don't see other clients' debts and balances.
31. As a client, I want to be told my account is waiting for validation, so that I understand why nothing happens yet.
32. As a client, I want to be able to order once my account has been validated, so that the wait is worth it.
33. As a client, I want to know which document is needed to be validated, so that I finish the process in one trip.
34. As the distributor, I want to validate a client account after seeing an identity document, so that only real customers get a working account.
35. As the distributor, I want to refuse a client account with a reason, so that the client knows what to fix.
36. As the distributor, I want to see which accounts are waiting validation and for how long, so that no customer is left hanging.
37. As the distributor, I want a validated account to be linked to the right client file, so that the right person reaches the right balance.
38. As an agent, I want to validate a client account at the counter, so that a first-time customer is not turned away.
39. As the distributor, I want to know who validated each client account, so that a bad validation is traceable.

### Administrateur technique

40. As the developer, I want a technical administrator account, so that I can diagnose problems users report.
41. As the developer, I want to unlock an account that someone has locked themselves out of, so that I can help without a manual reset.
42. As the developer, I want to see why an account was locked, so that I can tell whether it's a real problem.

## Implementation Decisions

### Modes d'entrée

| Population | Identifiant | Second facteur |
| ---------- | ----------- | -------------- |
| Administrateur principal | email + mot de passe | **optionnel**, code à usage unique par SMS ou email |
| Administrateur technique | email + mot de passe | **optionnel**, code à usage unique par SMS ou email |
| Client | **numéro de téléphone** + mot de passe | **optionnel**, code à usage unique par SMS ou email |
| Agent | lien d'invitation, puis email + mot de passe | **optionnel**, code à usage unique par SMS ou email |

- Le **numéro de téléphone est l'identifiant unique du compte client**, et
  l'identifiant du compte est unique. Il **n'est pas** la clé du dossier client :
  un numéro de téléphone peut légitimement servir plusieurs dossiers. Voir
  « Compte et dossier » ci-dessous, et S4 pour le dossier lui-même.
- L'agent choisit son email au moment de s'inscrire. Le lien d'invitation fixe le
  rôle, pas l'identifiant.
- **Aucun SMS n'est envoyé à l'inscription client.** La vérification du numéro
  passe par la **validation** humaine, pas par un code (voir « Compte,
  validation et dossier »). Le SMS sert au second facteur optionnel
  (issue #3), jamais à l'inscription.
- **Aucune vérification de numéro par code à l'inscription client.** Elle n'est pas
  nécessaire, parce que la protection n'est pas le code : c'est la **validation**.
  Voir « Compte, validation et dossier ».

### Compte, validation et dossier

Trois choses distinctes. Les confondre est exactement ce qui fait qu'un client
peut lire la dette d'un autre.

- **Un compte est une connexion.** Numéro de téléphone et mot de passe. Il peut
  exister seul.
- **Une validation est une décision humaine** : « cette personne est bien un
  client, je l'ai vérifiée ». Elle porte sur le compte, pas sur un montant.
- **Un dossier est une fiche financière.** Nom, adresse, créances, plafond,
  statut. C'est le seul endroit où vit de l'argent.

#### Les états du compte client

| État | Signification | Ce que le client peut faire |
| ---- | ------------- | ---------------------------- |
| `EN_ATTENTE_VALIDATION` | inscrit, personne ne l'a encore vérifié | rien, sinon lire son état et se déconnecter |
| `VALIDE` | un humain a vérifié une pièce d'identité | commander, voir son dossier **si** il est rattaché |
| `REFUSE` | refusé, avec un motif | lire le motif ; le distributors peut valider plus tard |
| `REVOQUE` | plus jamais utilisé | rien |

- **L'inscription crée un compte `EN_ATTENTE_VALIDATION`.** Aucun dossier, aucune
  créance, aucun solde, aucune commande — **pas même prépayée**. Un compte non
  validé ne fait rien du tout.
- **Valider exige une pièce d'identité.** Il n'existe aucun chemin dans
  l'application qui crée un compte `VALIDE` sans que quelqu'un ait vu un document.
  C'est la contrainte structurante de cette partie de la spec, et elle doit être
  vérifiée par un test qui tente de s'en passer.
- **Valider et rattacher sont deux décisions, mais un seul geste.** Quand
  l'administrateur valide un client qui existe déjà au classeur, il choisit le
  dossier dans la même action. Les deux décisions restent **attribuables séparément**
  dans le journal, parce que le risque n'est pas le même : une validation fausse
  donne un compte à un inconnu, un rattachement faux montre une dette à quelqu'un
  d'autre.
- **Un dossier n'est jamais choisi par le numéro de téléphone seul.** La recherche
  affiche nom, adresse et solde ; confirmer demande de désigner le dossier par son
  **nom**. Un agent qui se trompe de numéro ne valide donc pas le mauvais client.
- **Un compte porte au plus un dossier, un dossier porte au plus un compte.** La
  relation est 1:1. Un client qui perd son téléphone réinscrit un compte, l'ancien
  est révoqué, et le dossier est rattaché au nouveau.
- **Valider et rattacher sont journalisés** : qui, quand, quel compte, quel
  dossier, quelle pièce d'identité vue. Une validation ou un rattachement
  frauduleux doit être détectable, et **défaisable**.
- **Un agent peut valider**, si le distributeur lui a donné la permission. Le
  défaut reste zéro permission (S2). C'est ce qui permet de ne pas refuser un
  client de première visite au comptoir.
- **Le client `EN_ATTENTE_VALIDATION` voit pourquoi il ne peut rien faire**, et ce
  qu'il doit fournir. Un écran vide sans explication produit un appel au
  distributeur, et il en verrouillera d'autres.
- **Ce que la spec ne décide pas** : qui valide en masse les comptes des clients
  déjà connus au moment du déploiement. C'est une charge de bascule, pas une
  décision de modèle. Voir « Further Notes ».

### Invitations

- Un lien d'invitation porte un jeton **à usage unique** et une **date
  d'expiration** choisie par l'administrateur principal.
- Le lien ne peut créer qu'un compte `AGENT`. Il ne permet pas de choisir un rôle
  au moment de s'inscrire : le rôle est fixé par le lien.
- Un lien expiré ou déjà utilisé ne fonctionne plus, et **l'échec est journalisé**
  (S2).
- La date d'expiration est choisie par l'administrateur principal. Une valeur par
  défaut existe, configurable, appliquée aux liens sans échéance explicite.

### Cycle de vie de la session — la décision que le prototype ne pouvait pas poser

C'est le point le plus structurant de cette spec, parce que **l'agent travaille
hors-ligne par définition**. Une session pensée pour un site web — valable
quelques heures, renouvelable en ligne — est ici un défaut : elle expire au
mauvais moment, au milieu d'une journée de terrain.

Deux forces se disputent :

- **Le terrain** veut une session longue. Un agent qui doit se reconnecter chaque
  matin est un agent qui perd du temps.
- **La sécurité** veut une session courte. Le téléphone d'un agent est le seul
  point d'entrée vers la trésorerie, et il se perd, se vole, se prête.

La décision est de **ne pas choisir un camp**, mais de rendre les deux fins
possibles et de les rendre **visibles** :

- **Deux notions distinctes**, jamais confondues :
  - l'**expiration de session** est **temporelle**. Elle expire au bout d'un
    délai, que le réseau soit là ou non.
  - la **coupure réseau** n'expire rien. C'est une indisponibilité de la
    connectivité, pas une perte de droits.
- La **durée de vie de la session locale est configurable**, et **bornée**. Elle
  n'est pas infinie, et pas en années. Ordre de grandeur retenu : **quelques
  jours** pour un agent, plus long pour un client qui commande rarement.
  Passer au-delà transforme le téléphone perdu en incident financier.
- L'agent voit **en permanence la date d'expiration de sa session** et reçoit un
  avertissement avant l'échéance, pour se reconnecter au moment choisi plutôt que
  de subir une coupure.
- **Le secret de session est conservé sur l'appareil**, dans le stockage le plus
  protégé que la plateforme offre au navigateur. Une PWA n'a pas de trousseau
  système fiable ; on ne prétend pas le contraire, on utilise ce qui existe et on
  le déclare dans les exigences de sécurité.
- **La révocation est effective à la synchronisation**, jamais avant. Un appareil
  déjà hors-ligne dont la session n'a pas expiré peut encore écrire localement.
  Ces écritures sont **conservées** et produisent un **conflit** à la
  synchronisation, traité par ADR-0005. Elles ne sont jamais perdues, et jamais
  appliquées en silence.
- **Conséquence assumée** : un téléphone volé reste utilisable hors-ligne jusqu'à
  l'expiration de la session. C'est la contrepartie directe de l'offline-first. La
  parade opérationnelle est de **révoquer le compte et le signaler à l'agent**,
  pas d'espérer que la révocaion coupe l'accès instantané.

### Réinitialisation de mot de passe

- Aucun parcours de réinitialisation automatique.
- Le client contacte un administrateur, fournit **une pièce d'identité** depuis
  l'application, et l'administrateur lui ouvre un **accès temporaire limité à la
  seule fonction de choisir un nouveau mot de passe**.
- La pièce d'identité est **conservée** sur la fiche client. C'est ce qui rend la
  vérification possible lors d'une deuxième demande.
- L'accès temporaire a une **durée de validité courte** et ne donne accès à rien
  d'autre. Il est **révoqué** dès que le nouveau mot de passe est choisi.
- L'administrateur voit un **avertissement** tant que l'accès temporaire est
  ouvert, pour ne pas laisser une porte entrouverte.

### Contraintes offline

- Compte, invitation, choix de mot de passe et événement d'audit sont
  **réplicables**. Ils portent un identifiant généré sur l'appareil et un
  horodatage local qui ne sont jamais réécrits par le serveur. Aucun identifiant
  n'est attribué par la base.
- Une **invitation acceptée hors-ligne** est valide. La consommation du jeton se
  fait de façon **idempotente** à la synchronisation : un même jeton présenté deux
  fois ne crée pas deux comptes.
- Un **changement de mot de passe effectué hors-ligne** est propagé comme une
  écriture ordinaire. S'il entre en conflit avec un autre changement effectué
  entre-temps, il part en réconciliation (ADR-0005) et **n'écrase rien**.

## Testing Decisions

**La couture principale est la couche applicative, exercée contre une vraie base
de données**, jamais contre un mock de persistance. C'est ici qu'elle est posée
pour tout le projet. On vérifie ce qui est observable — le compte créé, l'accès
accordé, l'échec refusé — jamais l'état interne.

**Les tests qui comptent :**

- **Un agent sans permission est le test du partage de téléphone.** Un compte
  existe, la session fonctionne, et pourtant il ne peut rien faire. C'est le test
  qui prouve que l'authentification et l'autorisation sont deux choses distinctes,
  et c'est ce qui justifie la scission de cette spec en deux.
- **L'expiration d'un lien d'invitation** se vérifie par le fait qu'un lien expiré
  ne crée pas de compte et que l'échec est journalisé. Le test injecte
  l'horodatage, il n'attend pas.
- **L'usage unique** : un même jeton présenté deux fois ne crée pas deux comptes.
  Testé deux fois, dont une fois hors-ligne puis à la synchronisation — c'est le
  cas réel.
- **La révocation** se vérifie par le refus du jeton précédemment valide, et par
  le fait que les écritures déjà présentes dans la file locale sont **conservées**
  et non supprimées. Le test compte les écritures avant et après.
- **Le 2FA** se vérifie par le refus d'accès sans second facteur, jamais par l'état
  interne du secret. Le remplacement d'un second facteur perdu est testé de bout en
  bout, parce que c'est le chemin qu'on utilise quand ça casse.
- **La session hors-ligne** : session ouverte en ligne, coupure réseau simulée,
  usage prolongé, session **toujours valide**. C'est le test qui valide la
  distinction expiration/coupure.
- **L'expiration de session** : on avance l'horodatage au-delà de la durée, la
  session est refusée, et **l'agent est averti avant** — pas découvert après coup.
- **Le mot de passe oublié** : l'accès temporaire n'ouvre **que** la fonction de
  choisir un mot de passe. Le test tente une commande métier avec, et attend un
  refus. C'est le test qui empêche que l'accès temporaire devienne une
  porte dérobée.
- **La pièce d'identité** est conservée et consultable lors d'une deuxième
  demande.
- **Le compte non rattaché ne voit rien.** Un compte existe, la session fonctionne,
  et le test vérifie trois refus : pas de solde, pas d'historique, pas de commande
  crédit. C'est le test qui prouve que la séparation compte / dossier tient.
- **Le rattachement donne accès, et il est tracé.** Un compte rattaché voit le
  dossier, et le journal contient qui a rattaché quoi, quand et sur quelle pièce.
  Un rattachement ne peut pas être fait deux fois sur le même compte.
- **Le compte lié à un mauvais dossier se détecte.** Un client signale qu'il ne
  voit pas sa dette : il faut pouvoir lister les rattachements faits récemment et
  les défaire. Ce test garantit qu'une erreur de rattachement est réparable.

**Trois tests qui verrouillent la validation, et qu'il ne faut pas escamoter :**

- **Un compte non validé ne fait rien.** Aucun dossier, aucun solde, aucune
  commande, **ni prépayée ni crédit**. Le test parcourt chaque écran accessible et
  attend un refus partout. C'est le test qui prouve que `EN_ATTENTE_VALIDATION` est
  une vraie barrière, et pas un simple indicateur affiché.
- **On ne peut pas valider sans pièce d'identité.** Le test tente la validation par
  tous les chemins disponibles — écran, puis appel direct de la couche applicative
  — et attend un refus à chaque fois. Une validation sans document doit être
  **impossible à produire**, pas seulement masquée dans l'interface.
- **Un dossier n'est jamais désigné par son seul numéro.** Un compte validé attend
  une désignation explicite du dossier par son nom. Le test vérifie qu'aucun
  raccourci « rattache au dossier de ce numéro » n'existe, parce que c'est
  exactement le raccourci qui montre la dette d'un client à un autre.

**Deuxième couture, mince** : un parcours navigateur par profil, traversant
l'interface réelle, pour prouver que le contrôle d'accès s'applique à l'écran et
pas seulement en couche applicative.

**Antériorité** : aucune. C'est le premier socle du projet.

## Out of Scope

- **La question « qu'as-tu le droit de faire ? »** : rôles, permissions, héritage
  et journal d'audit sont en **S2**.
- **La fiche financière du client** : nom, adresse, plafond, statut, pièce
  d'identité. Ce sont le **dossier client** et le **rattachement**, en **S4**.
- Authentification par SMS ou par OTP, sous toute forme.
- OAuth avec Google, Facebook ou autre fournisseur d'identité.
- Vérification de numéro par code à l'inscription client.
- Récupération de mot de passe par email.
- Photo de profil, changement d'email, changement de numéro par l'utilisateur.
- Authentification à deux facteurs **obligatoire** pour qui que ce soit
  (optionnelle pour tous depuis l'issue #3 ; le retrait ci-dessous ne porte
  que sur l'obligation).
- SSO d'entreprise.
- Chiffrement de bout en bout des échanges.
- Multi-distributeur.

## Further Notes

**Un compte client non validé ne peut rien faire. C'est une décision du client, et
elle a un prix qu'il faut nommer.**

Le client a demandé que les comptes de client soient vérifiés et validés par un
administrateur au moment de la création. La spec l'applique ainsi : l'inscription
crée un compte `EN_ATTENTE_VALIDATION`, et **ce compte ne peut rien faire** — pas
voir de dossier, pas voir de solde, pas commander, **pas même en prépayé**. Il
faut qu'un humain voie une pièce d'identité avant qu'il devienne un compte
utilisable.

C'est plus strict que ce qui était écrit quelques lignes plus haut, où un compte
non rattaché pouvait encore commander en prépayé parce qu'il payait avant de
consommer. Cette tolérance a été retirée : elle reposait sur l'hypothèse que la
personne qui s'inscrit est un vrai client, et c'est précisément ce qui n'est pas
encore établi.

**Ce que ça achète.** Un compte ne peut pas exister pour quelqu'un qui n'a jamais
été vu. Le risque du compte fantôme — créé avec le numéro d'un vrai client pour
commander du crédit — disparaît, et il disparaît sans code SMS.

**Ce que ça coûte, et qui doit le porter.** Un client qui découvre l'application
ne peut rien faire tant qu'un humain n'est pas passé. Si ce humaine met trois
jours, le client aura essayé une fois et sera retourné au carnet. **La fluidité de
la validation est donc une exigence de conception, pas un détail d'ergonomie.** Un
agent doit pouvoir valider au comptoir, et le distributeur doit voir la file des
comptes en attente avec leur ancienneté. Si ces deux écrans n'existent pas, la
décision est correcte et le produit est mort.

**La bascule du déploiement est le vrai coût.** Les clients existants sont déjà
dans le classeur, sans compte. Chacun a besoin d'un compte validé avant de
pouvoir servir son dossier. Le nombre est inconnu, et le mode de bascule — valider
en masse par le distributeur, ou à la première visite — **n'est pas décidé**. Ce
n'est pas une question technique : c'est une question de charge de travail et de
risque, et c'est au client d'y répondre.

**La validation et le rattachement restent deux décisions.** Valider dit « cette
personne est un client ». Rattacher dit « cette personne est *ce* client ». Le
risque n'est pas le même : une validation fausse donne un compte à un inconnu, un
rattachement faux montre une dette à quelqu'un d'autre. D'où la règle qu'un
dossier ne se désigne **jamais par son numéro de téléphone seul**.

**La question du SMS est close, et ce n'est plus le trou de cette spec.**

Elle l'a été parce que le vrai problème n'était pas le SMS. Il était écrit dans
cette spec sous une forme qui passait inaperçu : le numéro de téléphone était à la
fois la clé du compte **et** la clé du dossier financier. Sans vérification de
numéro, un compte créé avec le numéro d'un client atterrissait dans son dossier —
il lisait son solde, son historique, et commandait du crédit à son compte.

Un code SMS par message aurait refermé la porte, mais en ajoutant une attente dans
la file d'attente au comptoir, qui est le moment où la fluidité décide de tout.
La validation par un humain referme la même porte, et elle est même plus stricte.

Si le client déclare un jour que le SMS fonctionne en production, **ce n'est pas
l'inscription qu'il faut rouvrir** : elle est déjà validée par un humain. Il faut
réexaminer la 2FA des administrateurs, et rien d'autre. C'est une amélioration
possible, pas un correctif de sécurité.

**La tension session / sécurité ne se résout pas, elle se rend visible.** Un agent
qui travaille une journée en zone rurale a besoin d'une session qui tient. Un
téléphone d'agent perdu est un accès direct à la trésorerie. Les deux sont vrais.
D'où les trois décisions : expiration temporelle bornée, coupure réseau sans
effet, et **révocation qui ne peut agir qu'à la synchronisation** — avec
l'assumption explicite qu'un téléphone volé reste utilisable hors-ligne jusqu'à
l'expiration. Une session infinie rendrait le vol de téléphone aussi grave qu'une
faute de l'administrateur principal ; c'est pour ça que la durée est bornée.

**Pourquoi ne pas mettre les rôles ici.** Parce que l'authentification est une
mécanique : elle répond à « qui es-tu » et se teste par ce qu'elle ouvre ou
refuse. Les rôles sont une politique : ils répondent à « qu'as-tu le droit de
faire », se configurent par l'administrateur principal, et changent sans que rien
dans le code bouge. Les mélanger produisait une spec où chaque décision devait
être attribuée à l'une des deux questions, et laBoundary devenait floue — comme
le montre le test du téléphone partagé, qui est précisément le test où les deux
questions se répondent l'une par l'autre.