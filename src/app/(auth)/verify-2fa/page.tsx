import { AuthShell } from "@/components/auth-shell";
import { Verify2faForm } from "./verify-2fa-form";

export default function Verify2faPage() {
  return (
    <AuthShell
      title="Second facteur"
      description="Administrateurs : code reçu par SMS ou par email, à chaque connexion."
    >
      <Verify2faForm />
    </AuthShell>
  );
}
