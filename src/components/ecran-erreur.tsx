import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export type EcranErreurProps = {
  /** Grand repère typographique : "404" ou "Erreur". Élément mémorable unique. */
  code: string;
  /** Titre lu par les lecteurs d'écran (h1). Voix active, sans jargon Excel. */
  titre: string;
  /** Une seule phrase : ce qui s'est passé et que les chiffres sont intacts. */
  message: string;
  /** Boutons d'action (Liens et réessai fournis par l'appelant). */
  actions: ReactNode;
  /** Teinte du repère : neutre pour une page introuvable, erreur sinon. */
  tonalite?: "neutre" | "erreur";
  className?: string;
};

/**
 * Coquille unique des pages d'échec (404, erreur, erreur globale).
 *
 * Un seul module profond pour trois conventions fines : l'interface est la
 * surface de test. Reprend le fond des écrans existants (nappe de points,
 * cercles, halo) aux couleurs du thème, sans nouvelle palette ni nouvelle
 * police : aucun JS client, aucun appel réseau — affichable hors-ligne.
 */
export function EcranErreur({
  code,
  titre,
  message,
  actions,
  tonalite = "neutre",
  className,
}: EcranErreurProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 18%, transparent) 1.2px, transparent 1.2px)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full border"
        style={{
          borderColor:
            "color-mix(in oklch, var(--primary) 30%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full border"
        style={{
          borderColor:
            "color-mix(in oklch, var(--primary) 20%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 22%, transparent), transparent)",
        }}
      />

      <main
        aria-labelledby="ecran-erreur-titre"
        className="relative z-10 w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
      >
        <BrandLogo height={28} />
        <p
          aria-hidden
          className={cn(
            "mt-6 text-6xl font-semibold tracking-tight",
            tonalite === "erreur" ? "text-destructive" : "text-foreground",
          )}
        >
          {code}
        </p>
        <span aria-hidden className="mt-2 block h-1 w-10 rounded-full bg-primary" />
        <h1
          id="ecran-erreur-titre"
          className="mt-4 text-xl font-semibold tracking-tight"
        >
          {titre}
        </h1>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">{actions}</div>
        <p className="mt-6 text-xs text-muted-foreground">
          TKS · crédit airtime en RDC
        </p>
      </main>
    </div>
  );
}
