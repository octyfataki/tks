"use server";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, gt, ne } from "drizzle-orm";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession, twoFactor as tableDoubleFacteur, user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  facteurs2faAdmin,
  roleExigeSecondFacteur,
  telephoneStaffValide,
} from "@/lib/db/schema/s1-comptes";
import {
  decoderDataUrlPhoto,
  nomFichierAvatar,
  photoProfilValide,
} from "@/components/profil/photo-profil-validation";

export type ResultatPhotoProfil =
  | { ok: true; inchange: boolean }
  | { ok: false; erreur: string };

export type ResultatModificationMonProfil =
  | { ok: true; inchange: boolean }
  | { ok: false; erreur: string };

export type ResultatDeconnexionAutres =
  | { ok: true; coupees: number }
  | { ok: false; erreur: string };

// Dev (option C) : les photos téléversées vivent sur disque sous
// `public/avatars/` (ignoré par git), la colonne `user.image` ne garde que
// l'URL (`/avatars/<id>.jpg`). Les illustrations de la galerie (SVG
// minuscules) restent en dataURL, sans fichier.
const DOSSIER_AVATARS = path.join(process.cwd(), "public", "avatars");

/** Supprime un ancien fichier d'avatar local (chemin `/avatars/...` uniquement). */
async function supprimerFichierAvatar(ancienneImage: string | null): Promise<void> {
  if (!ancienneImage?.startsWith("/avatars/")) return;
  const nom = path.basename(ancienneImage);
  if (nom === "." || nom === ".." || nom.includes("/") || nom.includes("\\")) return;
  try {
    await rm(path.join(DOSSIER_AVATARS, nom), { force: true });
  } catch {
    // Fichier déjà absent : la base reste la source de vérité.
  }
}

/**
 * Modifie la photo du compte connecté (lui seul). Le client envoie déjà une
 * image compressée (canvas 256px, JPEG) ; le serveur recompresse avec sharp
 * (256px cover, JPEG q80) pour garantir le gabarit, puis écrit le fichier.
 */
export async function modifierPhotoProfilAction(
  _precedent: ResultatPhotoProfil | null,
  donnees: FormData,
): Promise<ResultatPhotoProfil> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Vous devez être connecté pour modifier votre photo." };
  }
  const photo = String(donnees.get("photo") ?? "").trim();
  if (!photo) {
    return { ok: false, erreur: "Aucune photo reçue." };
  }
  if (!photoProfilValide(photo)) {
    return {
      ok: false,
      erreur: "Photo invalide (JPEG, PNG, WebP ou illustration de la galerie, 400 Ko maximum).",
    };
  }
  const decodees = decoderDataUrlPhoto(photo);
  if (!decodees) {
    return { ok: false, erreur: "Photo illisible, essayez une autre image." };
  }
  const lignes = await db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1);
  if (!lignes[0]) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  const ancienneImage = lignes[0].image;

  let imageFinale: string;
  try {
    await mkdir(DOSSIER_AVATARS, { recursive: true });
    if (decodees.mime === "svg") {
      const nom = nomFichierAvatar(userId, "svg");
      await writeFile(path.join(DOSSIER_AVATARS, nom), Buffer.from(decodees.base64, "base64"));
      imageFinale = `/avatars/${nom}`;
    } else {
      const tampon = await sharp(Buffer.from(decodees.base64, "base64"))
        .resize(256, 256, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      const nom = nomFichierAvatar(userId, "jpg");
      await writeFile(path.join(DOSSIER_AVATARS, nom), tampon);
      imageFinale = `/avatars/${nom}`;
    }
  } catch {
    return { ok: false, erreur: "Enregistrement impossible, réessayez." };
  }

  if (ancienneImage === imageFinale) {
    return { ok: true, inchange: true };
  }
  await db.update(user).set({ image: imageFinale }).where(eq(user.id, userId));
  if (ancienneImage && ancienneImage !== imageFinale) {
    await supprimerFichierAvatar(ancienneImage);
  }
  revalidatePath("/admin/profil");
  revalidatePath("/agent/profil");
  return { ok: true, inchange: false };
}

/** Retire la photo du compte connecté (fichier + référence, retour aux initiales). */
export async function supprimerPhotoProfilAction(): Promise<ResultatPhotoProfil> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Vous devez être connecté pour modifier votre photo." };
  }
  const lignes = await db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1);
  await db.update(user).set({ image: null }).where(eq(user.id, userId));
  await supprimerFichierAvatar(lignes[0]?.image ?? null);
  revalidatePath("/admin/profil");
  revalidatePath("/agent/profil");
  return { ok: true, inchange: false };
}

/**
 * Corrige le nom affiché + le téléphone contact du compte connecté (lui
 * seul). Même périmètre que la fiche /admin/list/[id] : nom + téléphone
 * uniquement. Ouvert à tout compte staff VALIDE (administrateurs comme
 * agents de service) sur son PROPRE compte — l'auto-correction est
 * autorisée sans risque de verrouillage ; les pouvoirs de gestion
 * (corriger autrui) restent réservés par peutModifierAdmin. Email, rôle,
 * état et secrets ne passent jamais par ici (révocation + recréation
 * tracées).
 *
 * Sans journal d'audit dans cette branche : la correction sera journalisée
 * (avant/après) quand la couche S2 arrivera (invariant 8).
 */
