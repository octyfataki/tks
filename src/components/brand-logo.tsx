import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  height?: number;
};

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
