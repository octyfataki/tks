export type NomsConnus = ReadonlyMap<string, string>;

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function decoder(valeur: unknown): unknown {
  if (typeof valeur !== "string") return valeur;
  const texte = valeur.trim();
  if (!texte.startsWith("{") && !texte.startsWith("[")) return valeur;
  try {
    return JSON.parse(texte) as unknown;
  } catch {
    return valeur;
  }
}

function texte(valeur: unknown): string | null {
  if (typeof valeur === "string") return valeur;
  if (typeof valeur === "number") return String(valeur);
  return null;
}

function nombre(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur)) return valeur;
  if (typeof valeur === "string" && valeur.trim() !== "") {
    const n = Number(valeur);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function nomDe(id: string | null, noms: NomsConnus | undefined): string {
  if (!id) return "auteur inconnu";
  return noms?.get(id) ?? id;
}

export function nomEntite(entite: string): string {
  switch (entite) {
    case "compte_client":
      return "Compte client";
    case "compte_staff":
      return "Compte staff";
    case "permission":
      return "Permission";
    case "permission_socle":
      return "Permission du socle";
    case "taux_change":
      return "Taux";
    case "price_grid":
      return "Grille tarifaire";
    case "invitation_agent":
      return "Invitation agent";
    case "premier_acces_admin":
      return "Premier accès administrateur";
    case "reglage":
      return "Réglage";
    case "annotation_client":
      return "Annotation client";
    default:
      return entite;
  }
}

function formaterMontant(valeur: number): string {
  return new Intl.NumberFormat("fr-FR").format(valeur);
}

export function resumerEvenement(
  input: {
    typeAction: string;
    entite: string;
    avant?: unknown;
    apres?: unknown;
    motif?: string | null;
  },
  noms?: NomsConnus,
): string | null {
  const avant = decoder(input.avant);
  const apres = decoder(input.apres);
  const avantO = estObjet(avant) ? avant : null;
  const apresO = estObjet(apres) ? apres : null;

  switch (input.typeAction) {
    default:
      return null;
    case "taux.saisir": {
      const jour = texte(apresO?.["jour"]);
      const valeur = nombre(apresO?.["valeur"]);
      if (jour && valeur !== null)
        return `Taux du ${jour} : ${formaterMontant(valeur)} CDF pour 1 USD`;
      if (valeur !== null)
        return `Taux saisi : ${formaterMontant(valeur)} CDF pour 1 USD`;
      return null;
    }
    case "client.inscrire": {
      const telephone = texte(apresO?.["telephone"]);
      return telephone
        ? `Inscription du compte client ${telephone} (en attente de validation)`
        : "Inscription d'un compte client (en attente de validation)";
    }
    case "client.valider": {
      const avantEtat = texte(avantO?.["etat"]);
      const typePiece = texte(apresO?.["typePiece"]);
      const piece = typePiece ? `, pièce ${typePiece} vue` : "";
      const comptoir =
        apresO?.["vuAuComptoir"] === true ? " au comptoir" : "";
      const transition = avantEtat ? `${avantEtat} → VALIDE` : "compte validé";
      return `Validation du compte client (${transition}${comptoir}${piece})`;
    }
    case "client.refuser":
    case "client.revoquer": {
      const avantEtat = texte(avantO?.["etat"]);
      const cible = input.typeAction === "client.refuser" ? "REFUSE" : "REVOQUE";
      const transition = avantEtat ? `${avantEtat} → ${cible}` : cible;
      const motif = input.motif?.trim();
      return `Compte client ${transition.toLowerCase()} (${transition}${motif ? `, motif : ${motif}` : ""})`;
    }
    case "annotation.poser":
    case "annotation.retirer": {
      const code = texte(apresO?.["etiquette"]);
      const libelle = texte(apresO?.["libelle"]) ?? code ?? "étiquette inconnue";
      const compte = texte(apresO?.["compteClientId"]);
      if (input.typeAction === "annotation.poser") {
        return `Étiquette « ${libelle} » posée${compte ? ` sur le compte ${nomDe(compte, noms)}` : ""}`;
      }
      return `Étiquette « ${libelle} » retirée${compte ? ` du compte ${nomDe(compte, noms)}` : ""}`;
    }
    case "permission.accorder":
    case "permission.retirer": {
      const donnees = apresO ?? avantO;
      const permission = texte(donnees?.["permission"]);
      const agentId = texte(donnees?.["agentId"]);
      const verbe =
        input.typeAction === "permission.accorder" ? "accordée à" : "retirée à";
      if (permission && agentId)
        return `Permission ${permission} ${verbe} l'agent ${nomDe(agentId, noms)}`;
      if (permission) return `Permission ${permission}`;
      return null;
    }
    case "permission.socle.accorder":
    case "permission.socle.retirer": {
      const donnees = apresO ?? avantO;
      const permission = texte(donnees?.["permission"]);
      const verbe =
        input.typeAction === "permission.socle.accorder"
          ? "ajoutée au socle"
          : "retirée du socle";
      return permission
        ? `Permission ${permission} ${verbe} (tous les agents)`
        : null;
    }
    case "permission.profil": {
      const agentId = texte(apresO?.["agentId"]);
      const ajoutees = Array.isArray(apresO?.["ajoutees"])
        ? (apresO?.["ajoutees"] as unknown[])
        : null;
      const qui = agentId ? ` à l'agent ${nomDe(agentId, noms)}` : "";
      if (ajoutees && ajoutees.length > 0)
        return `Profil appliqué${qui} : ${ajoutees.length} permission${ajoutees.length > 1 ? "s" : ""} ajoutée${ajoutees.length > 1 ? "s" : ""} (${ajoutees.map((p) => String(p)).join(", ")})`;
      return `Profil appliqué${qui} : rien à ajouter`;
    }
    case "agent.creer":
    case "agent.inscrire": {
      const email = texte(apresO?.["email"]);
      return email
        ? `Compte agent créé (${email})`
        : "Compte agent créé";
    }
    case "agent.suspendre":
    case "admin.suspendre":
      return "Compte suspendu (connexion refusée, réversible)";
    case "agent.lever_suspension":
    case "admin.lever_suspension":
      return "Suspension levée (retour à l'accès normal)";
    case "agent.revoquer":
    case "admin.revoquer":
      return "Compte révoqué (définitif, rouvrir passe par recréation)";
    case "agent.modifier":
    case "admin.modifier": {
      const cles = [
        ...Object.keys(avantO ?? {}),
        ...Object.keys(apresO ?? {}),
      ].filter((c, i, tous) => tous.indexOf(c) === i);
      return cles.length > 0
        ? `Compte modifié (${cles.join(", ")})`
        : "Compte modifié";
    }
    case "invitation.revoquer":
      return "Invitation révoquée (lien définitivement inutilisable)";
    case "reglage.modifier": {
      const cles = [
        ...Object.keys(avantO ?? {}),
        ...Object.keys(apresO ?? {}),
      ].filter((c, i, tous) => tous.indexOf(c) === i);
      return cles.length > 0
        ? `Réglage modifié (${cles.join(", ")})`
        : "Réglage modifié";
    }
    case "order.create": {
      return "Commande créée";
    }
    case "order.claim":
    case "order.lock": {
      const avantEtat = texte(avantO?.["state"]);
      const apresEtat = texte(apresO?.["state"]);
      if (avantEtat && apresEtat) return `Commande verrouillée (${avantEtat} → ${apresEtat})`;
      return "Commande verrouillée";
    }
    case "order.serve": {
      const avantEtat = texte(avantO?.["state"]);
      const apresEtat = texte(apresO?.["state"]);
      if (avantEtat && apresEtat) return `Commande servie (${avantEtat} → ${apresEtat})`;
      return "Commande servie";
    }
    case "order.cancel": {
      const avantEtat = texte(avantO?.["state"]);
      const apresEtat = texte(apresO?.["state"]);
      if (avantEtat && apresEtat) return `Commande annulée (${avantEtat} → ${apresEtat})`;
      return "Commande annulée";
    }
    case "payment_proof.validate": {
      const orderId = texte(apresO?.["orderId"]);
      return orderId ? `Preuve de paiement validée (commande ${orderId})` : "Preuve de paiement validée";
    }
    case "payment_proof.refuse": {
      const orderId = texte(apresO?.["orderId"]);
      const reason = texte(apresO?.["reason"]) ?? input.motif?.trim();
      const suffix = reason ? `, motif : ${reason}` : "";
      return orderId
        ? `Preuve de paiement refusée (commande ${orderId}${suffix})`
        : `Preuve de paiement refusée${suffix}`;
    }
    case "cash.movement": {
      return "Mouvement de caisse";
    }
    case "entry.correct": {
      return "Correction d'entrée";
    }
    case "receivable.create": {
      return "Créance créée";
    }
    case "profil.acces.automatique": {
      return "Accès automatique accordé";
    }
  }
}
