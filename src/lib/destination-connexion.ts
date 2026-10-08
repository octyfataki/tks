// Poste des formulaires de connexion : la session better-auth ne porte pas le
// rôle, c'est le serveur qui résout la destination. Repli sur /sign-in si le
// réseau lâche — on ne devine jamais un espace à l'aveugle.

export type CodeDestination = "OK" | "REVOQUE" | "SUSPENDU" | "INCONNU";

export type ReponseDestination = {
  destination: string;
  code: CodeDestination;
};

const REPLI: ReponseDestination = { destination: "/sign-in", code: "INCONNU" };

export async function demanderDestination(): Promise<ReponseDestination> {
  try {
    const reponse = await fetch("/api/session/destination", {
      cache: "no-store",
    });
    if (!reponse.ok) return REPLI;
    const corps = (await reponse.json()) as Partial<ReponseDestination> | null;
    const destination = corps?.destination;
    const code = corps?.code;
    if (typeof destination !== "string" || !destination.startsWith("/")) {
      return REPLI;
    }
    return {
      destination,
      code:
        code === "OK" || code === "REVOQUE" || code === "SUSPENDU"
          ? code
          : "INCONNU",
    };
  } catch {
    return REPLI;
  }
}
