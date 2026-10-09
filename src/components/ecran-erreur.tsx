import type { CSSProperties, ReactNode } from "react";
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
 * Parti pris : le registre, pas la carte SaaS. Une seule colonne alignée à
 * gauche, un seul fond en nappe de points, une seule entrée en fondu. Le seul
 * geste mémorable est la souche perforée qui affirme que les chiffres sont
 * intacts. Aucune nouvelle palette ni police, aucun JS client, aucun appel
 * réseau — affichable hors-ligne. Le repère creux dit l'absence (404), le
 * repère plein signale le problème sans crier (erreur en encre, seul le
 * trait passe au rouge).
 */
export function EcranErreur({
  code,
  titre,
  message,
  actions,
  tonalite = "neutre",
  className,
}: EcranErreurProps) {
  const estCourt = code.length <= 4;
  const repereStyle: CSSProperties =
    tonalite === "erreur"
      ? {}
      : {
          color: "transparent",
          WebkitTextStroke: "2px var(--foreground)",
        };

  return (
    <div
      className={cn(
        "relative min-h-dvh overflow-hidden bg-background",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent) 1.2px, transparent 1.2px)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 40%, black 20%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 40%, black 20%, transparent 78%)",
        }}
      />

      <main
        aria-labelledby="ecran-erreur-titre"
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-14"
      >
        <div className="tks-erreur-enter">
          <BrandLogo height={28} />
          <p
            aria-hidden
            style={repereStyle}
            className={cn(
              "mt-10 font-semibold tracking-tight tabular-nums select-none",
              estCourt
                ? "text-[clamp(5rem,18vw,8.5rem)] leading-[0.85]"
                : "text-[clamp(2.75rem,9vw,4.5rem)] leading-[1]",
              tonalite === "erreur" && "text-foreground",
            )}
          >
            {code}
          </p>
          <span
            aria-hidden
            className={cn(
              "mt-5 block h-1 w-10 rounded-full",
              tonalite === "erreur" ? "bg-destructive" : "bg-primary",
            )}
          />
          <h1
            id="ecran-erreur-titre"
            className="mt-4 max-w-[22ch] text-2xl font-semibold tracking-tight text-balance"
          >
            {titre}
          </h1>
          <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">{actions}</div>

          <section
            aria-hidden
            className="mt-10 rounded-lg border bg-card p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold tracking-tight">
                Registre intact
              </p>
              <p className="text-xs text-muted-foreground">
                Vos chiffres restent tels quels.
              </p>
            </div>
            <ul className="mt-4 grid grid-cols-3 divide-x divide-dashed divide-border border-y border-dashed border-border py-3">
              {[
                ["Commandes", "Inchangées"],
                ["Créances", "Inchangées"],
                ["Paiements", "Inchangés"],
              ].map(([ligne, etat]) => (
                <li key={ligne} className="px-3 first:pl-0 last:pr-0">
                  <p className="flex items-center gap-1.5 text-sm">
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    {ligne}
                  </p>
                  <p className="mt-1 pl-3 text-xs text-muted-foreground">
                    {etat}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Il ne manque qu&apos;une page, pas un franc. Montants en CDF au
              taux du jour.
            </p>
          </section>

          <p className="mt-8 text-xs text-muted-foreground">
            Crédit airtime en RDC
          </p>
        </div>
      </main>
    </div>
  );
}
