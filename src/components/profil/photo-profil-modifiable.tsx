"use client";

import * as React from "react";
import { useActionState } from "react";
import { CameraIcon, CheckIcon, ImagePlusIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { modifierPhotoProfilAction, supprimerPhotoProfilAction } from "@/app/admin/profil/actions";
import { GALERIE_PHOTOS_PROFIL } from "./photo-profil-validation";

function initiales(nom: string): string {
  return (
    nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot.charAt(0).toUpperCase())
      .join("") || "–"
  );
}

/** Compresse en carré 256px JPEG (cover), comme la preuve de paiement : plafonnée. */
async function compresserPhoto(
  fichier: File,
  suivreEtape?: (etape: "lecture" | "compression") => void,
): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    suivreEtape?.("lecture");
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image illisible"));
      img.src = url;
    });
    suivreEtape?.("compression");
    const taille = 256;
    const toile = document.createElement("canvas");
    toile.width = taille;
    toile.height = taille;
    const contexte = toile.getContext("2d");
    if (!contexte) throw new Error("canvas indisponible");
    const echelle = Math.max(taille / image.naturalWidth, taille / image.naturalHeight);
    const largeur = image.naturalWidth * echelle;
    const hauteur = image.naturalHeight * echelle;
    contexte.drawImage(image, (taille - largeur) / 2, (taille - hauteur) / 2, largeur, hauteur);
    return toile.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Avatar du bandeau : le crayon ouvre une fenêtre (dépôt + galerie). */
