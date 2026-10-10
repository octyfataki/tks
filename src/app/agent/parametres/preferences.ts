/**
 * Préférences d'appareil de l'agent de service (/agent/parametres).
 *
 * Stockage local uniquement (`localStorage`), jamais synchronisé : ce sont
 * des réglages du téléphone, pas des écritures métier. Sur un téléphone
 * partagé au comptoir (S1), ils valent pour l'appareil, pas pour le compte.
 *
 * Le thème passe par `ThemeProvider` (clé `tks-theme`) ; le reste vit sous
 * la clé unique ci-dessous. Le parse est tolérant : toute valeur illisible
 * retombe sur les défauts, jamais d'écran cassé.
 */

export const CLE_PREFERENCES_AGENT = "tks-agent-preferences";

export type DensiteComptoir = "confortable" | "compacte";

/** Canal d'un signal sur l'appareil : combine avec les interrupteurs son / vibration. */
export type CanalNotification = "son-vibration" | "vibration" | "silencieuse";

export const CANAUX_NOTIFICATION: { valeur: CanalNotification; etiquette: string }[] = [
  { valeur: "son-vibration", etiquette: "Son + vibration" },
  { valeur: "vibration", etiquette: "Vibration" },
  { valeur: "silencieuse", etiquette: "Silencieuse" },
];

/** Clés stables des événements configurables. */
export type CleNotification =
  | "validations"
  | "encaissements"
  | "file"
  | "session"
  | "synchronisation"
  | "taux";

export type ReglageNotification = {
  /** L'événement déclenche un signal sur l'appareil. */
  actif: boolean;
  canal: CanalNotification;
};

export type NotificationsAgent = Record<CleNotification, ReglageNotification>;

export type GroupeNotification = "comptoir" | "poste";

export const GROUPES_NOTIFICATION: { valeur: GroupeNotification; titre: string; description: string }[] = [
  {
    valeur: "comptoir",
    titre: "Alertes du comptoir",
    description: "Signaux sur l'appareil pendant que vous servez.",
  },
  {
    valeur: "poste",
    titre: "Poste et compte",
    description: "Ce qui concerne votre session et vos données.",
  },
];

export const CATALOGUE_NOTIFICATIONS: {
  cle: CleNotification;
  groupe: GroupeNotification;
  titre: string;
  description: string;
}[] = [
  {
    cle: "validations",
    groupe: "comptoir",
    titre: "Validation des gestes",
    description: "Un signal à chaque geste validé au comptoir.",
  },
  {
    cle: "encaissements",
    groupe: "comptoir",
    titre: "Encaissements reçus",
    description: "Quand un paiement est confirmé.",
  },
  {
    cle: "file",
    groupe: "comptoir",
    titre: "File d'attente",
    description: "Quand un nouveau geste attend — consommé par S5.",
  },
  {
    cle: "session",
    groupe: "poste",
    titre: "Session qui expire",
    description: "Un rappel avant d'être coupé au comptoir.",
  },
  {
    cle: "synchronisation",
    groupe: "poste",
    titre: "Synchronisation terminée",
    description: "Quand la file est partie — branché avec S8.",
  },
  {
    cle: "taux",
    groupe: "poste",
    titre: "Taux mis à jour",
    description: "Quand le distributeur change le taux — branché avec S3.",
  },
];

export type PreferencesAgent = {
  /** Densité de la file d'attente et de la caisse rapide (S5). */
  densite: DensiteComptoir;
  /** Signaux par événement, appareil uniquement. */
  notifications: NotificationsAgent;
};

export const NOTIFICATIONS_DEFAUT: NotificationsAgent = {
  validations: { actif: true, canal: "son-vibration" },
  encaissements: { actif: true, canal: "son-vibration" },
  file: { actif: true, canal: "vibration" },
  session: { actif: true, canal: "son-vibration" },
  synchronisation: { actif: true, canal: "silencieuse" },
  taux: { actif: true, canal: "silencieuse" },
};

export const PREFERENCES_DEFAUT: PreferencesAgent = {
  densite: "confortable",
  notifications: { ...NOTIFICATIONS_DEFAUT },
};

function estDensite(valeur: unknown): valeur is DensiteComptoir {
  return valeur === "confortable" || valeur === "compacte";
}

function estCanal(valeur: unknown): valeur is CanalNotification {
  return (
    valeur === "son-vibration" ||
    valeur === "vibration" ||
    valeur === "silencieuse"
  );
}

function lireReglage(valeur: unknown, defaut: ReglageNotification): ReglageNotification {
  if (typeof valeur !== "object" || valeur === null) return { ...defaut };
  const objet = valeur as Record<string, unknown>;
  return {
    actif: typeof objet.actif === "boolean" ? objet.actif : defaut.actif,
    canal: estCanal(objet.canal) ? objet.canal : defaut.canal,
  };
}

function lireNotifications(valeur: unknown): NotificationsAgent {
  const objet =
    typeof valeur === "object" && valeur !== null
      ? (valeur as Record<string, unknown>)
      : {};
  return {
    validations: lireReglage(objet.validations, NOTIFICATIONS_DEFAUT.validations),
    encaissements: lireReglage(objet.encaissements, NOTIFICATIONS_DEFAUT.encaissements),
    file: lireReglage(objet.file, NOTIFICATIONS_DEFAUT.file),
    session: lireReglage(objet.session, NOTIFICATIONS_DEFAUT.session),
    synchronisation: lireReglage(
      objet.synchronisation,
      NOTIFICATIONS_DEFAUT.synchronisation,
    ),
    taux: lireReglage(objet.taux, NOTIFICATIONS_DEFAUT.taux),
  };
}

/** Parse tolérant : objet partiel ou illisible -> défauts complétés. */
export function lirePreferences(valeur: unknown): PreferencesAgent {
  if (typeof valeur !== "object" || valeur === null) {
    return { ...PREFERENCES_DEFAUT };
  }
  const objet = valeur as Record<string, unknown>;
  return {
    densite: estDensite(objet.densite)
      ? objet.densite
      : PREFERENCES_DEFAUT.densite,
    notifications: lireNotifications(objet.notifications),
  };
}

export function serialiserPreferences(
  preferences: PreferencesAgent,
): string {
  return JSON.stringify(preferences);
}
