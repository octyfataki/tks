import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type AppLoaderProps = {
  message?: string;
  variant?: "fullscreen" | "inline";
  className?: string;
};

export function AppLoader({
  message = "Chargement de TKS",
  variant = "fullscreen",
  className,
}: AppLoaderProps) {
  const fullscreen = variant === "fullscreen";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-background",
        fullscreen ? "min-h-dvh px-4 py-6" : "px-4 py-10",
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

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative flex size-28 items-center justify-center">
          <span
            aria-hidden
            className="tks-loader-ping absolute inset-0 rounded-full border border-primary/30"
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full border border-dashed border-primary/30"
          />
          <span aria-hidden className="tks-loader-orbit absolute inset-0">
            <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          </span>
          <span className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-lg">
            <BrandLogo height={26} />
          </span>
        </div>

        <p className="mt-5 text-sm font-medium text-foreground">
          {message}
          <span aria-hidden className="tks-loader-dots" />
        </p>

        <p className="mt-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          TKS · crédit airtime en RDC
        </p>
      </div>
    </div>
  );
}
