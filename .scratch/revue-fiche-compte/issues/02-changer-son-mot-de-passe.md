# 02: Changer son mot de passe depuis la fiche du personnel

**What to build:** Un compte staff validé change son mot de passe depuis sa
fiche : mot de passe actuel, nouveau mot de passe, confirmation. Les autres
sessions sont révoquées au passage. Le parcours est celui de
`auth.api.changePassword` : il n'invente aucun mécanisme, et il n'exige
aucune pièce d'identité — contrairement à la **réinitialisation** d'un mot
de passe staff *oublié*, qui reste hors périmètre et non bouclable
(`.scratch/rearchitecture/plan.md:192`).

Ce n'est pas la récupération par email, qui reste hors périmètre de S1
(`.scratch/s1-authentication/spec.md:360`).

**Blocked by:** 01 — le socle de la fiche

**Status:** ready-for-agent

- [ ] Un compte staff `VALIDE` change son mot de passe depuis sa fiche :
      mot de passe actuel, nouveau mot de passe, confirmation.
- [ ] Un nouveau mot de passe de moins de 8 caractères est refusé, et le
      refus dit pourquoi.
- [ ] Une confirmation différente du nouveau mot de passe est refusée, et le
      refus dit pourquoi.
- [ ] Un mot de passe actuel erroné est refusé ; le mot de passe n'est pas
      changé.
- [ ] Le changement révoque les autres sessions du compte.
- [ ] L'action est refusée pour un compte staff non `VALIDE`.
- [ ] L'ancien mot de passe ne fonctionne plus après le changement ; le
      nouveau fonctionne.
- [ ] La fiche client ne propose pas ce parcours : la fiche client est
      offline-first, un changement hors-ligne relève de S8.
