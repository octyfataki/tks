# 05: Mot de passe oublié — accès temporaire ouvert par un administrateur

**What to build:** Un client qui a oublié son mot de passe dépose sa pièce
d'identité **depuis l'application**. Un administrateur voit la demande, et lui
ouvre un accès temporaire qui ne donne accès à rien d'autre qu'au choix d'un
nouveau mot de passe. Dès que le mot de passe est choisi, l'accès temporaire est
révoqué. Tant qu'il est ouvert, l'administrateur voit un avertissement : il ne
laisse pas une porte entrouverte.

C'est le **même circuit** que la validation de la tranche 03 — une pièce, une
procédure, un journal. Pas un second mécanisme.

**Blocked by:** 01 — Le client s'inscrit, et son compte ne peut rien faire ;
02 — L'administrateur se connecte, second facteur obligatoire ;
03 — L'administrateur valide ou refuse un compte client

**Status:** ready-for-agent

- [ ] Aucun parcours de réinitialisation automatique. Le seul chemin passe par un
      administrateur.
- [ ] Le client dépose sa pièce d'identité **depuis l'application**. Si la pièce
      existe déjà pour la validation, c'est **le même artefact** qu'on réutilise —
      pas un second dépôt, pas un second circuit.
- [ ] L'accès temporaire a une **durée courte** et ne donne accès **à rien d'autre**
      qu'à la fonction de choisir un mot de passe. Test : l'accès temporaire tente
      une action métier, et le test attend un refus. C'est le test qui empêche que
      l'accès temporaire devienne une porte dérobée.
- [ ] L'accès temporaire est **révoqué** dès que le nouveau mot de passe est choisi.
- [ ] L'administrateur voit un **avertissement** tant qu'un accès temporaire est
      ouvert.
- [ ] La pièce est **conservée** et reste consultable lors d'une deuxième demande.
      C'est ce qui rend la vérification possible sans que le client fasse un autre
      voyage.
- [ ] L'accès temporaire est journalisé : qui l'a ouvert, sur quelle pièce, quand il
      a été consommé.
- [ ] Un changement de mot de passe effectué **hors-ligne** est propagé comme une
      écriture ordinaire. S'il entre en conflit avec un autre changement effectué
      entre-temps, il part en réconciliation et **n'écrase rien**.
- [ ] L'administrateur technique peut **déverrouiller** un compte bloqué, et voir la
      **raison** du blocage — pour qu'il puisse dire si c'est un vrai problème.