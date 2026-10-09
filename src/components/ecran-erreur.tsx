import type { ReactNode } from "react";
import { Check, Compass, ShieldCheck, Unplug } from "lucide-react";
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
 * Scène « liaison interrompue » : à gauche l'explication alignée à
 * gauche sous un repère géant traversé par une ligne pointillée qui se
 * rompt — la liaison a lâché. À droite un reçu de continuité qui liste
 * ce qui reste intact (commandes, créances, paiements). La perforation
 * verticale qui sépare les deux panneaux est l'unique élément
 * mémorable ; tout le reste est silencieux.
 *
 * Aucun JS client, aucun appel réseau — affichable hors-ligne.
 * Reprend les couleurs du thème, sans nouvelle palette ni nouvelle
 * police.
 */
export function EcranErreur({
  code,
  titre,
  message,
  actions,
  tonalite = "neutre",
  className,
}: EcranErreurProps) {
  const enErreur = tonalite === "erreur";
  const IconeStatut = enErreur ? Unplug : Compass;

  return (
    <div
      className={cn(
        "relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-8",
        className,
      )}
    >
      {/* Fond en points du thème, très atténué — identique au login. */}
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
      {/* Anneau lointain, seule présence décorative hors déchirure. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 size-[28rem] rounded-full border"
        style={{
          borderColor:
            "color-mix(in oklch, var(--primary) 22%, transparent)",
        }}
      />

      <main
        aria-labelledby="ecran-erreur-titre"
        className="tks-ticket-enter relative z-10 mx-auto grid w-full max-w-5xl items-stretch gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-0"
      >
        {/* Panneau explication */}
        <div className="flex flex-col justify-center lg:pr-12">
          <BrandLogo height={28} />
          <p
            className={cn(
              "mt-8 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
              enErreur
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            <IconeStatut className="size-3.5" aria-hidden />
            {enErreur ? "Liaison interrompue" : "Adresse introuvable"}
          </p>

          {/* Repère géant traversé par la ligne qui se rompt. */}
          <div className="relative mt-4">
            <p
              aria-hidden
              className={cn(
                "text-[clamp(4.5rem,14vw,9rem)] leading-none font-semibold tracking-tighter",
                enErreur ? "text-destructive" : "text-foreground",
              )}
            >
              {code}
            </p>
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-0 left-0 flex -translate-y-1/2 items-center gap-2"
            >
              <span
                className={cn(
                  "h-0 flex-1 border-t-2 border-dashed",
                  enErreur ? "border-destructive/50" : "border-foreground/25",
                )}
              />
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full border-2 bg-background",
                  enErreur
                    ? "border-destructive/60"
                    : "border-foreground/30",
                )}
              />
              <span className="w-8 shrink-0" />
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full border-2 bg-background",
                  enErreur
                    ? "border-destructive/60"
                    : "border-foreground/30",
                )}
              />
              <span
                className={cn(
                  "h-0 flex-1 border-t-2 border-dashed",
                  enErreur ? "border-destructive/50" : "border-foreground/25",
                )}
              />
            </div>
          </div>

          <h1
            id="ecran-erreur-titre"
            className="mt-6 max-w-[28ch] text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]"
          >
            {titre}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
            {message}
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            TKS · crédit airtime en RDC
          </p>
        </div>

        {/* Perforation + reçu de continuité */}
        <div className="relative flex flex-col justify-center lg:pl-12">
          {/* Encoches de la perforation, décoratives. */}
          <span
            aria-hidden
            className="absolute top-1/2 -left-3 hidden size-6 -translate-y-1/2 rounded-full border bg-background lg:block"
            style={{
              borderColor:
                "color-mix(in oklch, var(--border) 100%, transparent)",
            }}
          />
          <section
            aria-label="Continuité des chiffres"
            className="relative rounded-xl border bg-card p-5 shadow-none sm:p-6 lg:rounded-l-none lg:border-y lg:border-r lg:border-l-2 lg:border-dashed"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Chiffres intacts
                </p>
                <p className="text-xs text-muted-foreground">
                  Vos chiffres restent tels quels
                </p>
              </div>
            </div>

            <ul className="mt-5 flex flex-col">
              {[
                ["Commandes", "conservées"],
                ["Créances", "conservées"],
                ["Paiements", "conservés"],
              ].map(([ligne, etat]) => (
                <li
                  key={ligne}
                  className="flex items-center justify-between gap-3 border-t border-dashed py-3 text-sm last:border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-foreground">{ligne}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Check
                      className="size-3.5 text-primary"
                      strokeWidth={3}
                      aria-hidden
                    />
                    {etat}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Soldes recalculés au taux du jour à la reconnexion.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
