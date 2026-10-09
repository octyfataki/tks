# 01: Le client s'inscrit, et son compte ne peut rien faire

**What to build:** Un client ouvre l'application, s'inscrit avec son numéro de
téléphone et un mot de passe, se connecte, et tombe sur un écran qui lui dit que
son compte attend une vérification et quelle pièce fournir. Il ne peut rien faire
d'autre : pas de dossier, pas de solde, pas de commande — pas même prépayée.

Cette tranche pose aussi le **squelette** : application web installable, base de
données réelle, migrations, CI, et la **couture de test** — couche applicative
exercée contre une vraie base, jamais un mock de persistance. Si cette couture
n'est pas posée ici, les cinq tranches suivantes l'écriront chacune à leur façon
et il faudra la réécrire six fois.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Un numéro de téléphone au format international normalisé et un mot de passe
      suffisent à créer un compte. Aucun email n'est demandé à un client.
- [ ] Le compte créé est `EN_ATTENTE_VALIDATION`.
- [ ] Le numéro de téléphone est **unique comme identifiant de compte**. Une
      seconde inscription avec le même numéro est refusée avec un motif lisible.
- [ ] Un mot de passe trop faible est refusé, et le refus dit pourquoi.
- [ ] **Test : un compte `EN_ATTENTE_VALIDATION` ne peut rien faire.** Le test
      parcourt chaque écran et chaque point d'entrée métier accessible, et attend
      un refus partout. C'est le test qui prouve que l'état est une vraie barrière
      et pas un indicateur affiché.
- [ ] Le client voit **pourquoi** il ne peut rien faire et **quelle pièce**
      fournir. Un écran vide sans explication produit un appel au distributeur, et
      il en verrouillera d'autres.
- [ ] Le compte porte un identifiant généré sur l'appareil et un horodatage local,
      jamais réécrits par le serveur. Une inscription commencée puis interrompue
      reprend au même endroit, y compris sans réseau.
- [ ] La protection anti-force brute existe dès cette tranche : trop d'échecs
      verrouillent temporairement le compte, et la raison du blocage est
      consultable — le déverrouillage arrive en tranche 05.
- [ ] Test navigateur mince : la barrière s'applique **à l'écran**, pas seulement
      en couche applicative.
- [ ] La CI passe : migration, build, tests. Aucun mock de persistance n'existe
      dans le dépôt.

## Comments

- Correctif création (2026-10-09, `feat/s1-01-inscription-client`) : normalisation
  canonique du téléphone (`normaliserTelephoneClient` — espaces/tirets/points/
  parenthèses retirés, `00` → `+`) appliquée à la vérification, au pré-contrôle
  et au stockage — deux écritures du même numéro sont le même compte, la
  seconde inscription est refusée. Idempotence reprise : `id` UUID généré sur
  l'appareil (`sessionStorage`, clé `tks-inscription`), transmis à la server
  action (`inscrireCompteClient`), réutilisé en cas de rejeu. Audit
  `client.inscrire` enrichi (email + téléphone + état). Tests :
  `validation-client.test.ts` (normalisation). Vérifié : 145/145 vitest,
  `tsc --noEmit` et `eslint` sans erreur.
- Reste hors création : test d'intégration contre vraie base (couture spec),
  anti-force brute sur la server action, test navigateur mince, file hors-ligne
  S8/outbox. Écart assumé inchangé : email technique exigé (socle
  `emailAndPassword`), téléphone = clé métier unique.