"use server";

// S1-03 : les quatre gestes vivent dans le module partagé
// @/components/clients/actions (mêmes gestes côté admin et côté agent,
// permission `client.valider` exigée pour les agents). Ce module ne fait
// que réexporter pour garder les imports existants (`./actions`) valides.
export {
  validerCompteClientAction,
  refuserCompteClientAction,
  validerCompteClientComptoirAction,
  revoquerCompteClientAction,
  type ResultatDecision,
} from "@/components/clients/actions";
