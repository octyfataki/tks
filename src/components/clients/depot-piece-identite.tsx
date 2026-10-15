"use client";

import * as React from "react";
import { FileUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPES_PIECE, typePieceValide } from "@/lib/s1-comptes/pieces-fichiers";
import { cn } from "@/lib/utils";

export type PieceDeposeeApercu = {
  id: string;
  typePiece: string;
  mime: string;
  vue: boolean;
  deposeLe: string;
};

export type IssueDepotPiece = { ok: true } | { ok: false; erreur: string };

async function compresserImage(fichier: File): Promise<File> {
  const url = URL.createObjectURL(fichier);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image illisible"));
      img.src = url;
    });
    const max = 1600;
    const echelle = Math.min(
      1,
      max / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.naturalWidth * echelle);
    toile.height = Math.round(image.naturalHeight * echelle);
    const contexte = toile.getContext("2d");
    if (!contexte) throw new Error("canvas indisponible");
    contexte.drawImage(image, 0, 0, toile.width, toile.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      toile.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) throw new Error("compression impossible");
    const nom = fichier.name.replace(/\.[^.]*$/, "") || "piece";
    return new File([blob], `${nom}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const ACCEPTE = "image/jpeg,image/png,image/webp,.pdf";

function formaterTaille(octets: number): string {
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  return `${(octets / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

export function FormulaireDepotPiece({
  pieces,
  deposer,
  onPieceDeposee,
  titre,
  description,
  libelleEnvoi,
  afficherDeposees = true,
  etiquetteSection = "Déposer votre pièce d'identité",
}: {
  pieces: PieceDeposeeApercu[];
  deposer: (donnees: FormData) => Promise<IssueDepotPiece>;
  onPieceDeposee: () => void;
  titre: string;
  description: string;
  libelleEnvoi: string;
  afficherDeposees?: boolean;
  etiquetteSection?: string;
}) {
  const [resultat, setResultat] =
    React.useState<IssueDepotPiece | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [typePiece, setTypePiece] = React.useState<string>("CNI");
  const [fichier, setFichier] = React.useState<File | null>(null);
  const [apercu, setApercu] = React.useState<string | null>(null);
  const [attire, setAttire] = React.useState(false);
  const [erreurLocale, setErreurLocale] = React.useState<string | null>(null);
  const apercuRef = React.useRef<string | null>(null);

  React.useEffect(
    () => () => {
      if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    },
    [],
  );

  function libererApercu() {
    if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    apercuRef.current = null;
    setApercu(null);
  }

  function choisir(candidat: File | null) {
    if (!candidat) return;
    if (
      !candidat.type.startsWith("image/") &&
      candidat.type !== "application/pdf"
    ) {
      setErreurLocale("Image (JPEG, PNG, WebP) ou PDF uniquement.");
      return;
    }
    setErreurLocale(null);
    setResultat(null);
    libererApercu();
    setFichier(candidat);
    if (candidat.type.startsWith("image/")) {
      const url = URL.createObjectURL(candidat);
      apercuRef.current = url;
      setApercu(url);
    }
  }

  function annuler() {
    libererApercu();
    setFichier(null);
    setResultat(null);
    setErreurLocale(null);
  }

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreurLocale(null);
    if (!typePieceValide(typePiece)) {
      setErreurLocale("Type de pièce inconnu.");
      return;
    }
    if (!fichier || fichier.size === 0) {
      setErreurLocale("Choisissez un fichier image ou PDF.");
      return;
    }
    setEnCours(true);
    try {
      let envoi = fichier;
      if (fichier.type.startsWith("image/")) {
        try {
          envoi = await compresserImage(fichier);
        } catch {
          setErreurLocale("Fichier illisible, essayez un autre fichier.");
          return;
        }
      } else if (fichier.type !== "application/pdf") {
        setErreurLocale("Image (JPEG, PNG, WebP) ou PDF uniquement.");
        return;
      } else if (fichier.size > 5 * 1024 * 1024) {
        setErreurLocale("PDF trop lourd (5 Mo au plus).");
        return;
      }
      const donnees = new FormData();
      donnees.set("typePiece", typePiece);
      donnees.set("fichier", envoi, envoi.name);
      const issue = await deposer(donnees);
      setResultat(issue);
      if (issue.ok) {
        setFichier(null);
        libererApercu();
        onPieceDeposee();
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section
      aria-label={etiquetteSection}
      className="rounded-xl border bg-card p-5 sm:p-6"
    >
      <h2 className="text-sm font-semibold">{titre}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      <form onSubmit={envoyer} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="typePiece">Type de pièce</Label>
          <Select
            value={typePiece}
            onValueChange={(valeur) => setTypePiece(String(valeur))}
          >
            <SelectTrigger id="typePiece" aria-label="Type de pièce">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES_PIECE.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 has-focus-visible:ring-2 has-focus-visible:ring-ring/30 has-focus-visible:rounded-lg">
          <Label htmlFor="fichier">Fichier</Label>
          <input
            id="fichier"
            name="fichier"
            type="file"
            accept={ACCEPTE}
            className="sr-only"
            onChange={(e) => {
              const choisi = e.currentTarget.files?.[0] ?? null;
              e.currentTarget.value = "";
              choisir(choisi);
            }}
          />
          <label
            htmlFor="fichier"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setAttire(true);
            }}
            onDragLeave={() => setAttire(false)}
            onDrop={(e) => {
              e.preventDefault();
              setAttire(false);
              choisir(e.dataTransfer.files?.[0] ?? null);
            }}
            data-attire={attire || undefined}
            className={cn(
              "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
              "border-input bg-background hover:border-primary/60",
              "data-[attire]:border-primary data-[attire]:bg-primary/5",
            )}
          >
            {fichier ? (
              <>
                {apercu ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apercu}
                    alt="Aperçu de la pièce choisie"
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                ) : (
                  <span className="rounded-md border border-input bg-muted px-2 py-1 text-[11px] font-bold tracking-wide">
                    PDF
                  </span>
                )}
                <span className="max-w-full truncate text-xs font-medium">
                  {fichier.name} · {formaterTaille(fichier.size)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Cliquez ou déposez pour changer
                </span>
              </>
            ) : (
              <>
                <FileUpIcon className="size-5 text-muted-foreground" />
                <span className="text-xs font-medium">
                  Cliquez ou déposez votre pièce ici
                </span>
                <span className="text-[11px] text-muted-foreground">
                  JPEG, PNG, WebP ou PDF (5 Mo au plus)
                </span>
              </>
            )}
          </label>
        </div>

        {afficherDeposees && pieces.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Pièces déjà déposées
            </p>
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {pieces.map((piece) => (
                <li key={piece.id} className="w-20 shrink-0">
                  <a
                    href={`/api/pieces-clients/${piece.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                    aria-label={`${piece.typePiece}, voir en grand`}
                  >
                    {piece.mime.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/pieces-clients/${piece.id}`}
                        alt=""
                        loading="lazy"
                        className="h-20 w-20 object-cover"
                      />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center bg-muted text-[11px] font-bold tracking-wide text-muted-foreground">
                        PDF
                      </span>
                    )}
                  </a>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {piece.typePiece} ·{" "}
                    {new Date(piece.deposeLe).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {piece.vue ? "Vue par le distributeur" : "En vérification"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {erreurLocale ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erreurLocale}
          </p>
        ) : null}
        {resultat && !resultat.ok ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {resultat.erreur}
          </p>
        ) : null}
        {resultat && resultat.ok ? (
          <p role="status" className="text-xs font-medium text-green-700 dark:text-green-400">
            Pièce reçue : un humain va la vérifier.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={annuler}
            disabled={enCours || (!fichier && !resultat && !erreurLocale)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={enCours || !fichier}>
            <FileUpIcon />
            {enCours ? "Envoi…" : libelleEnvoi}
          </Button>
        </div>
      </form>
    </section>
  );
}
