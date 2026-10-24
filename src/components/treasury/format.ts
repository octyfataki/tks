const NOMBRE = new Intl.NumberFormat("fr-FR");

const JOUR = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const INSTANT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function montantLabel(montant: number, devise: string): string {
  return `${NOMBRE.format(montant)} ${devise}`;
}

export function soldeLabel(montant: number, devise: string): string {
  return montant < 0
    ? `−${NOMBRE.format(-montant)} ${devise}`
    : `${NOMBRE.format(montant)} ${devise}`;
}

export function jourLabel(date: Date): string {
  return JOUR.format(date);
}

export function instantLabel(date: Date): string {
  return INSTANT.format(date);
}

export function jourIso(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export function heureIso(date: Date): string {
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${heures}:${minutes}`;
}
