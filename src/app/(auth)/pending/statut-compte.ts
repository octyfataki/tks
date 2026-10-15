export type StatutCompte =
  | { connecte: false; horsLigne?: boolean }
  | {
      connecte: true;
      etat: string;
      motifRefus: string | null;
      nom: string | null;
      email: string | null;
      telephone: string | null;
      inscritLe: string | null;
      pieces: {
        id: string;
        typePiece: string;
        mime: string;
        vue: boolean;
        deposeLe: string;
      }[];
    };

function texteOuNull(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur !== "" ? valeur : null;
}

export async function lireStatutCompte(): Promise<StatutCompte> {
  try {
    const reponse = await fetch("/api/mon-compte/piece", {
      cache: "no-store",
    });
    if (!reponse.ok) return { connecte: false };
    const donnees = (await reponse.json()) as Partial<
      Extract<StatutCompte, { connecte: true }> & { connecte: boolean }
    > | null;
    if (!donnees || donnees.connecte !== true) return { connecte: false };
    return {
      connecte: true,
      etat: typeof donnees.etat === "string" ? donnees.etat : "",
      motifRefus: texteOuNull(donnees.motifRefus),
      nom: texteOuNull(donnees.nom),
      email: texteOuNull(donnees.email),
      telephone: texteOuNull(donnees.telephone),
      inscritLe: texteOuNull(donnees.inscritLe),
      pieces: Array.isArray(donnees.pieces) ? donnees.pieces : [],
    };
  } catch {
    return { connecte: false as const, horsLigne: true };
  }
}
