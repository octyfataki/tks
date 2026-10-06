# 03: La preuve de paiement — téléversée, validée ou refusée, jamais écrasée

**What to build:** Un client commande en ligne, paie par mobile money, et
téléverse la photo de son paiement. **Un administrateur la regarde avant que la
commande entre en file** — sinon on envoie du crédit pour une facture impayée. S'il
la refuse, il écrit pourquoi, le client renvoie une photo, et l'ancienne est
conservée.

C'est le **risque financier numéro un du système** : une capture d'écran falsifiée
suffit aujourd'hui à obtenir du crédit sans payer.

**Blocked by:** 02 — La commande — réseau, unités ou montant, canal, et le plafond
qui bloque

**Status:** ready-for-agent

- [ ] **Seule une commande `PREPAYE` + `EN_LIGNE` exige une preuve.** Une commande
      `PRESENTIEL` **n'en exige pas** : l'agent est témoin de l'encaissement. Deux
      chemins, pas deux paramètres du même chemin.
- [ ] **Une preuve refusée n'ouvre pas la file.** La commande reste en
      `EN_ATTENTE_PREUVE`. Test : tentative de passage en file d'une commande dont
      la preuve est refusée — refusée.
- [ ] **L'administration de la preuve est un geste métier visible**, pas un
      silence : un administrateur **valide** ou **refuse**.
- [ ] **Un refus exige un motif**, obligatoire. Le client sait ce qu'il a à
      corriger.
- [ ] **Le client renvoie une preuve sans recréer la commande.** La commande reste
      la même, son étiquette revient à `EN_ATTENTE_PREUVE`, et elle n'a pas été
      perdue.
- [ ] **Une preuve n'est jamais écrasée.** L'ancienne est **conservée et
      consultable**. Une pièce de paiement disparaît quand on la remplace : on
      conserve.
- [ ] **Compression obligatoire et plafond de taille.** Si la photo est refusée pour
      cette raison, **un message clair** le dit — pas une erreur technique. Le
      téléphone de l'agent n'a pas besoin d'une image de 8 mégaoctets.
- [ ] **On voit qui a validé, et quand.** Une validation frauduleuse est
      tracée. C'est l'application directe du journal de S2 sur le geste le plus
      rentable à falsifier.
- [ ] **Une preuve en attente a un âge.** On voit **combien de temps** elle attend,
      et **combien attendent** — sinon une validation oubliée est une vente
      perdue.
- [ ] **On voit combien de preuves ont été refusées, et pour quoi** — pour
      détecter un motif récurrent : un agent qui explique mal, un client qui
      paie par un canal qui ne produit pas de preuve.
- [ ] **Le client sait que sa preuve a été reçue**, immédiatement. Il ne
      réappelle pas pour rien.
- [ ] Le client peut voir la preuve et **remplacer** une preuve refusée.
- [ ] **Hors-ligne, la validation est locale et immédiate**, propagée comme une
      écriture, et elle **fait autorité à la synchronisation**. C'est le cas
      d'usage d'une validation hors-ligne, pas un compromis.
- [ ] La preuve, sa validation, son horodatage sont **réplicables** : identifiant
      généré sur l'appareil, horodatage local conservé.
- [ ] Valider ou refuser exige la permission **`preuve.valider`**. Test à l'écran :
      un agent ne voit pas le bouton.
- [ ] Test navigateur mince : un client ne voit **que ses preuves**, et le bouton de
      validation n'apparaît que pour un administrateur habilité.
- [ ] **Une preuve n'est jamais supprimée**, et l'impossibilité est garantie **par
      la base** — comme le journal de S2. Test : tentative de suppression directe,
      rejetée.