import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { lireDefi2fa } from "@/lib/2fa-method";
import { profilSession } from "@/lib/accounts/session-profile";
import { destinationApresConnexion } from "@/lib/accounts/session-role";
import { Verify2faForm } from "./verify-2fa-form";

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
      description="Code reçu par SMS ou par email, à chaque connexion quand il est actif."
    >
      <Verify2faForm />
    </AuthShell>
  );
}
