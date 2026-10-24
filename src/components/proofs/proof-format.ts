export function dateCourte(valeur: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valeur);
}

export function dureeMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const heures = Math.floor(total / 60);
  const reste = total % 60;
  if (heures < 24) {
    return reste === 0 ? `${heures} h` : `${heures} h ${reste} min`;
  }
  const jours = Math.floor(heures / 24);
  return `${jours} j`;
}

export function attenteDepuisMinutes(minutes: number): string {
  return minutes < 1 ? "à l'instant" : `attend ${dureeMinutes(minutes)}`;
}

export function attenteDepuis(
  depuis: Date,
  maintenant: Date = new Date(),
): string {
  const minutes = Math.max(
    0,
    Math.round((maintenant.getTime() - depuis.getTime()) / 60000),
  );
  return attenteDepuisMinutes(minutes);
}

export function montant(valeur: number, devise: string): string {
  return `${valeur.toLocaleString("fr-FR")} ${devise}`;
}