export async function modifierMonProfilAction(
  _precedent: ResultatModificationMonProfil | null,
  donnees: FormData,
): Promise<ResultatModificationMonProfil> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Vous devez être connecté pour modifier votre compte." };
  }
  const lignesMoi = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
      betterAuthUserId: comptesStaff.betterAuthUserId,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignesMoi[0];
  if (!moi) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  // Auto-correction : son propre compte, état VALIDE, tous rôles staff.
  // (La gestion d'autrui reste gardée par peutModifierAdmin côté fiches.)
  if (moi.etat !== "VALIDE") {
    return { ok: false, erreur: "Modification impossible (compte non modifiable)." };
  }
  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  if (!nom) {
    return { ok: false, erreur: "Le nom est exigé." };
  }
  if (nom.length < 2 || nom.length > 255) {
    return { ok: false, erreur: "Le nom doit faire entre 2 et 255 caractères." };
  }
  if (!telephoneStaffValide(telephone)) {
    return {
      ok: false,
      erreur: "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses).",
    };
  }
  const lignesUtilisateur = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, moi.betterAuthUserId))
    .limit(1);
  if (!lignesUtilisateur[0]) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  const lignesTelephone = await db
    .select({ telephone: comptesStaff.telephone })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, moi.id))
    .limit(1);
  const telephoneActuel = lignesTelephone[0]?.telephone ?? null;
  const telephoneValeur = telephone === "" ? null : telephone;
  if (lignesUtilisateur[0].name === nom && telephoneActuel === telephoneValeur) {
    return { ok: true, inchange: true };
  }
  await db.transaction(async (tx) => {
    await tx.update(user).set({ name: nom }).where(eq(user.id, moi.betterAuthUserId));
    await tx
      .update(comptesStaff)
      .set({ telephone: telephoneValeur })
      .where(eq(comptesStaff.id, moi.id));
  });
  revalidatePath("/admin/profil");
  revalidatePath("/agent/profil");
  return { ok: true, inchange: false };
}

/**
 * Coupe les autres sessions du compte connecté, partout sauf ici
 * (appareil perdu, doute sur qui détient l'accès). La session courante
 * survit : on reste connecté. Sans journal d'audit dans cette branche :
 * sera tracé (session.deconnecter-autres, avant/après) avec la couche S2.
 */
export async function deconnecterAutresSessionsAction(): Promise<ResultatDeconnexionAutres> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const sessionActuelleId = (session as unknown as { session?: { id?: string } } | null)?.session
    ?.id;
  if (!userId || !sessionActuelleId) {
    return { ok: false, erreur: "Vous devez être connecté pour gérer vos sessions." };
  }
  const autres = await db
    .select({ id: tableSession.id })
    .from(tableSession)
    .where(
      and(
        eq(tableSession.userId, userId),
        ne(tableSession.id, sessionActuelleId),
        gt(tableSession.expiresAt, new Date()),
      ),
    );
  if (autres.length === 0) {
    return { ok: true, coupees: 0 };
  }
  try {
    await db
      .delete(tableSession)
      .where(
        and(
          eq(tableSession.userId, userId),
          ne(tableSession.id, sessionActuelleId),
          gt(tableSession.expiresAt, new Date()),
        ),
      );
  } catch {
    return { ok: false, erreur: "Déconnexion impossible." };
  }
  revalidatePath("/admin/profil");
  revalidatePath("/agent/profil");
  return { ok: true, coupees: autres.length };
}

export type ResultatConfirmationSecondFacteur =
  | { ok: true }
  | { ok: false; erreur: string };

/**
 * Enregistre la traçabilité du second facteur après enrôlement OTP réussi
 * côté better-auth (code SMS ou email vérifié). Auto-déclaration du titulaire
 * lui-même (les deux rôles admin, compte VALIDE), tracée avec creePar = soi.
 * Le remplacement d'un facteur perdu reste réservé au principal
 * (remplacerFacteur2faAdmin). Un seul facteur actif par compte.
 *
 * Sans journal d'audit dans cette branche : sera tracé avec la couche S2.
 */
export async function confirmerSecondFacteurAction(
  nomAppareil: string,
): Promise<ResultatConfirmationSecondFacteur> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Vous devez être connecté pour activer le second facteur." };
  }
  const appareil = nomAppareil.trim();
  if (appareil.length < 2 || appareil.length > 255) {
    return { ok: false, erreur: "Nom d'appareil invalide (2 à 255 caractères)." };
  }
  const lignesMoi = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignesMoi[0];
  if (!moi) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  if (moi.etat !== "VALIDE" || !roleExigeSecondFacteur(moi.role)) {
    return { ok: false, erreur: "Second facteur réservé aux administrateurs validés." };
  }
  const lignesUtilisateur = await db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const lignesSecret = await db
    .select({ id: tableDoubleFacteur.id })
    .from(tableDoubleFacteur)
    .where(eq(tableDoubleFacteur.userId, userId))
    .limit(1);
  if (!lignesSecret[0] && !lignesUtilisateur[0]?.twoFactorEnabled) {
    return {
      ok: false,
      erreur:
        "Terminez d'abord la vérification (code à 6 chiffres).",
    };
  }
  const actifs = await db
    .select({ id: facteurs2faAdmin.id })
    .from(facteurs2faAdmin)
    .where(
      and(eq(facteurs2faAdmin.compteStaffId, moi.id), eq(facteurs2faAdmin.actif, true)),
    )
    .limit(1);
  if (actifs[0]) {
    return { ok: false, erreur: "Un second facteur actif existe déjà pour ce compte." };
  }
  await db.insert(facteurs2faAdmin).values({
    id: randomUUID(),
    compteStaffId: moi.id,
    nomAppareil: appareil,
    actif: true,
    creePar: moi.id,
  });
  revalidatePath("/admin/profil");
  return { ok: true };
}
