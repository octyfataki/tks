"use server";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, gt, ne } from "drizzle-orm";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession, user } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { modifierAdminSupport, StaffError } from "@/lib/s1-comptes/staff";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import type { ResultatAction } from "@/lib/resultat-action";
import {
  decoderDataUrlPhoto,
  nomFichierAvatar,
  photoProfilValide,
} from "@/components/profil/photo-profil-validation";

export type ResultatPhotoProfil = ResultatAction<{ inchange: boolean }>;

export type ResultatModificationMonProfil = ResultatAction<{ inchange: boolean }>;

/**
 * Corrige le nom affiché + le téléphone contact du compte connecté (lui
 * seul). Même périmètre que la fiche /admin/list/[id] : nom + téléphone
 * uniquement, sur un compte ADMIN_* VALIDE — l'auto-correction est
 * autorisée sans risque de verrouillage. Email, rôle, état et secrets ne
 * passent jamais par ici (révocation + recréation tracées). Journalisé
 * (admin.modifier, avant/après) via modifierAdminSupport.
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
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  if (!nom) {
    return { ok: false, erreur: "Le nom est exigé." };
  }
  try {
    const resultat = await modifierAdminSupport(moi.id, moi.id, { nom, telephone });
    revalidatePath("/admin/profil");
    return { ok: true, inchange: resultat.inchange };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      if (erreur.code === "TELEPHONE_INVALIDE") {
        return {
          ok: false,
          erreur: "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses).",
        };
      }
      return { ok: false, erreur: "Modification impossible (compte non modifiable)." };
    }
    return { ok: false, erreur: "Modification impossible (données invalides ou compte introuvable)." };
  }
}

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
  return { ok: true, inchange: false };
}

/**
 * Coupe les autres sessions du compte connecté, partout sauf ici
 * (appareil perdu, doute sur qui détient l'accès). La session courante
 * survit : on reste connecté. Tracé au journal (avant/après).
 */
export async function deconnecterAutresSessionsAction(): Promise<
  ResultatAction<{ coupees: number }>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const sessionActuelleId = (session as unknown as { session?: { id?: string } } | null)?.session
    ?.id;
  if (!userId || !sessionActuelleId) {
    return { ok: false, erreur: "Vous devez être connecté pour gérer vos sessions." };
  }
  const lignesStaff = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const staff = lignesStaff[0];

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
    await db.transaction(async (tx) => {
      await tx
        .delete(tableSession)
        .where(
          and(
            eq(tableSession.userId, userId),
            ne(tableSession.id, sessionActuelleId),
            gt(tableSession.expiresAt, new Date()),
          ),
        );
      const trace = await enregistrerEvenement(
        {
          acteurId: staff?.id ?? null,
          roleAuMoment: staff?.role ?? "CLIENT",
          typeAction: "session.deconnecter-autres",
          entite: "session",
          avant: { sessions: autres.length + 1 },
          apres: { sessions: 1 },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Déconnexion impossible." };
  }
  revalidatePath("/admin/profil");
  return { ok: true, coupees: autres.length };
}
