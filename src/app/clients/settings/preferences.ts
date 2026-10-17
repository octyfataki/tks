export const CLIENT_PREFERENCES_KEY = "tks-client-preferences";

export type ListDensity = "confortable" | "compacte";

export type NotificationChannel = "son-vibration" | "vibration" | "silencieuse";

export const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "son-vibration", label: "Son + vibration" },
  { value: "vibration", label: "Vibration" },
  { value: "silencieuse", label: "Silencieuse" },
];

export type ClientNotificationKey =
  | "commandes"
  | "paiements"
  | "taux"
  | "session"
  | "synchronisation";

export type NotificationSetting = {
  actif: boolean;
  canal: NotificationChannel;
};

export type ClientNotifications = Record<ClientNotificationKey, NotificationSetting>;

export type ClientNotificationGroup = "suivi" | "appareil";

export const NOTIFICATION_GROUPS: {
  value: ClientNotificationGroup;
  title: string;
  description: string;
}[] = [
  {
    value: "suivi",
    title: "Commandes et paiements",
    description: "Ce qui bouge sur votre compte : commandes, paiements, taux.",
  },
  {
    value: "appareil",
    title: "Appareil et session",
    description: "Ce qui concerne votre téléphone et votre connexion.",
  },
];

export const NOTIFICATION_CATALOG: {
  key: ClientNotificationKey;
  group: ClientNotificationGroup;
  title: string;
  description: string;
}[] = [
  {
    key: "commandes",
    group: "suivi",
    title: "Suivi des commandes",
    description: "Quand une commande change d'état — servi avec S5.",
  },
  {
    key: "paiements",
    group: "suivi",
    title: "Paiements et reste à payer",
    description: "Quand un paiement est enregistré — servi avec S6.",
  },
  {
    key: "taux",
    group: "suivi",
    title: "Taux mis à jour",
    description: "Quand le distributeur change le taux — branché avec S3.",
  },
  {
    key: "session",
    group: "appareil",
    title: "Session qui expire",
    description: "Un rappel avant d'être déconnecté.",
  },
  {
    key: "synchronisation",
    group: "appareil",
    title: "Synchronisation terminée",
    description: "Quand la file est partie — branché avec S8.",
  },
];

export type ClientPreferences = {
  densite: ListDensity;
  notifications: ClientNotifications;
};

export const DEFAULT_NOTIFICATIONS: ClientNotifications = {
  commandes: { actif: true, canal: "son-vibration" },
  paiements: { actif: true, canal: "son-vibration" },
  taux: { actif: true, canal: "silencieuse" },
  session: { actif: true, canal: "son-vibration" },
  synchronisation: { actif: true, canal: "silencieuse" },
};

export const DEFAULT_PREFERENCES: ClientPreferences = {
  densite: "confortable",
  notifications: { ...DEFAULT_NOTIFICATIONS },
};

function isListDensity(value: unknown): value is ListDensity {
  return value === "confortable" || value === "compacte";
}

function isNotificationChannel(value: unknown): value is NotificationChannel {
  return (
    value === "son-vibration" ||
    value === "vibration" ||
    value === "silencieuse"
  );
}

function readSetting(value: unknown, fallback: NotificationSetting): NotificationSetting {
  if (typeof value !== "object" || value === null) return { ...fallback };
  const record = value as Record<string, unknown>;
  return {
    actif: typeof record.actif === "boolean" ? record.actif : fallback.actif,
    canal: isNotificationChannel(record.canal) ? record.canal : fallback.canal,
  };
}

function readNotifications(value: unknown): ClientNotifications {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return {
    commandes: readSetting(record.commandes, DEFAULT_NOTIFICATIONS.commandes),
    paiements: readSetting(record.paiements, DEFAULT_NOTIFICATIONS.paiements),
    taux: readSetting(record.taux, DEFAULT_NOTIFICATIONS.taux),
    session: readSetting(record.session, DEFAULT_NOTIFICATIONS.session),
    synchronisation: readSetting(
      record.synchronisation,
      DEFAULT_NOTIFICATIONS.synchronisation,
    ),
  };
}

export function readPreferences(value: unknown): ClientPreferences {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_PREFERENCES };
  }
  const record = value as Record<string, unknown>;
  return {
    densite: isListDensity(record.densite)
      ? record.densite
      : DEFAULT_PREFERENCES.densite,
    notifications: readNotifications(record.notifications),
  };
}

export function serializePreferences(
  preferences: ClientPreferences,
): string {
  return JSON.stringify(preferences);
}