export function PhotoProfilModifiable({ nom, avatarUrl }: { nom: string; avatarUrl?: string | null }) {
  const [ouvert, setOuvert] = React.useState(false);
  const [apercu, setApercu] = React.useState<string | null>(null);
  const [survolDepot, setSurvolDepot] = React.useState(false);
  const [etapeCompression, setEtapeCompression] = React.useState<"lecture" | "compression" | null>(null);
  const compressionEnCours = etapeCompression !== null;
  const [erreurLocale, setErreurLocale] = React.useState<string | null>(null);
  const [suppression, setSuppression] = React.useState(false);
  const entreeRef = React.useRef<HTMLInputElement>(null);
  const photoAffichee = avatarUrl ?? null;
  const [etat, action, enCours] = useActionState(
    async (_precedent: unknown, donnees: FormData) => {
      const resultat = await modifierPhotoProfilAction(null, donnees);
      if (resultat.ok) {
        setApercu(null);
        setErreurLocale(null);
        setSurvolDepot(false);
        setOuvert(false);
      }
      return resultat;
    },
    null,
  );

  function fermer() {
    setOuvert(false);
    setApercu(null);
    setErreurLocale(null);
    setSurvolDepot(false);
    setEtapeCompression(null);
  }

  // La fenêtre se referme dans l'action ci-dessus quand l'enregistrement
  // réussit : pas d'effet ici (pas de setState dans un effet).

  async function traiterFichier(fichier: File | undefined) {
    if (!fichier) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
      setErreurLocale("Choisissez une image (JPEG, PNG ou WebP).");
      return;
    }
    try {
      setErreurLocale(null);
      setEtapeCompression("lecture");
      setApercu(await compresserPhoto(fichier, (etape) => setEtapeCompression(etape)));
    } catch {
      setErreurLocale("Image illisible, essayez une autre photo.");
    } finally {
      setEtapeCompression(null);
    }
  }

  async function retirerPhoto() {
    setSuppression(true);
    try {
      await supprimerPhotoProfilAction();
      fermer();
    } catch {
      setErreurLocale("Suppression impossible, réessayez.");
    } finally {
      setSuppression(false);
    }
  }

  return (
    <div className="shrink-0">
      <div className="group relative">
        <Avatar className="size-16 sm:size-20">
          {photoAffichee ? <AvatarImage src={photoAffichee} alt={nom} /> : null}
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initiales(nom)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Modifier la photo"
          title="Modifier la photo"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
        >
          <CameraIcon className="size-5" aria-hidden />
        </button>
      </div>

      <Dialog open={ouvert} onOpenChange={(v) => (v ? setOuvert(true) : fermer())}>
        <DialogContent aria-label="Modifier la photo">
          <DialogHeader>
            <DialogTitle className="text-base">Modifier la photo</DialogTitle>
            <DialogDescription>
              Choisissez une image visible partout dans l&apos;application.
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs font-medium">Téléverser une image :</p>
          <button
            type="button"
            onClick={() => entreeRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvolDepot(true);
            }}
            onDragLeave={() => setSurvolDepot(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvolDepot(false);
              traiterFichier(e.dataTransfer.files?.[0]);
            }}
            aria-label="Cliquer ou déposer une image pour la téléverser"
            className={cn(
              "flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
              survolDepot ? "border-primary bg-primary/5" : "border-input bg-muted/30 hover:bg-muted/50",
            )}
          >
            <ImagePlusIcon className="size-5 text-muted-foreground" aria-hidden />
            <span className="text-xs font-medium">
              Cliquez ou déposez votre fichier ici
            </span>
            <span className="text-[11px] text-muted-foreground">JPEG, PNG, WebP (5 Mo max)</span>
            {apercu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercu} alt="Aperçu de la photo choisie" className="mt-2 size-16 rounded-full object-cover" />
            ) : null}
          </button>
          <input
            ref={entreeRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choisir une photo"
            className="sr-only"
            onChange={(e) => {
              traiterFichier(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {compressionEnCours ? (
            <div
              role="status"
              aria-label={
                etapeCompression === "lecture"
                  ? "Lecture du fichier en cours, étape 1 sur 2"
                  : "Compression de l'image en cours, étape 2 sur 2"
              }
              className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5"
            >
              <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  {etapeCompression === "lecture" ? "Lecture du fichier…" : "Compression de l'image…"}
                </p>
                <ol className="mt-1.5 flex items-center gap-1.5" aria-hidden>
                  <li
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      etapeCompression === "compression" ? "bg-primary" : "bg-primary/60",
                    )}
                  />
                  <li
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      etapeCompression === "compression" ? "bg-primary" : "bg-muted-foreground/25",
                    )}
                  />
                </ol>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {etapeCompression === "lecture" ? "1/2" : "2/2"}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-3" aria-hidden>
            <Separator className="flex-1" />
            <span className="text-[11px] text-muted-foreground">OU</span>
            <Separator className="flex-1" />
          </div>

          <div>
            <p className="text-xs font-medium">Choisir depuis la galerie :</p>
            <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label="Galerie d'illustrations">
              {GALERIE_PHOTOS_PROFIL.map((illustration) => {
                const choisie = apercu === illustration.src;
                return (
                  <button
                    key={illustration.nom}
                    type="button"
                    disabled={compressionEnCours}
                    onClick={() => {
                      setErreurLocale(null);
                      setApercu(illustration.src);
                    }}
                    aria-pressed={choisie}
                    aria-label={`Choisir l'illustration ${illustration.nom}`}
                    title={illustration.nom}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border-2 transition",
                      choisie ? "border-primary" : "border-transparent hover:border-muted-foreground/40",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={illustration.src} alt="" className="size-full object-cover" />
                    {choisie ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <span className="flex size-6 items-center justify-center rounded-full bg-white text-emerald-600">
                          <CheckIcon className="size-4" aria-hidden />
                        </span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {erreurLocale || (etat && !etat.ok) ? (
            <p role="alert" className="text-xs text-destructive">
              {erreurLocale ?? (etat && !etat.ok ? etat.erreur : null)}
            </p>
          ) : null}

          <DialogFooter className="sm:justify-between">
            {avatarUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={retirerPhoto} disabled={suppression || enCours}>
                <Trash2Icon aria-hidden />
                {suppression ? "Retrait…" : "Retirer la photo"}
              </Button>
            ) : (
              <span aria-hidden />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={fermer}>
                Annuler
              </Button>
              <form action={action}>
                <input type="hidden" name="photo" value={apercu ?? ""} />
                <Button type="submit" size="sm" disabled={!apercu || enCours || compressionEnCours}>
                  {enCours ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden />
                      Envoi…
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </form>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
