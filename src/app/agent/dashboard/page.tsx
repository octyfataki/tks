import Link from "next/link";

// Espace agent — écran d'accueil. Les permissions de l'agent (ce qu'il sert,
// encaisse et valide) sont le sujet de S2 : ici on pose seulement l'espace
// et sa porte, distincts de ceux des administrateurs.
export default function AgentDashboardPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
        Espace agent de service
      </span>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Tableau de bord agent
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Le service des commandes, l&apos;encaissement au comptoir et la
        validation des preuves de paiement arrivent avec les rôles et les
        permissions. Cet écran existe d&apos;abord pour que la connexion d&apos;un
        agent atterrisse ici, et nulle part ailleurs.
      </p>
      <Link href="/agent/aide" className="text-sm underline underline-offset-4">
        Aide — vos raccourcis agent
      </Link>
    </main>
  );
}
