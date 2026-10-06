# 03: Idempotence, et l'après-bascule — relancer ne crée rien en double

**What to build:** Le premier import a échoué à moitié. On corrige la source, on
**relance** — et rien de déjà importé ne se double. Chaque dette sait de **quel
import** elle vient, on peut **revoir le rapport** après coup, et une dette mal
importée se **corrige** sans se supprimer.

Puis vient le jour d'après : le client se connecte et **retrouve sa dette**, la
dette se **comporte comme toutes les autres**, et on peut expliquer un ancien
chiffre.

**Blocked by:** 02 — L'import — clients, dettes en cours, devise, statut, plafond ;
les tickets S6 (correction par écriture inverse)

**Status:** ready-for-agent

- [ ] **On peut relancer l'import après avoir corrigé la source** (histoire 13),
      sans repartir de zéro. Un import qui interdit la reprise est un import
      qu'on n'ose pas lancer.
- [ ] **Une relance ne duplique rien déjà importé** (histoire 14). C'est le test
      principal : deux passes successives sur la même source produisent **exactement
      le même nombre de clients et de dettes qu'une seule**. Le décompte est
      l'unique façon de le vérifier — une absence d'erreur affichée passerait avec
      un double import silencieux.
- [ ] **L'idempotence est portée par la clé d'origine de la ligne**, identique
      d'une passe à l'autre. Une clé recalculée à partir d'une donnée qui aurait
      changé re-crée tout : le second import ferait alors doublon précisément là
      où on l'attend le moins.
- [ ] **On sait de quel import un montant provient** (histoire 15), et cette
      attribution est consultable. Un chiffre qu'on ne peut pas rattacher à son
      origine ne peut pas s'expliquer.
- [ ] **Chaque import a son rapport consultable après coup** (histoire 12, repris
      ici pour son volet réel), avec sa date, sa source et son décompte. Deux
      rapports d'import se distinguent, et l'on sait lequel a produit quoi.
- [ ] **Un client se reconnaît à sa première connexion** (histoire 16) **et retrouve
      sa dette**, mais la chaîne est complète : il s'inscrit, un administrateur
      valide son compte avec son document d'identité (S1), puis rattache ce compte
      à son dossier existant (S4). À ce moment-là — et pas avant — il voit ce qu'il
      doit. C'est la conséquence directe de la règle « aucun compte n'est importé » :
      la dette existe depuis la bascule, la **visibilité** du client attend sa
      validation. C'est le moment où l'import cesse d'être une opération technique.
- [ ] **Une dette importée se comporte comme toute autre dette** (histoire 17) :
      encaisser dessus, la fractionner, la corriger, la voir vieillir. Un cas
      « importé » particulier serait un cas qu'aucun test d'usage quotidien ne
      couvrirait — et il casserait le premier jour où l'on encaisserait.
- [ ] **Une dette importée se corrige comme toute autre** (histoire 18), par
      écriture inverse et motif obligatoire. Pas de suppression, pas d'exception.
- [ ] **On sait quelles dettes existaient avant l'application** (histoire 19),
      pour expliquer un ancien chiffre à un client. C'est la réponse directe à la
      contestation : « vous me réclamez ça depuis avant ? » doit pouvoir se
      résoudre par une lecture.
- [ ] **La migration ne demande pas l'historique des ventes** (histoire 20) —
      l'interview a tranché. Ce refus est une **décision écrite**, pas un oubli :
      il reviendra, et la raison doit être retrouvable. On importe l'état des
      dettes, pas l'activité passée.
- [ ] **Aucune dette importée n'est modifiée en silence** lors d'une relance. Une
      relance qui réécrirait un montant déjà importé effacerait le geste d'origine
      sans trace — et le distributeur ne le verrait pas.
- [ ] **Un montant déjà importé se corrige, il ne se recrée pas.** La correction
      est une écriture inverse, la même mécanique que partout ailleurs : un seul
      mécanisme de correction dans tout le système.
- [ ] **Une relance hors-ligne est impossible** : l'import touche la source et le
      serveur, il n'a pas de file locale. Ne pas lui inventer une file — une
      opération de bascule qui se joue sans réseau ne se réconcilie pas. Cette
      absence est assumée, et elle ne contredit pas l'offline-first, qui est une
      règle de **travail de terrain**.
- [ ] **La bascule complète est journalisée** : qui, quand, quelle source, quel
      décompte. Invariant 5 — une opération qui déplace de l'argent des livres
      doit laisser une trace consultable.
- [ ] L'import exige **`dossier.creer`** et la correction d'une dette importée
      **`ecriture.corriger`**, déjà déclarées dans la liste fermée de S2.
- [ ] Test navigateur mince : le rapport de relance se superpose au précédent, et
      un client importé montre son dossier, son statut et sa dette au premier
      écran.
