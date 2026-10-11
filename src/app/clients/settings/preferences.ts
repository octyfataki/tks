/**
 * Préférences d'appareil du client (/clients/settings).
 *
 * Stockage local uniquement (`localStorage`), jamais synchronisé : ce sont
 * des réglages du téléphone, pas des écritures métier.
 *
 * Le thème passe par `ThemeProvider` (clé `tks-theme`) ; le reste vit sous
 * la clé unique ci-dessous. Le parse est tolérant : toute valeur illisible
 * retombe sur les défauts, jamais d'écran cassé.
 */

export const CLE_PREFERENCES_CLIENT = "tks-client-preferences";

export type DensiteListes = "confortable" | "compacte";

/** Canal d'un signal sur l'appareil : combine avec les interrupteurs son / vibration. */
export type CanalNotification = "son-vibration" | "vibration" | "silencieuse";

export const CANAUX_NOTIFICATION: { valeur: CanalNotification; etiquette: string }[] = [
  { valeur: "son-vibration", etiquette: "Son + vibration" },
  { valeur: "vibration", etiquette: "Vibration" },
  { valeur: "silencieuse", etiquette: "Silencieuse" },
];

/** Clés stables des événements configurables. */
export type CleNotificationClient =
  | "commandes"
  | "paiements"
  | "taux"
  | "session"
  | "synchronisation";

export type ReglageNotification = {
  /** L'événement déclenche un signal sur l'appareil. */
  actif: boolean;
  canal: CanalNotification;
};

export type NotificationsClient = Record<CleNotificationClient, ReglageNotification>;

export type GroupeNotificationClient = "suivi" | "appareil";

export const GROUPES_NOTIFICATION: {
  valeur: GroupeNotificationClient;
  titre: string;
  description: string;
}[] = [
  {
    valeur: "suivi",
    titre: "Commandes et paiements",
    description: "Ce qui bouge sur votre compte : commandes, paiements, taux.",
  },
  {
    valeur: "appareil",
    titre: "Appareil et session",
    description: "Ce qui concerne votre téléphone et votre connexion.",
  },
];

export const CATALOGUE_NOTIFICATIONS: {
  cle: CleNotificationClient;
  groupe: GroupeNotificationClient;
  titre: string;
  description: string;
}[] = [
  {
    cle: "commandes",
    groupe: "suivi",
    titre: "Suivi des commandes",
    description: "Quand une commande change d'état — servi avec S5.",
  },
  {
    cle: "paiements",
    groupe: "suivi",
    titre: "Paiements et reste à payer",
    description: "Quand un paiement est enregistré — servi avec S6.",
  },
  {
    cle: "taux",
    groupe: "suivi",
    titre: "Taux mis à jour",
    description: "Quand le distributeur change le taux — branché avec S3.",
  },
  {
    cle: "session",
    groupe: "appareil",
    titre: "Session qui expire",
    description: "Un rappel avant d'être déconnecté.",
  },
  {
    cle: "synchronisation",
    groupe: "appareil",
    titre: "Synchronisation terminée",
    description: "Quand la file est partie — branché avec S8.",
  },
];

export type PreferencesClient = {
  /** Densité des listes (commandes, paiements), servie par S5 et S6. */
  densite: DensiteListes;
  /** Signaux par événement, appareil uniquement. */
  notifications: NotificationsClient;
};

export const NOTIFICATIONS_DEFAUT: NotificationsClient = {
  commandes: { actif: true, canal: "son-vibration" },
  paiements: { actif: true, canal: "son-vibration" },
  taux: { actif: true, canal: "silencieuse" },
  session: { actif: true, canal: "son-vibration" },
  synchronisation: { actif: true, canal: "silencieuse" },
};

export const PREFERENCES_DEFAUT: PreferencesClient = {
  densite: "confortable",
  notifications: { ...NOTIFICATIONS_DEFAUT },
};

function estDensite(valeur: unknown): valeur is DensiteListes {
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

function lireNotifications(valeur: unknown): NotificationsClient {
  const objet =
    typeof valeur === "object" && valeur !== null
      ? (valeur as Record<string, unknown>)
      : {};
  return {
    commandes: lireReglage(objet.commandes, NOTIFICATIONS_DEFAUT.commandes),
    paiements: lireReglage(objet.paiements, NOTIFICATIONS_DEFAUT.paiements),
    taux: lireReglage(objet.taux, NOTIFICATIONS_DEFAUT.taux),
    session: lireReglage(objet.session, NOTIFICATIONS_DEFAUT.session),
    synchronisation: lireReglage(
      objet.synchronisation,
      NOTIFICATIONS_DEFAUT.synchronisation,
    ),
  };
}

/** Parse tolérant : objet partiel ou illisible -> défauts complétés. */
export function lirePreferences(valeur: unknown): PreferencesClient {
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
  preferences: PreferencesClient,
): string {
  return JSON.stringify(preferences);
}
