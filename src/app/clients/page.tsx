import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { estStatutProfil, profilsClients } from "@/lib/db/schema/s4-clients";
import { profilAutorisePourCompte } from "@/lib/s4-clients/acces-profil";

export default async function ClientHomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  let nomProfil: string | null = null;
  let statutProfil: "EN_EVALUATION" | "PRIVILEGIE" | null = null;
  let plafond: { montant: number; devise: string } | null = null;

  if (userId) {
    const comptes = await db
      .select({ id: comptesClients.id, etat: comptesClients.etat })
      .from(comptesClients)
      .where(eq(comptesClients.betterAuthUserId, userId))
      .limit(1);
    const compte = comptes[0];
    if (compte?.etat === "VALIDE") {
      const autorise = await profilAutorisePourCompte(compte.id);
      if (autorise) {
        const lignes = await db
          .select({
            nom: profilsClients.nom,
            statut: profilsClients.statut,
            plafondMontant: profilsClients.plafondMontant,
            plafondDevise: profilsClients.plafondDevise,
          })
          .from(profilsClients)
          .where(eq(profilsClients.id, autorise.profilClientId))
          .limit(1);
        const boutique = lignes[0];
        if (boutique && estStatutProfil(boutique.statut)) {
          nomProfil = boutique.nom;
          statutProfil = boutique.statut;
          plafond = {
            montant: boutique.plafondMontant,
            devise: boutique.plafondDevise,
          };
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
        Espace client
      </span>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {nomProfil ?? "Votre compte"}
      </h1>

      {nomProfil && plafond ? (
        <>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Votre boutique est enregistrée. Voici ce qui compte aujourd&apos;hui.
          </p>
          <dl className="grid w-full max-w-sm gap-3 text-left sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-3">
              <dt className="text-[11px] text-muted-foreground">Statut de crédit</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {statutProfil === "PRIVILEGIE" ? "Privilégié" : "En évaluation"}
              </dd>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <dt className="text-[11px] text-muted-foreground">Plafond de crédit</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums">
                {plafond.montant.toLocaleString("fr-FR")} {plafond.devise}
              </dd>
            </div>
          </dl>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Vos commandes et vos dettes arrivent avec la gestion des commandes.
          </p>
        </>
      ) : (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Vos profil, commandes et soldes arrivent avec la gestion des clients et
          des lignes de crédit. Cet écran existe d&apos;abord pour que la
          connexion d&apos;un client atterrisse ici, et nulle part ailleurs.
        </p>
      )}

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
    </div>
  );
}