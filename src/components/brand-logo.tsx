import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Hauteur en px. La largeur suit le ratio du logo (~1.84:1). */
  height?: number;
};

/**
 * Logo TKS unique, fond transparent.
 * - `/brand/logo.png` : ambre sur transparent, lisible en clair ET en sombre.
 * Pas de bascule light/dark — une seule image partout.
 */
export function BrandLogo({ className, height = 32 }: BrandLogoProps) {
  const width = Math.round(height * 1.84);
  return (
    <span className={cn("inline-flex items-center", className)} aria-label="TKS">
      <Image
        src="/brand/logo.png"
        alt="TKS"
        width={width}
        height={height}
        priority
        className="h-auto w-auto"
        style={{ height }}
      />
    </span>
  );
}
