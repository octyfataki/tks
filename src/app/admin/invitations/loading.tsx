export default function ChargementInvitations() {
  return (
    <div
      className="flex flex-1 flex-col gap-4 p-4 pt-4"
      aria-label="Chargement de la liste des invitations envoyées"
    >
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
