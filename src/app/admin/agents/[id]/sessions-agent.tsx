import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { session } from "@/lib/db/schema/auth-schema";
import { BoutonDeconnexionPartout } from "./bouton-deconnexion";

function dateHeure(valeur: Date): string {
  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sessions actives d'un agent : d'où il est connecté, depuis quand,
 * jusqu'à quand — et le coupe-circuit « Déconnecter partout ».
 * Lecture seule (+ action tracée) : le secret de session ne s'affiche
 * jamais, seul l'appareil et l'adresse suffisent au diagnostic.
 */
export async function SessionsAgent({
  betterAuthUserId,
  agentId,
  peutGerer,
}: {
  betterAuthUserId: string;
  agentId: string;
  peutGerer: boolean;
}) {
  const sessions = await db
    .select({
      id: session.id,
      appareil: session.userAgent,
      adresse: session.ipAddress,
      creeLe: session.createdAt,
      expireLe: session.expiresAt,
    })
    .from(session)
    .where(eq(session.userId, betterAuthUserId))
    .orderBy(desc(session.createdAt))
    .limit(20);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Sessions</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sessions.length === 0
              ? "Aucune session active."
              : `${sessions.length} session${sessions.length > 1 ? "s" : ""} active${sessions.length > 1 ? "s" : ""}.`}
          </p>
        </div>
        <BoutonDeconnexionPartout
          id={agentId}
          nbSessions={sessions.length}
          desactive={!peutGerer}
          motifDesactive="Lecture seule : seul un administrateur principal validé déconnecte."
        />
      </div>
      {sessions.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border px-3 py-2 text-xs"
              title={s.appareil ?? "Appareil inconnu"}
            >
              <dt className="sr-only">Session</dt>
              <dd className="truncate font-medium">
                {(s.appareil || "Appareil inconnu").slice(0, 48)}
              </dd>
              <dd className="mt-0.5 text-muted-foreground tabular-nums">
                {s.adresse ? `${s.adresse} · ` : ""}depuis le {dateHeure(s.creeLe)}
                {" · "}expire le {dateHeure(s.expireLe)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
