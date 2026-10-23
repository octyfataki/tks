import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales — TKS",
  description:
    "Éditeur, hébergeur et conditions d'utilisation du service TKS, gestion de crédit airtime en RDC.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Éditeur du service",
    paragraphs: [
      "TKS est un service de gestion du crédit airtime destiné aux distributeurs et à leurs clients. Il est édité par [à compléter : raison sociale], [à compléter : forme juridique], immatriculée sous le numéro [à compléter : numéro d'enregistrement], au capital de [à compléter : montant] FC, dont le siège est situé [à compléter : adresse du siège].",
      "Le responsable de la publication est [à compléter : nom et fonction du responsable de la publication].",
    ],
  },
  {
    heading: "Hébergeur",
    paragraphs: [
      "Le service est hébergé par [à compléter : raison sociale de l'hébergeur], [à compléter : adresse de l'hébergeur], joignable au [à compléter : téléphone de l'hébergeur].",
    ],
  },
  {
    heading: "Nature et accès au service",
    paragraphs: [
      "TKS sert à enregistrer les commandes de crédit airtime, les créances des clients, les encaissements et l'état de la trésorerie, en dollars américains et en francs congolais, au taux en vigueur.",
      "L'accès au service suppose la création d'un compte puis sa validation par un humain. Un compte non validé ne donne accès ni à un dossier client ni à un solde.",
    ],
    items: [
      "Chaque compte est rattaché à une personne identifiée ; les écritures sont attribuées à leur auteur.",
      "L'accès peut être révoqué à tout moment par un administrateur ; la révocation est immédiate et tracée.",
      "Toute tentative d'accès sans compte valide est refusée.",
    ],
  },
  {
    heading: "Propriété intellectuelle",
    paragraphs: [
      "Le nom TKS, le logo, l'interface, les textes de l'application et les grilles tarifaires appartiennent à [à compléter : raison sociale] ou font l'objet d'une licence d'utilisation. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Pour toute question relative au service, à son usage ou à la présente page : contact@tks.cd.",
    ],
  },
];

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Qui édite TKS, où il est hébergé, et ce qu'on peut faire du service. Les éléments entre crochets doivent être complétés avant la mise en production."
      sections={SECTIONS}
      updatedAt="21 octobre 2026"
    />
  );
}
