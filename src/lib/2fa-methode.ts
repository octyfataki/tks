export const METHODES_ENVOI_2FA = ["sms", "email"] as const;
export type MethodeEnvoi2fa = (typeof METHODES_ENVOI_2FA)[number];

export function estMethodeEnvoi2fa(valeur: unknown): valeur is MethodeEnvoi2fa {
  return valeur === "sms" || valeur === "email";
}

export function clePreferenceMethode2fa(defi: string): string {
  return `2fa-methode-${defi}`;
}

export function lireDefi2fa(cookie: string): string | null {
  const trouve =
    /(?:^|;\s*)((?:__Secure-|__Host-)?better-auth\.two_factor)=([^;]*)/.exec(
      cookie,
    );
  if (!trouve) return null;
  const brut = trouve[2].trim();
  let clair = brut;
  if (brut.includes("%")) {
    try {
      clair = decodeURIComponent(brut);
    } catch {
      clair = brut;
    }
  }
  const point = clair.lastIndexOf(".");
  const jeton = point > 0 ? clair.slice(0, point) : clair;
  return jeton.startsWith("2fa-") ? jeton : null;
}
