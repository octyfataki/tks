import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Confidentialité — TKS",
  description:
    "Données collectées par TKS, finalités, durées de conservation et droits des personnes concernées.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement est [à compléter : raison sociale], joignable à contact@tks.cd. Toute demande relative à vos données personnelles est à adresser à cette adresse.",
    ],
  },
  {
    heading: "Données collectées",
    paragraphs: [
      "TKS ne collecte que ce qu'un compte client et une gestion de crédit airtime exigent.",
    ],
    items: [
      "Identité : nom, adresse email, numéro de téléphone.",
      "Pièce d'identité : une image de pièce, déposée pour la validation du compte, lue par un humain.",
      "Données d'exploitation : commandes, grilles tarifaires, taux en vigueur, créances, encaissements, verses de caisse, et le journal d'audit qui retrace qui a écrit quoi.",
      "Journaux de connexion et de sécurité : sessions ouvertes, appareils utilisés, révocations.",
    ],
  },
  {
    heading: "Finalités",
    paragraphs: [
      "Les données sont utilisées pour faire fonctionner le service, et rien d'autre.",
    ],
    items: [
      "Créer les comptes, les valider et les révoquer.",
      "Servir les commandes de crédit airtime et en tracer la preuve de paiement.",
      "Suivre les créances, les encaissements et la trésorerie.",
      "Attribuer chaque écriture à son auteur, et garantir qu'un journal d'audit ne peut pas être réécrit.",
    ],
  },
  {
    heading: "Conservation hors ligne",
    paragraphs: [
      "Le service est conçu pour fonctionner sans réseau. Une partie des données est donc conservée localement sur l'appareil, puis synchronisée dès que la connexion revient. Cette conservation locale est un fonctionnement normal du service, pas une copie clandestine : [à compléter : durée de conservation sur l'appareil].",
    ],
  },
  {
    heading: "Destinataires",
    paragraphs: [
      "Les données sont accessibles aux seules personnes habilitées de l'équipe qui administre TKS, au stricte besoin de leur fonction. Elles sont également traitées par l'hébergeur [à compléter : raison sociale de l'hébergeur] et, le cas échéant, par [à compléter : autres sous-traitants]. Elles ne sont ni vendues, ni louées, ni cédées à des tiers à des fins publicitaires.",
    ],
  },
  {
    heading: "Durées de conservation",
    paragraphs: [
      "Les durées applicables sont [à compléter : durée pour les pièces d'identité], [à compléter : durée pour les dossiers clients], [à compléter : durée pour les journaux d'audit]. Passé ces durées, les données sont supprimées ou anonymisées.",
    ],
  },
  {
    heading: "Vos droits",
    paragraphs: [
      "Vous pouvez demander à connaître, corriger, supprimer ou opposer l'usage de vos données, et demander leur portabilité. Adressez votre demande à contact@tks.cd ; une réponse vous sera apportée dans [à compléter : délai de réponse]. Une réclamation peut être adressée à [à compléter : autorité de protection des données compétente].",
    ],
  },
  {
    heading: "Transferts hors de la RDC",
    paragraphs: [
      "[à compléter : pays de destination éventuels et garanties appliquées, ou mention de l'absence de transfert hors de la RDC].",
    ],
  },
  {
    heading: "Sécurité",
    paragraphs: [
      "Les échanges sont chiffrés. L'accès au service exige un mot de passe et, pour les comptes internes, un second facteur. Les écritures sont journalisées de manière à ce qu'aucune ne puisse être supprimée ou modifiée après coup.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Confidentialité"
      intro="Quelles données TKS collecte, pourquoi, combien de temps elles sont gardées, et comment exercer vos droits. Les éléments entre crochets doivent être complétés avant la mise en production."
      sections={SECTIONS}
      updatedAt="21 octobre 2026"
    />
  );
}
