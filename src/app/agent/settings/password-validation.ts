export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}): string | null {
  if (!input.currentPassword) {
    return "Saisissez votre mot de passe actuel.";
  }
  if (input.newPassword.length < 8) {
    return "Le nouveau mot de passe doit compter au moins 8 caractères.";
  }
  if (input.newPassword !== input.confirmation) {
    return "La confirmation ne correspond pas au nouveau mot de passe.";
  }
  if (input.newPassword === input.currentPassword) {
    return "Le nouveau mot de passe doit être différent de l'actuel.";
  }
  return null;
}

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  label: string;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return { level: 0, label: "Trop court" };
  }
  let score = 1;
  if (password.length >= 12) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const level = Math.min(score, 4) as PasswordStrengthLevel;
  const labels: Record<PasswordStrengthLevel, string> = {
    0: "Trop court",
    1: "Faible",
    2: "Moyen",
    3: "Bien",
    4: "Fort",
  };
  return { level, label: labels[level] };
}