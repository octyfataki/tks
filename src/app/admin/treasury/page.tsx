import { Badge } from "@/components/ui/badge";
import { PermissionRefusee } from "@/components/permission-denied";
import { TreasuryConsole } from "@/components/treasury/treasury-console";
import { lireConsoleTresorerie, peutCorriger, peutMouvementer } from "@/modules/treasury/publish";

export default async function TresorerieAdminPage() {
  const acteur = await peutMouvementer();
  if (!acteur) {
    return (
      <PermissionRefusee
        titre="Caisse et mobile money"
        detail="Tenir la trésorerie — ouvrir un compte, enregistrer un mouvement, transférer — exige la permission tresorerie.mouvement. L'administrateur technique n'y touche jamais."
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
          Chaque compte est tenu dans une seule devise et son solde se calcule
          depuis ses mouvements : rien n&apos;est stocké, rien n&apos;est
          effacé. Une écriture fausse se corrige par une écriture inverse,
          jamais par une suppression.
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
