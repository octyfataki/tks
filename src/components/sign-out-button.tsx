"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Bouton de déconnexion réutilisable pour les espaces sans sidebar
// (/agent, /clients). Même logique que NavUser : signOut, toast,
// retour vers /sign-in. La sidebar admin garde son entrée dans le menu
// utilisateur, ici le bouton est visible directement.
export function BoutonDeconnexion({ className }: { className?: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function deconnexion() {
    if (enCours) return;
    setEnCours(true);
    try {
      await signOut();
      toast.add({ type: "success", title: "Déconnexion réussie" });
      router.push("/sign-in");
      router.refresh();
    } catch {
      toast.add({
        type: "error",
        title: "Échec de la déconnexion",
        description: "Réessayez.",
      });
      setEnCours(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={deconnexion}
      disabled={enCours}
      className={cn(className)}
    >
      <LogOutIcon />
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </Button>
  );
}
