// Validation pure de la photo de compte (aucun accès base, testable seul).
// Photo compressée côté client (~256px, JPEG) ou illustration de la galerie
// (SVG) : on plafonne à 400 Ko décodés pour ne jamais gonfler la table `user`
// (même esprit que la preuve de paiement : photo compressée, plafonnée).
export const MAX_OCTETS_PHOTO_PROFIL = 400 * 1024;

const PREFIXES_AUTORISES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
  "data:image/svg+xml;base64,",
] as const;

export function photoProfilValide(valeur: string): boolean {
  const prefixe = PREFIXES_AUTORISES.find((p) => valeur.startsWith(p));
  if (!prefixe) return false;
  const base64 = valeur.slice(prefixe.length);
  if (!base64 || base64.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return false;
  const octets = Math.floor((base64.length * 3) / 4);
  return octets > 0 && octets <= MAX_OCTETS_PHOTO_PROFIL;
}

export type DonneesDataUrl = { mime: "jpeg" | "png" | "webp" | "svg"; base64: string };

/** Découpe un dataURL validé en mime + charge base64 (pur, testable). */
export function decoderDataUrlPhoto(valeur: string): DonneesDataUrl | null {
  if (valeur.startsWith("data:image/jpeg;base64,")) {
    return { mime: "jpeg", base64: valeur.slice("data:image/jpeg;base64,".length) };
  }
  if (valeur.startsWith("data:image/png;base64,")) {
    return { mime: "png", base64: valeur.slice("data:image/png;base64,".length) };
  }
  if (valeur.startsWith("data:image/webp;base64,")) {
    return { mime: "webp", base64: valeur.slice("data:image/webp;base64,".length) };
  }
  if (valeur.startsWith("data:image/svg+xml;base64,")) {
    return { mime: "svg", base64: valeur.slice("data:image/svg+xml;base64,".length) };
  }
  return null;
}

/** Nom de fichier sûr pour un avatar (anti traversée de chemin). */
export function nomFichierAvatar(userId: string, extension: "jpg" | "svg"): string {
  const sur = userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "compte";
  return `${sur}.${extension}`;
}

/** Fabrique une illustration de galerie (dégradé abstrait, 256px). */
function illustration(first: string, second: string, third: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${first}"/><stop offset=".55" stop-color="${second}"/>` +
    `<stop offset="1" stop-color="${third}"/></linearGradient></defs>` +
    `<rect width="256" height="256" fill="url(#g)"/>` +
    `<ellipse cx="70" cy="90" rx="90" ry="70" fill="#ffffff" opacity=".35"/>` +
    `<ellipse cx="200" cy="190" rx="100" ry="80" fill="#000000" opacity=".12"/>` +
    `</svg>`;
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export type IllustrationGalerie = { nom: string; src: string };

/** Galerie proposée dans la fenêtre de choix (même esprit que la maquette). */
export const GALERIE_PHOTOS_PROFIL: IllustrationGalerie[] = [
  { nom: "Aurore", src: illustration("#ef4444", "#ec4899", "#a78bfa") },
  { nom: "Lagune", src: illustration("#8b5cf6", "#2dd4bf", "#a78bfa") },
  { nom: "Braise", src: illustration("#ec4899", "#f97316", "#f43f5e") },
  { nom: "Fleuve", src: illustration("#3b82f6", "#f97316", "#93c5fd") },
];
