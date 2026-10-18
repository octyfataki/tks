export const AGENT_PREFERENCES_KEY = "tks-agent-preferences";

export type CounterDensity = "confortable" | "compacte";

export type NotificationChannel = "son-vibration" | "vibration" | "silencieuse";

export const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "son-vibration", label: "Son + vibration" },
  { value: "vibration", label: "Vibration" },
  { value: "silencieuse", label: "Silencieuse" },
];

export type NotificationKey =
  | "validations"
  | "encaissements"
  | "file"
  | "session"
  | "synchronisation"
  | "taux";

export type NotificationSetting = {
  actif: boolean;
  canal: NotificationChannel;
};

export type AgentNotifications = Record<NotificationKey, NotificationSetting>;

export type NotificationGroup = "comptoir" | "poste";

export const NOTIFICATION_GROUPS: { value: NotificationGroup; title: string; description: string }[] = [
  {
    value: "comptoir",
    title: "Alertes du comptoir",
    description: "Signaux sur l'appareil pendant que vous servez.",
  },
  {
    value: "poste",
    title: "Poste et compte",
    description: "Ce qui concerne votre session et vos données.",
  },
];

export const NOTIFICATION_CATALOG: {
  key: NotificationKey;
  group: NotificationGroup;
  title: string;
  description: string;
}[] = [
  {
    key: "validations",
    group: "comptoir",
    title: "Validation des gestes",
    description: "Un signal à chaque geste validé au comptoir.",
  },
  {
    key: "encaissements",
    group: "comptoir",
    title: "Encaissements reçus",
    description: "Quand un paiement est confirmé.",
  },
  {
    key: "file",
    group: "comptoir",
    title: "File d'attente",
    description: "Quand un nouveau geste attend — consommé par S5.",
  },
  {
    key: "session",
    group: "poste",
    title: "Session qui expire",
    description: "Un rappel avant d'être coupé au comptoir.",
  },
  {
    key: "synchronisation",
    group: "poste",
    title: "Synchronisation terminée",
    description: "Quand la file est partie — branché avec S8.",
  },
  {
    key: "taux",
    group: "poste",
    title: "Taux mis à jour",
    description: "Quand le distributeur change le taux — branché avec S3.",
  },
];

export type AgentPreferences = {
  densite: CounterDensity;
  notifications: AgentNotifications;
};

export const DEFAULT_NOTIFICATIONS: AgentNotifications = {
  validations: { actif: true, canal: "son-vibration" },
  encaissements: { actif: true, canal: "son-vibration" },
  file: { actif: true, canal: "vibration" },
  session: { actif: true, canal: "son-vibration" },
  synchronisation: { actif: true, canal: "silencieuse" },
  taux: { actif: true, canal: "silencieuse" },
};

export const DEFAULT_PREFERENCES: AgentPreferences = {
  densite: "confortable",
  notifications: { ...DEFAULT_NOTIFICATIONS },
};

function isCounterDensity(value: unknown): value is CounterDensity {
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

function readNotifications(value: unknown): AgentNotifications {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return {
    validations: readSetting(record.validations, DEFAULT_NOTIFICATIONS.validations),
    encaissements: readSetting(record.encaissements, DEFAULT_NOTIFICATIONS.encaissements),
    file: readSetting(record.file, DEFAULT_NOTIFICATIONS.file),
    session: readSetting(record.session, DEFAULT_NOTIFICATIONS.session),
    synchronisation: readSetting(
      record.synchronisation,
      DEFAULT_NOTIFICATIONS.synchronisation,
    ),
    taux: readSetting(record.taux, DEFAULT_NOTIFICATIONS.taux),
  };
}

export function readPreferences(value: unknown): AgentPreferences {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_PREFERENCES };
  }
  const record = value as Record<string, unknown>;
  return {
    densite: isCounterDensity(record.densite)
      ? record.densite
      : DEFAULT_PREFERENCES.densite,
    notifications: readNotifications(record.notifications),
  };
}

export function serializePreferences(
  preferences: AgentPreferences,
): string {
  return JSON.stringify(preferences);
}
