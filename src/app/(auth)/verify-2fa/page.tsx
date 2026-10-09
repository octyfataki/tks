import { AuthShell } from "@/components/auth-shell";
import { VerificationSecondFacteur } from "./verification-second-facteur";

export default function Verify2faPage() {
  return (
    <AuthShell
      title="Second facteur"
      description="Administrateurs : code obligatoire à chaque connexion, par application ou par email."
    >
      <VerificationSecondFacteur />
    </AuthShell>
  );
}
