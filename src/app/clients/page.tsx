import Link from "next/link";

// Espace client — écran d'accueil. Contenu seul : la coquille navigation +
// ClientHeader vit dans /clients/layout et persiste pendant la navigation.
// Le dossier client, la ligne de crédit et les commandes sont le sujet de
// S4 : on pose ici l'espace, sa porte, et la destination de connexion d'un
// client.
export default function ClientsAccueilPage() {
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
          href="/clients/profil"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Mon compte
        </Link>
        <Link href="/clients/aide" className="text-sm underline underline-offset-4">
          Aide — vos raccourcis client
        </Link>
      </div>
    </div>
  );
}
