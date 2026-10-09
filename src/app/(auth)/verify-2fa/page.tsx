import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { lireDefi2fa } from "@/lib/2fa-methode";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { destinationApresConnexion } from "@/lib/s1-comptes/role-session";
import { Verify2faForm } from "./verify-2fa-form";

// /verify-2fa n'a de sens qu'en plein défi 2FA : cookie de défi présent, pas
// encore de session. Déjà connecté → son espace (le bouton retour ne doit
// pas rouvrir un formulaire mort). Anonyme sans défi → /sign-in : sans défi,
// chaque envoi comme chaque vérification échoue en « vérification expirée ».
export default async function Verify2faPage() {
  const profil = await profilSession();
  if (profil.type !== "ANONYME") redirect(destinationApresConnexion(profil));
  const jar = await cookies();
  const brut = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (!lireDefi2fa(brut)) redirect("/sign-in");
  return (
    <AuthShell
      title="Second facteur"
      description="Administrateurs : code reçu par SMS ou par email, à chaque connexion."
    >
      <Verify2faForm />
    </AuthShell>
  );
}
