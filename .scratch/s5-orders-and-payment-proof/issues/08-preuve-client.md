# 08: Le client paie et dépose sa preuve — la destination, le montant, la photo

**What to build:** Après avoir confirmé sa commande, le client voit **où
envoyer son argent** : le numéro mobile money du réseau, le montant attendu en
dollars et son équivalent en francs daté. Il paie, prend une photo, la dépose.
Sa commande reste « preuve attendue » jusqu'à ce qu'un administrateur la valide
(ticket `03`). S'il ferme l'application, la commande l'attend.

**Blocked by:** 07 — La commande côté client ; le **numéro mobile money par
réseau** (entrée de S7, enregistrée par l'administrateur principal).

**Status:** ready-for-agent

- [ ] L'écran de paiement affiche la **destination** : le numéro mobile money du
      réseau de la commande. Un seul numéro par réseau, enregistré par
      l'administrateur principal.
- [ ] **Sans numéro configuré pour ce réseau**, une commande `PREPAYE` +
      `EN_LIGNE` est impossible et l'écran l'explique. Pas d'écran de paiement
      vide, pas de commande préparée.
- [ ] Le **montant attendu** s'affiche en dollars d'abord, puis son équivalent
      francs **daté**, avec le taux utilisé (règle d'affichage d'ADR-0001).
- [ ] Le dépôt de la preuve suit la politique existante
      (`src/platform/files/policy.ts`, catégorie `preuve_paiement`) :
      JPEG/PNG/WebP/PDF, **2 Mo**, **compression côté client** avant envoi.
- [ ] Un refus pour taille ou format est expliqué **en clair**, sans message
      technique.
- [ ] La commande reste en **preuve attendue** tant qu'aucune preuve n'est
      validée. Le client la retrouve dans son suivi, sans l'avoir perdue.
- [ ] Le client voit **immédiatement** que sa preuve est reçue, puis validée ou
      refusée — **dans l'application seulement**, aucun push.
- [ ] Un **refus porte un motif obligatoire**, et le client le lit.
- [ ] Le client **renvoie une preuve sans recréer la commande** : même commande,
      même identifiant, nouvelle preuve.
- [ ] **L'ancienne preuve est conservée et consultable.** Une preuve ne
      s'écrase jamais, et ne se supprime jamais — l'impossibilité est garantie
      **par la base**, comme le journal de S2.
- [ ] Le client dépose sa preuve **hors-ligne** : elle entre dans la file et
      part à la reconnexion, sans doublon.
- [ ] Test navigateur mince : un client ne voit **que ses** preuves, et l'écran
      de paiement affiche le bon numéro pour le réseau de la commande.
