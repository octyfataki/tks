import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AideRaccourci } from "@/lib/aide-content";

/**
 * Une carte = un raccourci. Titre + description, carte entière cliquable
 * quand l'écran existe ; inerte avec pastille « Bientôt » sinon.
 * Composition Card complète (Header + Title + Description), jamais de
 * lien mort.
 */
export function AideRaccourciCard({ raccourci }: { raccourci: AideRaccourci }) {
  if (!raccourci.href) {
    return (
      <Card className="h-full opacity-70">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">{raccourci.label}</CardTitle>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Bientôt
            </span>
          </div>
          <CardDescription>{raccourci.description}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Link
      href={raccourci.href}
      className={cn(
        "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
      )}
    >
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">{raccourci.label}</CardTitle>
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          </div>
          <CardDescription>{raccourci.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
