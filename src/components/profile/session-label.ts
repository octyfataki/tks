const NAVIGATEURS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Edg\/|EdgA\/|EdgiOS\//i, "Edge"],
  [/OPR\/|Opera\//i, "Opera"],
  [/Firefox\/|FxiOS\//i, "Firefox"],
  [/Chrome\/|CriOS\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];

const SYSTEMES: ReadonlyArray<readonly [RegExp, string]> = [
  [/Windows NT 10/i, "Windows 10"],
  [/Windows NT 6\.3/i, "Windows 8.1"],
  [/Windows NT 6\.1/i, "Windows 7"],
  [/Windows/i, "Windows"],
  [/iPhone/i, "iPhone"],
  [/iPad/i, "iPad"],
  [/Android/i, "Android"],
  [/Mac OS X|Macintosh/i, "macOS"],
  [/CrOS/i, "ChromeOS"],
  [/Linux/i, "Linux"],
];

const SERVEURS: ReadonlyArray<readonly [RegExp, string]> = [
  [/node/i, "Session serveur (Node)"],
  [/python-requests|curl|wget|httpx|postman|insomnia/i, "Session script"],
];

export const APPAREIL_INCONNU = "Appareil inconnu";

function navigateur(userAgent: string): string | null {
  for (const [motif, nom] of NAVIGATEURS) {
    if (motif.test(userAgent)) return nom;
  }
  return null;
}

function systeme(userAgent: string): string | null {
  for (const [motif, nom] of SYSTEMES) {
    if (motif.test(userAgent)) return nom;
  }
  return null;
}

function serveur(userAgent: string): string | null {
  for (const [motif, nom] of SERVEURS) {
    if (motif.test(userAgent)) return nom;
  }
  return null;
}

export function libelleAppareil(userAgent: string | null | undefined): string {
  const brut = (userAgent ?? "").trim();
  if (brut === "") return APPAREIL_INCONNU;

  const hote = serveur(brut);
  if (hote) return hote;

  const navigateurDetecte = navigateur(brut);
  const systemeDetecte = systeme(brut);
  if (navigateurDetecte && systemeDetecte) {
    return `${navigateurDetecte} sur ${systemeDetecte}`;
  }
  if (navigateurDetecte) return navigateurDetecte;
  if (systemeDetecte) return `Navigateur sur ${systemeDetecte}`;
  return APPAREIL_INCONNU;
}

const ADRESSES_LOOPBACK = new Set([
  "::1",
  "0:0:0:0:0:0:0:1",
  "0000:0000:0000:0000:0000:0000:0000:0000",
  "::",
  "0:0:0:0:0:0:0:0",
]);

export function formaterAdresseSession(adresse: string | null | undefined): string | null {
  const brute = (adresse ?? "").trim();
  if (brute === "") return null;
  if (ADRESSES_LOOPBACK.has(brute.toLowerCase())) return "127.0.0.1";
  if (brute.toLowerCase().startsWith("::ffff:")) {
    return brute.slice("::ffff:".length);
  }
  return brute;
}
