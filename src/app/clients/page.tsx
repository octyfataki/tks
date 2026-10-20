import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClientHomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
        Espace client
      </span>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Votre compte
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Votre dossier, vos commandes et vos soldes arrivent avec la gestion des
        clients et des lignes de crédit. Cet écran existe d&apos;abord pour que
        la connexion d&apos;un client atterrisse ici, et nulle part ailleurs.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/clients/profile"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Mon compte
        </Link>
        <Link href="/clients/help" className="text-sm underline underline-offset-4">
          Aide — vos raccourcis client
        </Link>
      </div>
      <Link
        href="/clients/pricing"
        className="block w-full max-w-md text-left"
      >
        <Card size="sm" className="transition-colors hover:ring-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Tarifs du jour</CardTitle>
            <CardDescription>
              Les prix des 100 unités pour Orange, Airtel, Africell et Vodacom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Voir les tarifs
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
