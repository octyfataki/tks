import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

type AuthShellProps = {
  title: string;
  /** Conservé pour compatibilité d'API mais non affiché : le panneau
   *  gauche ne garde que le titre et le formulaire, le contexte vit
   *  dans le panneau droit. */
  description?: string;
  children: ReactNode;
  sideTitle?: string;
  sidePoints?: string[];
  sideNote?: string;
};

const DEFAUT_POINTS = [
  "Commandes servies et créances suivies en CDF au taux du jour",
  "Encaissé du jour par caisse et par réseau, sans rien coller à la main",
  "Au comptoir comme sur le terrain, même sans réseau",
];

/**
 * Coquille commune aux maquettes S1 (statique, non câblée).
 * Mise en page inspirée d'une référence split (formulaire + panneau
 * contexte) : à gauche le formulaire, à droite un rappel S1 avec
 * cercles décoratifs aux couleurs du thème. Tous les comptes utilisent
 * email + mot de passe, avec une seule inscription : /sign-up demande
 * d'abord le profil (client ou administrateur, deux boutons façon
 * providers) puis affiche les champs. L'agent de service passe par son
 * lien d'invitation. Aucun bouton OAuth : S1 l'interdit.
 */
export function AuthShell({
  title,
  description,
  children,
  sideTitle = "Tout le crédit airtime, sans le classeur",
  sidePoints = DEFAUT_POINTS,
  sideNote = "Compte validé sur pièce d'identité : chaque écriture est attribuée à son auteur, chaque chiffre se vérifie jusqu'à la créance.",
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-background px-4 py-6">
      {/* Fond en points du thème, très atténué */}
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
      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-lg lg:grid-cols-[1.1fr_1fr]">
        {/* Panneau formulaire */}
        <div className="flex flex-col p-5 sm:p-6">
          <div className="mb-5">
            <Link href="/" aria-label="TKS — accueil" className="inline-flex">
              <BrandLogo height={28} />
            </Link>
            <h1 className="font-heading mt-3 text-xl font-semibold tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
            <span
              aria-hidden
              className="mt-1 block h-0.5 w-10 rounded-full bg-primary"
            />
          </div>
          <div className="mt-4 flex-1">{children}</div>
        </div>

        {/* Panneau contexte */}
        <div className="relative hidden flex-col justify-center overflow-hidden bg-muted p-6 lg:flex">
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
            className="pointer-events-none absolute -top-8 -right-8 size-48 rounded-full border"
            style={{
              borderColor:
                "color-mix(in oklch, var(--primary) 14%, transparent)",
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
          <div className="relative">
            <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              TKS · crédit airtime en RDC
            </p>
            <p className="mt-3 font-heading text-xl leading-snug font-semibold">
              {sideTitle}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {sidePoints.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border bg-card p-3 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Reste à payer
                </span>
                <span className="font-heading text-lg font-semibold">
                  65 000 CDF
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Dette 100 USD</span>
                  <span>≈ 230 000 FC</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Paiement espèces</span>
                  <span>− 50 000 CDF</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Paiement 50 USD</span>
                  <span>≈ − 115 000 FC</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Taux du jour : 1 USD = 2 300 CDF
              </p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {sideNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
