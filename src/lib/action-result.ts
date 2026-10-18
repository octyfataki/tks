export type EchecAction = { ok: false; erreur: string };

export type ResultatAction<T extends object = object> =
  | ({ ok: true } & T)
  | EchecAction;
