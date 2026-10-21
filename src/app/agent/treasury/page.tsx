import { Badge } from "@/components/ui/badge";
import { PermissionRefusee } from "@/components/permission-denied";
import { TreasuryConsole } from "@/components/treasury/treasury-console";
import { lireConsoleTresorerie, peutCorriger, peutMouvementer } from "@/modules/treasury/publish";

export default async function TresorerieAgentPage() {
  const acteur = await peutMouvementer();
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Caisse et mobile money"
        detail="Enregistrer un mouvement au comptoir — entrée ou sortie — exige la permission tresorerie.mouvement."
        action="Demandez la permission « tresorerie.mouvement » à l'administrateur principal."
      />
    );
  }
  const correction = await peutCorriger();
  const consoleTresorerie = await lireConsoleTresorerie();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <header>
        <Badge variant="outline">Trésorerie</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Caisse et mobile money
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Le solde de chaque compte se calcule depuis ses mouvements : ce qui
          reste en caisse et sur chaque réseau, sans ressaisie.
        </p>
      </header>

      <TreasuryConsole
        comptes={consoleTresorerie.comptes}
        mouvements={consoleTresorerie.mouvements}
        totaux={consoleTresorerie.totaux}
        peutCorriger={correction !== null}
      />
    </div>
  );
}
