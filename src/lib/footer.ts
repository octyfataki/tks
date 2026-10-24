export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: "Connexion", href: "/sign-in" },
  { label: "Créer un compte client", href: "/sign-up" },
  { label: "Mentions légales", href: "/legal-notice" },
  { label: "Confidentialité", href: "/privacy" },
];

export const FOOTER_CONTACT = {
  email: "contact@tks.cd",
  city: "Kinshasa, RDC",
};

export const FOOTER_TAGLINE = "Crédit airtime en RDC";
