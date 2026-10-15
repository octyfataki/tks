import type { NextConfig } from "next";

// Routes historically in French, now canonical in English (user decision,
// deviation from GLOSSARY noted in MAP.md). Old URLs redirect permanently
// (308, method-preserving) so saved links keep working. /api/auth is
// never redirected (Better Auth).
const REDIRECTS_ANCIENNES_ROUTES: { source: string; destination: string }[] = [
  { source: "/aide", destination: "/help" },
  { source: "/aide/:path*", destination: "/help/:path*" },
  { source: "/admin/aide", destination: "/admin/help" },
  { source: "/admin/aide/:path*", destination: "/admin/help/:path*" },
  { source: "/agent/aide", destination: "/agent/help" },
  { source: "/agent/aide/:path*", destination: "/agent/help/:path*" },
  { source: "/clients/aide", destination: "/clients/help" },
  { source: "/clients/aide/:path*", destination: "/clients/help/:path*" },
  { source: "/premier-acces/:path*", destination: "/first-access/:path*" },
  { source: "/agent/commandes", destination: "/agent/orders" },
  { source: "/agent/commandes/:path*", destination: "/agent/orders/:path*" },
  { source: "/agent/creances", destination: "/agent/receivables" },
  { source: "/agent/creances/:path*", destination: "/agent/receivables/:path*" },
  { source: "/agent/encaissements", destination: "/agent/payments" },
  { source: "/agent/encaissements/:path*", destination: "/agent/payments/:path*" },
  { source: "/agent/preuves", destination: "/agent/proofs" },
  { source: "/agent/preuves/:path*", destination: "/agent/proofs/:path*" },
  { source: "/admin/journal", destination: "/admin/audit-log" },
  { source: "/admin/journal/:path*", destination: "/admin/audit-log/:path*" },
  { source: "/api/mon-compte/:path*", destination: "/api/my-account/:path*" },
  { source: "/api/pieces-clients/:path*", destination: "/api/client-documents/:path*" },
  { source: "/api/2fa/envoyer-code", destination: "/api/2fa/send-code" },
  { source: "/admin/clients/nouveau", destination: "/admin/clients/new" },
  { source: "/admin/administrateurs", destination: "/admin/administrators" },
  { source: "/admin/administrateurs/:path*", destination: "/admin/administrators/:path*" },
  { source: "/admin/profil", destination: "/admin/profile" },
  { source: "/admin/profil/:path*", destination: "/admin/profile/:path*" },
  { source: "/agent/profil", destination: "/agent/profile" },
  { source: "/agent/profil/:path*", destination: "/agent/profile/:path*" },
  { source: "/clients/profil", destination: "/clients/profile" },
  { source: "/clients/profil/:path*", destination: "/clients/profile/:path*" },
  { source: "/admin/parametres", destination: "/admin/settings" },
  { source: "/admin/parametres/:path*", destination: "/admin/settings/:path*" },
  { source: "/agent/parametres", destination: "/agent/settings" },
  { source: "/agent/parametres/:path*", destination: "/agent/settings/:path*" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return REDIRECTS_ANCIENNES_ROUTES.map(({ source, destination }) => ({
      source,
      destination,
      statusCode: 308,
    }));
  },
};

export default nextConfig;
