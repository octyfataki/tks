import type { Profil } from "@/lib/accounts/session-role";
import { DESTINATION_CONNEXION } from "@/lib/accounts/session-role";

export type AideNiveau = "Client" | "Agent" | "Admin";

export type AideLien = {
  href: string;
  libelle: string;
};

export type AideParcours = {
  id: string;
  niveau: AideNiveau;
  theme: string;
  titre: string;
  resume: string;
  etapes: string[];
  lien?: AideLien;
  garde?: string;
  bientot?: boolean;
  motsCles: string[];
};

export type AideRepere = {
  id: string;
  titre: string;
  texte: string;
  exemple?: string;
  niveaux: AideNiveau[];
};

export type AideRole = {
  niveau: AideNiveau;
  titre: string;
  chapeau: string;
  intro: string;
  depart: string[];
};

export const AIDE_ROLES: Record<AideNiveau, AideRole> = {
  Client: {
    niveau: "Client",
    titre: "Votre crédit, sans zone d’ombre",
    chapeau:
      "Ce qui est ouvert aujourd’hui, et ce qui ne l’est pas encore. Chaque parcours dit où aller, quoi faire, et ce qui bloque.",
    intro:
      "Votre compte, votre pièce d’identité et les tarifs du jour sont accessibles. Les commandes, les preuves de paiement et le suivi des dettes sont annoncés : ils n’arrivent pas avant d’être réellement disponibles.",
    depart: ["client-inscription", "client-tarifs", "client-profil"],
  },
  Agent: {
    niveau: "Agent",
    titre: "Le comptoir, geste par geste",
    chapeau:
      "Les gestes de comptoir déjà construits sont ici. Chaque parcours ouvert mène à l’écran qui agit ; ceux qui ne sont pas encore livrés sont marqués « Bientôt » et ne vous y envoient pas.",
    intro:
      "Valider un compte, lire une fiche, tenir la caisse et le mobile money : ces écrans existent. Les commandes, les preuves et les encaissements sont annoncés séparément, sans lien mort.",
    depart: ["agent-validation", "agent-clients", "agent-tresorerie-mouvement"],
  },
  Admin: {
    niveau: "Admin",
    titre: "Tenir les accès, les prix et l’argent",
    chapeau:
      "Valider, nommer, autoriser, encaisser, corriger. Un parcours par décision, avec la règle qui l’encadre.",
    intro:
      "Les écrans de pilotage et les opérations de commande restent à construire. Ce qui existe — comptes, permissions, journal, trésorerie, grille tarifaire, taux — est décrit sans promesse en l’air.",
    depart: ["admin-validation", "admin-invitation-agent", "admin-taux"],
  },
};

export const AIDE_THEMES: Record<AideNiveau, string[]> = {
  Client: ["Votre accès", "Votre compte", "Tarifs", "Commandes"],
  Agent: ["Comptes clients", "Trésorerie", "Votre poste", "Opérations"],
  Admin: [
    "Pilotage",
    "Accès",
    "Clients et crédit",
    "Opérations",
    "Trésorerie et tarifs",
    "Système",
  ],
};

export const AIDE_PARCOURS: AideParcours[] = [
  {
    id: "client-inscription",
    niveau: "Client",
    theme: "Votre accès",
    titre: "Ouvrir un compte client",
    resume:
      "Le compte se crée en ligne, mais il ne sert à rien avant la validation d’un agent.",
    etapes: [
      "Renseignez le nom (ou l’appellation commerciale), une adresse email, un téléphone joignable et un mot de passe de 8 caractères minimum.",
      "Déposez une pièce d’identité depuis l’écran d’attente.",
      "Laissez un agent comparer la personne et la pièce : c’est la validation.",
    ],
    lien: { href: "/sign-up", libelle: "Créer mon compte" },
    garde:
      "Un compte en attente ne voit ni profil client, ni solde, ni commande. La validation vérifie la personne ; elle n’ouvre pas automatiquement un profil client existant.",
    motsCles: [
      "inscription",
      "inscrire",
      "créer",
      "compte",
      "signup",
      "email",
      "pièce",
      "identité",
      "attente",
      "validation",
    ],
  },
  {
    id: "client-connexion",
    niveau: "Client",
    theme: "Votre accès",
    titre: "Se connecter",
    resume: "Adresse email et mot de passe, puis le second facteur si vous l’avez activé.",
    etapes: [
      "Entrez l’adresse email du compte et votre mot de passe.",
      "Si le second facteur est actif, recopiez le code reçu par SMS ou par email.",
      "Un compte non validé reste sur l’écran d’attente : c’est normal.",
    ],
    lien: { href: "/sign-in", libelle: "Aller à la connexion" },
    garde:
      "La session survit à une coupure réseau, mais elle expire quand même. Sur un appareil partagé, changez le mot de passe et révoquez les sessions : une révocation ne coupe pas une session déjà ouverte hors-ligne.",
    motsCles: ["connexion", "connecter", "login", "email", "mot de passe", "2fa", "code"],
  },
  {
    id: "client-espace",
    niveau: "Client",
    theme: "Votre compte",
    titre: "Ouvrir votre espace",
    resume: "Le point de départ : votre compte, puis les tarifs du jour.",
    etapes: [
      "Connectez-vous : vous arrivez directement dans votre espace.",
      "Ouvrez « Mon compte » pour vos pièces, votre photo et votre second facteur.",
      "Ouvrez « Tarifs » pour les prix des réseaux.",
    ],
    lien: { href: "/clients", libelle: "Ouvrir mon espace" },
    garde:
      "Le profil financier, les commandes et les soldes ne sont pas encore affichés. L’écran le dit et l’aide ne le cache pas.",
    motsCles: ["accueil", "espace", "compte", "tableau", "soldes"],
  },
  {
    id: "client-profil",
    niveau: "Client",
    theme: "Votre compte",
    titre: "Compléter votre profil et vos pièces",
    resume: "Photo, pièce d’identité, second facteur et sessions ouvertes.",
    etapes: [
      "Ajoutez une photo si le comptoir vous la demande.",
      "Remplacez une pièce refusée : elle peut être retirée puis redéposée.",
      "Activez le second facteur et révoquez les appareils que vous ne reconnaissez pas.",
    ],
    lien: { href: "/clients/profile", libelle: "Ouvrir mon compte" },
    garde:
      "Une pièce acceptée sert à vérifier la personne. Elle ne prouve pas, à elle seule, l’accès à un profil client déjà enregistré.",
    motsCles: [
      "profil",
      "photo",
      "pièce",
      "identité",
      "2fa",
      "second facteur",
      "session",
      "appareil",
    ],
  },
  {
    id: "client-parametres",
    niveau: "Client",
    theme: "Votre compte",
    titre: "Régler votre poste",
    resume: "Mot de passe, session, réseau, appareil et notifications.",
    etapes: [
      "Changez votre mot de passe depuis « Paramètres ».",
      "Vérifiez l’état de la session : une session à renouveler est signalée.",
      "Réglez l’affichage et les préférences locales. Les signaux de commande et de paiement arriveront avec leurs écrans.",
    ],
    lien: { href: "/clients/settings", libelle: "Ouvrir les paramètres" },
    garde:
      "En cas de téléphone perdu ou volé, prévenez le distributeur sans attendre : la révocation d’un compte n’agit qu’à la connexion suivante.",
    motsCles: ["paramètres", "mot de passe", "session", "réseau", "appareil", "notifications"],
  },
  {
    id: "client-tarifs",
    niveau: "Client",
    theme: "Tarifs",
    titre: "Consulter les tarifs du jour",
    resume: "Le prix des 100 unités pour chaque réseau, avec l’équivalent en francs.",
    etapes: [
      "Choisissez le réseau : Orange, Airtel, Africell ou Vodacom.",
      "Lisez le prix des 100 unités et son équivalent en CDF au taux en vigueur.",
      "Comparez les réseaux avant de commande.",
    ],
    lien: { href: "/clients/pricing", libelle: "Voir les tarifs" },
    garde:
      "Un prix est historisé : une commande garde le prix du moment où elle a été passée, même si la grille change ensuite.",
    motsCles: ["tarif", "prix", "grille", "orange", "airtel", "africell", "vodacom", "unité"],
  },
  {
    id: "client-mot-de-passe",
    niveau: "Client",
    theme: "Votre accès",
    titre: "Récupérer un mot de passe",
    resume: "Aucune réinitialisation automatique : un accès temporaire, limité au choix d’un nouveau mot de passe.",
    etapes: [
      "Demandez la réinitialisation au distributeur, pièce d’identité en main.",
      "Il ouvre un accès temporaire et court, limité au choix d’un nouveau mot de passe.",
      "Choisissez le nouveau mot de passe : l’accès temporaire est révoqué aussitôt.",
    ],
    bientot: true,
    garde:
      "La demande en ligne existe, mais son traitement n’est pas encore outillé. Ne promettez ni envoi automatique ni mot de passe remis au comptoir.",
    motsCles: ["oublié", "mot de passe", "perdu", "récupérer", "réinitialiser", "comptoir"],
  },
  {
    id: "client-commander",
    niveau: "Client",
    theme: "Commandes",
    titre: "Commander de l’airtime",
    resume: "Réseau, unités ou montant, type de commande. Le plafond tranche.",
    etapes: [
      "Choisissez le réseau et la quantité, en unités ou en montant.",
      "Choisissez le type : prépayé ou crédit. Une commande crédit est bornée par le plafond de sa devise.",
      "Une commande crédit servie crée exactement une créance ; une commande refusée n’écrit rien.",
    ],
    bientot: true,
    garde:
      "Le plafond restant se calcule avec les créances et les commandes en attente. Une commande qui dépasse le disponible est refusée.",
    motsCles: ["commander", "commande", "airtime", "unités", "crédit", "prépayé", "plafond"],
  },
  {
    id: "client-preuves",
    niveau: "Client",
    theme: "Commandes",
    titre: "Déposer une preuve de paiement",
    resume: "L’image du paiement mobile money, validée avant l’entrée en file.",
    etapes: [
      "Téléversez l’image du paiement mobile money.",
      "Attendez la validation d’un agent : la preuve peut être acceptée ou refusée.",
      "Une preuve refusée peut être remplacée sans recréer la commande ; l’ancienne reste conservée.",
    ],
    bientot: true,
    garde:
      "Dire « preuve de paiement », jamais « facture » ni « reçu ». Une preuve est un fait daté : on ne l’écrase pas, on la remplace en gardant l’ancienne.",
    motsCles: ["preuve", "paiement", "mobile money", "image", "téléverser", "valider"],
  },
  {
    id: "client-paiements",
    niveau: "Client",
    theme: "Commandes",
    titre: "Suivre vos paiements et vos dettes",
    resume: "Chaque paiement porte une devise ; le reste à payer s’affiche en CDF.",
    etapes: [
      "Retrouvez vos paiements avec leur devise et leur date.",
      "Lisez le reste à payer, converti en CDF au taux en vigueur.",
      "Un paiement en trop reste visible comme avance : il n’est jamais absorbé en silence.",
    ],
    bientot: true,
    garde:
      "Une dette en dollars ne se solde pas durablement en francs : le reste bouge avec le taux. Pour la clore, il faut payer en USD.",
    motsCles: ["paiement", "dette", "reste", "solde", "avance", "cdf", "usd", "taux"],
  },
  {
    id: "agent-validation",
    niveau: "Agent",
    theme: "Comptes clients",
    titre: "Valider un compte client",
    resume: "La pièce d’abord, la décision ensuite. Chaque décision est tracée.",
    etapes: [
      "Ouvrez la file de validation : les comptes les plus anciens passent en premier.",
      "Ouvrez la pièce déposée et comparez la personne, le nom et le téléphone.",
      "Validez, refusez avec un motif écrit, ou révoquez si le compte est suspect.",
    ],
    lien: {
      href: "/agent/clients/validation",
      libelle: "Ouvrir la validation",
    },
    garde:
      "Valider sans avoir vu la pièce est interdit. Un refus exige un motif montré au client ; une révocation est définitive et ne supprime rien.",
    motsCles: [
      "valider",
      "validation",
      "compte",
      "client",
      "pièce",
      "identité",
      "refuser",
      "révoquer",
      "attente",
    ],
  },
  {
    id: "agent-clients",
    niveau: "Agent",
    theme: "Comptes clients",
    titre: "Retrouver un client",
    resume: "Le registre des comptes, avec recherche, état et filtres.",
    etapes: [
      "Recherchez par nom, téléphone ou email.",
      "Filtrez par état : en attente, validé, refusé, révoqué.",
      "Ouvrez la fiche pour lire les informations et les étiquettes.",
    ],
    lien: { href: "/agent/clients", libelle: "Ouvrir les comptes clients" },
    garde:
      "Cette liste exige la permission « client.valider ». Sans elle, l’écran refuse l’accès au lieu d’afficher des données partielles.",
    motsCles: ["client", "compte", "liste", "registre", "recherche", "fiche", "étiquette"],
  },
  {
    id: "agent-fiche",
    niveau: "Agent",
    theme: "Comptes clients",
    titre: "Lire une fiche client",
    resume: "Identité, état du compte, étiquettes et historique disponible.",
    etapes: [
      "Ouvrez la fiche depuis la liste ou la file de validation.",
      "Lisez le nom, le contact et l’état du compte avant toute décision.",
      "Ajoutez une étiquette seulement si la permission « client.annoter » vous est accordée.",
    ],
    lien: { href: "/agent/clients", libelle: "Ouvrir les comptes clients" },
    garde:
      "Un numéro de téléphone sert à retrouver un candidat, jamais à prouver seul l’identité ni à ouvrir un profil client.",
    motsCles: ["fiche", "client", "identité", "étiquette", "annoter", "historique"],
  },
  {
    id: "agent-tresorerie-mouvement",
    niveau: "Agent",
    theme: "Trésorerie",
    titre: "Enregistrer un mouvement de caisse",
    resume: "Entrée ou sortie, sur un compte et dans une seule devise.",
    etapes: [
      "Choisissez le compte : caisse en espèces ou mobile money d’un réseau.",
      "Choisissez le sens, la catégorie, le montant et la devise.",
      "Vérifiez le solde recalculé : il vient des mouvements, il n’est jamais saisi.",
    ],
    lien: { href: "/agent/treasury", libelle: "Ouvrir la trésorerie" },
    garde:
      "Le solde n’est jamais stocké. Une erreur se corrige par une écriture inverse, jamais par une suppression.",
    motsCles: ["caisse", "trésorerie", "mouvement", "entrée", "sortie", "espèces", "mobile money", "solde"],
  },
  {
    id: "agent-tresorerie-transfert",
    niveau: "Agent",
    theme: "Trésorerie",
    titre: "Transférer entre deux comptes",
    resume: "Deux écritures indivisibles, dans la même devise.",
    etapes: [
      "Choisissez le compte source et le compte cible.",
      "Saisissez le montant dans la devise commune aux deux comptes.",
      "Validez : le transfert crée une sortie et une entrée, jamais une seule des deux.",
    ],
    lien: { href: "/agent/treasury", libelle: "Ouvrir la trésorerie" },
    garde:
      "Un transfert est neutre dans les totaux de flux : il déplace de l’argent, il n’en crée pas.",
    motsCles: ["transfert", "transférer", "compte", "caisse", "mobile money", "devise"],
  },
  {
    id: "agent-tresorerie-correction",
    niveau: "Agent",
    theme: "Trésorerie",
    titre: "Corriger sans supprimer",
    resume: "L’écriture d’origine reste, la correction la contre.",
    etapes: [
      "Ouvrez le mouvement à corriger et choisissez « Corriger ».",
      "Saisissez l’écriture inverse avec son motif.",
      "Vérifiez que les deux lignes apparaissent dans l’historique.",
    ],
    lien: { href: "/agent/treasury", libelle: "Ouvrir la trésorerie" },
    garde:
      "Corriger exige la permission « ecriture.corriger ». Un agent qui ne l’a pas peut enregistrer un mouvement, pas le défaire.",
    motsCles: ["corriger", "correction", "inverse", "supprimer", "erreur", "écriture"],
  },
  {
    id: "agent-parametres",
    niveau: "Agent",
    theme: "Votre poste",
    titre: "Régler le poste de travail",
    resume: "Mot de passe, session, réseau, appareil et notifications.",
    etapes: [
      "Changez votre mot de passe depuis « Paramètres ».",
      "Vérifiez l’état de la session avant de quitter le poste.",
      "Contrôlez l’indicateur réseau : la file d’écritures n’est pas encore active.",
    ],
    lien: { href: "/agent/settings", libelle: "Ouvrir les paramètres" },
    garde:
      "La session survit à une coupure réseau, mais la file d’écritures durable et la synchronisation ne sont pas encore actives. Aujourd’hui, ne saisissez pas hors-ligne.",
    motsCles: ["paramètres", "session", "mot de passe", "réseau", "hors ligne", "appareil"],
  },
  {
    id: "agent-profil",
    niveau: "Agent",
    theme: "Votre poste",
    titre: "Gérer votre compte agent",
    resume: "Coordonnées, second facteur et sessions ouvertes.",
    etapes: [
      "Mettez à jour vos coordonnées depuis « Mon compte ».",
      "Activez le second facteur si vous le souhaitez.",
      "Révoquez les sessions que vous ne reconnaissez pas.",
    ],
    lien: { href: "/agent/profile", libelle: "Ouvrir mon compte" },
    garde:
      "Votre compte peut être suspendu (réversible) ou révoqué (définitif) par un administrateur principal. Une révocation ferme vos sessions et ne se lève pas.",
    motsCles: ["profil", "compte", "coordonnées", "2fa", "second facteur", "session"],
  },
  {
    id: "agent-commandes",
    niveau: "Agent",
    theme: "Opérations",
    titre: "Servir une commande",
    resume: "La file, le verrou local, puis une créance — jamais deux.",
    etapes: [
      "Prenez une commande dans la file : le verrou local vous la réserve.",
      "Servez-la au comptoir et confirmez le réseau et le montant.",
      "Une commande servie crée exactement une créance ; le double envoi est réconcilié, jamais dupliqué.",
    ],
    bientot: true,
    garde:
      "Une commande servie est terminale. Elle ne s’annule pas : une erreur se corrige par une écriture inverse tracée.",
    motsCles: ["commande", "servir", "file", "verrou", "créance", "comptoir", "caisse rapide"],
  },
  {
    id: "agent-preuves",
    niveau: "Agent",
    theme: "Opérations",
    titre: "Trancher une preuve de paiement",
    resume: "Accepter ou refuser une image, sans jamais l’écraser.",
    etapes: [
      "Ouvrez la preuve téléversée par le client.",
      "Comparez le montant, la date et le réseau au paiement annoncé.",
      "Acceptez, ou refusez avec un motif que le client verra.",
    ],
    bientot: true,
    garde:
      "Une preuve refusée peut être remplacée sans recréer la commande ; l’ancienne reste conservée et consultable. Rien n’est écrasé.",
    motsCles: ["preuve", "paiement", "accepter", "refuser", "image", "mobile money"],
  },
  {
    id: "agent-encaissement",
    niveau: "Agent",
    theme: "Opérations",
    titre: "Encaisser un paiement",
    resume: "Un montant, une devise, un reste à payer recalculé.",
    etapes: [
      "Choisissez le client, puis saisissez le montant et sa devise : CDF ou USD.",
      "La créance à l’origine du paiement est facultative : le solde se recalcule sur l’ensemble des créances et des paiements.",
      "Lisez le nouveau reste à payer et, si le client paie en USD, le montant qui solde pour de bon.",
    ],
    bientot: true,
    garde:
      "Un surpaiement n’est pas une erreur : il devient une avance visible, jamais un reste à zéro qui efface l’argent.",
    motsCles: ["encaisser", "paiement", "devise", "reste", "avance", "cdf", "usd"],
  },
  {
    id: "agent-creances",
    niveau: "Agent",
    theme: "Opérations",
    titre: "Suivre les dettes",
    resume: "L’ancienneté se lit sur la créance, pas sur le dernier paiement.",
    etapes: [
      "Triez les créances par ancienneté.",
      "Relancez les clients dont la créance est ancienne, même s’ils paient souvent.",
      "Lisez chaque dette dans sa devise, puis le reste à payer en CDF au taux en vigueur.",
    ],
    bientot: true,
    garde:
      "Un client qui rembourse une petite somme chaque semaine peut rester en retard depuis un an. Regarder le dernier paiement le rendrait invisible.",
    motsCles: ["créance", "dette", "retard", "ancienneté", "relance", "reste"],
  },
  {
    id: "admin-validation",
    niveau: "Admin",
    theme: "Accès",
    titre: "Valider un compte client",
    resume: "La file d’attente, la pièce, la décision — et sa trace.",
    etapes: [
      "Ouvrez la file : les comptes les plus anciens sont en tête.",
      "Ouvrez la pièce déposée et comparez la personne, le nom et le téléphone.",
      "Validez, refusez avec motif, ou révoquez un compte suspect.",
    ],
    lien: {
      href: "/admin/clients/validation",
      libelle: "Ouvrir la validation",
    },
    garde:
      "Un compte non validé ne voit aucun profil client et aucune donnée financière. Un refus exige un motif ; une révocation est définitive et ne supprime rien.",
    motsCles: ["valider", "validation", "compte", "client", "pièce", "identité", "refuser", "révoquer"],
  },
  {
    id: "admin-profil-client",
    niveau: "Admin",
    theme: "Accès",
    titre: "Ouvrir un profil client",
    resume: "Cherchez avant de créer : un client réel, un seul profil.",
    etapes: [
      "Cherchez par nom, téléphone ou adresse avant toute création.",
      "Si un profil existe, vérifiez son nom, son contact et son adresse dans les résultats — la recherche ne l’ouvre pas encore.",
      "N’ouvrez le formulaire que si aucun profil ne correspond ; deux clients homonymes restent deux profils.",
    ],
    lien: { href: "/admin/clients/new", libelle: "Ouvrir un profil client" },
    garde:
      "Deux clients homonymes restent deux profils. Un changement de téléphone ne crée pas un nouveau profil et ne déplace pas l’historique.",
    motsCles: ["profil", "client", "créer", "ouvrir", "homonyme", "téléphone"],
  },
  {
    id: "admin-invitation-agent",
    niveau: "Admin",
    theme: "Accès",
    titre: "Inviter un agent de service",
    resume: "Un lien à usage unique, une durée limitée, un rôle figé.",
    etapes: [
      "Ouvrez « Inviter un agent » et choisissez la durée du lien.",
      "Copiez le lien et transmettez-le à la personne concernée.",
      "Suivez l’envoi dans « Invitations agents » : un lien perdu se révoque.",
    ],
    lien: {
      href: "/admin/invites?cible=agent",
      libelle: "Inviter un agent",
    },
    garde:
      "L’agent crée lui-même son compte par le lien. Il n’obtient aucune permission métier par défaut : les droits s’accordent ensuite, un par un.",
    motsCles: ["inviter", "invitation", "agent", "lien", "usage unique", "expire", "révoquer"],
  },
  {
    id: "admin-agent-creer",
    niveau: "Admin",
    theme: "Accès",
    titre: "Créer un agent avec son mot de passe",
    resume: "Le compte est créé directement, sans passer par un lien — la voie d’exception.",
    etapes: [
      "Renseignez le prénom, le nom, l’adresse email (identifiant de connexion), le téléphone et un mot de passe initial de 8 caractères minimum.",
      "Créez le compte : il arrive avec le rôle agent de service.",
      "Ouvrez sa fiche pour accorder ses permissions et vérifier sa session.",
    ],
    lien: { href: "/admin/agents/create", libelle: "Créer un agent" },
    garde:
      "La voie normale reste l’invitation : l’agent choisit lui-même son email et son mot de passe. Seul un administrateur principal validé crée un agent ; un administrateur technique ne le peut pas.",
    motsCles: ["créer", "agent", "mot de passe", "compte", "service"],
  },
  {
    id: "admin-permissions",
    niveau: "Admin",
    theme: "Accès",
    titre: "Accorder les permissions socle",
    resume: "Zéro droit par défaut. Le socle s’applique à tous les agents.",
    etapes: [
      "Ouvrez « Permissions des agents » et choisissez le socle commun.",
      "Activez une permission, puis une autre : chaque bascule est enregistrée au journal.",
      "Pour un cas particulier, ouvrez la fiche de l’agent et ajoutez une exception.",
    ],
    lien: {
      href: "/admin/agents/permissions",
      libelle: "Ouvrir les permissions",
    },
    garde:
      "Les permissions forment une liste fermée : une action métier nouvelle ajoute son nom, elle ne se contourne pas. L’administrateur technique ne peut accorder aucun droit métier.",
    motsCles: ["permission", "droits", "socle", "agent", "accorder", "retirer", "exception"],
  },
  {
    id: "admin-agent-fiche",
    niveau: "Admin",
    theme: "Accès",
    titre: "Suspendre ou révoquer un agent",
    resume: "La suspension se lève ; la révocation ne se lève pas.",
    etapes: [
      "Ouvrez la fiche de l’agent depuis la liste.",
      "Suspendez le compte pour une coupure réversible.",
      "Révoquez pour une sortie définitive : les sessions sont fermées et le compte reste tracé.",
    ],
    lien: { href: "/admin/agents", libelle: "Ouvrir les agents" },
    garde:
      "Vous ne pouvez pas suspendre ou révoquer votre propre compte. La suspension se lève ; la révocation est définitive et ferme les sessions.",
    motsCles: ["suspendre", "suspension", "révoquer", "agent", "compte", "session", "motif"],
  },
  {
    id: "admin-admin-principal",
    niveau: "Admin",
    theme: "Accès",
    titre: "Nommer un administrateur principal",
    resume: "Le compte qui décide des plafonds, des promotions et des accès.",
    etapes: [
      "Créez le compte directement, avec son mot de passe, ou envoyez un lien d’invitation.",
      "L’invité choisit lui-même son mot de passe par le lien reçu.",
      "Le second facteur s’active depuis le profil de l’intéressé ; la fiche permet de vérifier son état.",
    ],
    lien: { href: "/admin/create", libelle: "Créer un administrateur" },
    garde:
      "Un administrateur technique peut créer un principal mais ne détient aucun pouvoir métier : ni taux, ni plafond, ni promotion, ni mouvement de trésorerie. Le dernier principal validé est protégé ; un principal ne peut ni suspendre ni révoquer un administrateur technique, ni son propre créateur.",
    motsCles: [
      "administrateur",
      "principal",
      "technique",
      "créer",
      "nommer",
      "distributeur",
      "invitation",
    ],
  },
  {
    id: "admin-journal",
    niveau: "Admin",
    theme: "Accès",
    titre: "Lire le journal d’audit",
    resume: "Qui, quand, quoi : le journal ne se modifie pas et ne se supprime pas.",
    etapes: [
      "Ouvrez le journal : les derniers événements s’affichent en premier.",
      "Lisez le résumé de l’événement et son acteur.",
      "Suivez les corrections liées : une contestation pointe l’entrée d’origine.",
    ],
    lien: { href: "/admin/audit-log", libelle: "Ouvrir le journal" },
    garde:
      "Le journal est append-only : une correction s’ajoute, elle ne remplace jamais la ligne d’origine. Seuls les administrateurs principaux et techniques validés le consultent.",
    motsCles: ["journal", "audit", "trace", "événement", "correction", "append-only", "historique"],
  },
  {
    id: "admin-clients",
    niveau: "Admin",
    theme: "Clients et crédit",
    titre: "Consulter les comptes clients",
    resume: "Tous les comptes, leur état et leur ancienneté d’attente.",
    etapes: [
      "Recherchez par nom, email ou téléphone.",
      "Filtrez par état : en attente, validé, refusé, révoqué.",
      "Ouvrez un compte pour lire la fiche, les pièces et les étiquettes.",
    ],
    lien: { href: "/admin/clients", libelle: "Ouvrir les comptes clients" },
    garde:
      "Un compte validé n’accède aux données financières qu’après autorisation d’accès au bon profil client. Le téléphone seul ne suffit jamais.",
    motsCles: ["compte", "client", "liste", "état", "recherche", "attente", "validation"],
  },
  {
    id: "admin-annotations",
    niveau: "Admin",
    theme: "Clients et crédit",
    titre: "Annoter un client",
    resume: "Une étiquette de pilotage, jamais une décision de crédit.",
    etapes: [
      "Ouvrez la fiche du client.",
      "Posez une étiquette : à surveiller, bon payeur ou client de confiance.",
      "Retirez-la avec un motif si la situation change.",
    ],
    lien: { href: "/admin/clients", libelle: "Ouvrir les comptes clients" },
    garde:
      "L’étiquette informe, elle ne ferme ni n’ouvre le crédit. Seul le plafond borne le crédit, et la promotion reste une décision humaine.",
    motsCles: ["annoter", "étiquette", "annotation", "surveiller", "bon payeur", "confiance"],
  },
  {
    id: "admin-confirmation-acces",
    niveau: "Admin",
    theme: "Clients et crédit",
    titre: "Confirmer l’accès à un profil existant",
    resume:
      "Valider le compte ne suffit pas : l’accès à un profil déjà enregistré est une décision distincte.",
    etapes: [
      "Vérifiez que la personne représente bien le profil client existant, pièce en main.",
      "Confirmez l’accès au profil : c’est une décision atomique, séparée de la validation du compte.",
      "Sans confirmation, le compte validé ne voit aucun solde ni aucune commande.",
    ],
    bientot: true,
    garde:
      "Cette confirmation n’est pas encore outillée. En attendant, aucun accès financier n’est accordé sur la base du téléphone.",
    motsCles: [
      "accès",
      "profil",
      "confirmer",
      "existant",
      "rattacher",
      "validation",
      "téléphone",
    ],
  },
  {
    id: "admin-taux",
    niveau: "Admin",
    theme: "Trésorerie et tarifs",
    titre: "Saisir le taux en vigueur",
    resume: "Le dernier taux saisi fait foi, et il survit aux jours.",
    etapes: [
      "Ouvrez le sélecteur de taux dans l’en-tête du tableau de bord.",
      "Saisissez la valeur en CDF pour 1 USD.",
      "Confirmez si l’écart dépasse 5 % : le taux bouge alors les dettes en USD.",
    ],
    lien: { href: "/admin/dashboard", libelle: "Ouvrir le tableau de bord" },
    garde:
      "Ressaisir la valeur déjà en vigueur n’écrit rien. Le taux ne mord que sur l’USD ; un rapport passé se lit au taux en vigueur à la fin de ce jour-là.",
    motsCles: ["taux", "change", "usd", "cdf", "dollar", "franc", "conversion", "5 %"],
  },
  {
    id: "admin-tresorerie",
    niveau: "Admin",
    theme: "Trésorerie et tarifs",
    titre: "Tenir la caisse et le mobile money",
    resume: "Un compte par réseau, une devise par compte, un solde calculé.",
    etapes: [
      "Ouvrez un compte de caisse ou de mobile money, avec sa devise.",
      "Enregistrez les entrées et les sorties avec leur catégorie.",
      "Lisez le solde et les totaux de la période : ils viennent des mouvements.",
    ],
    lien: { href: "/admin/treasury", libelle: "Ouvrir la trésorerie" },
    garde:
      "Le solde n’est jamais stocké. Les frais et commissions ne sont pas des mouvements de trésorerie ; les transferts sont neutres dans les totaux de flux.",
    motsCles: ["trésorerie", "caisse", "mobile money", "compte", "mouvement", "solde", "devise"],
  },
  {
    id: "admin-transfert-correction",
    niveau: "Admin",
    theme: "Trésorerie et tarifs",
    titre: "Transférer et corriger",
    resume: "Deux écritures indivisibles pour un transfert, une écriture inverse pour une erreur.",
    etapes: [
      "Pour un transfert, choisissez la source, la cible, le montant et la devise commune.",
      "Pour une correction, ouvrez le mouvement et saisissez son inverse avec un motif.",
      "Vérifiez les deux lignes dans l’historique : rien n’a été supprimé.",
    ],
    lien: { href: "/admin/treasury", libelle: "Ouvrir la trésorerie" },
    garde:
      "Un transfert ne crée pas d’argent. Une correction ne supprime pas l’écriture fautive : elle la contre et laisse les deux traces.",
    motsCles: ["transfert", "correction", "inverse", "supprimer", "mouvement", "écriture"],
  },
  {
    id: "admin-pricing",
    niveau: "Admin",
    theme: "Trésorerie et tarifs",
    titre: "Publier un prix",
    resume: "Un prix par réseau pour 100 unités (1 USD d’airtime), historisé et jamais réécrit.",
    etapes: [
      "Choisissez le réseau dans la grille tarifaire.",
      "Saisissez le prix des 100 unités dans sa devise.",
      "Publiez : l’historique garde l’ancien et le nouveau prix, avec l’auteur et la date.",
    ],
    lien: { href: "/admin/pricing", libelle: "Ouvrir la grille tarifaire" },
    garde:
      "Une commande garde le prix du moment où elle a été passée. Un prix sous le tarif officiel est signalé, jamais bloqué en silence.",
    motsCles: ["grille", "tarif", "prix", "réseau", "unité", "historique", "publier"],
  },
  {
    id: "admin-settings",
    niveau: "Admin",
    theme: "Système",
    titre: "Régler la durée des invitations",
    resume: "Le seul réglage système ouvert aujourd’hui : la validité des liens.",
    etapes: [
      "Ouvrez « Paramètres » et lisez la durée par défaut.",
      "Modifiez le nombre de jours dans les bornes autorisées.",
      "Enregistrez : les prochains liens utiliseront cette durée.",
    ],
    lien: { href: "/admin/settings", libelle: "Ouvrir les paramètres" },
    garde:
      "Ce réglage est de nature technique : un administrateur principal ou technique validé peut le modifier. Les crédits, clients et validations ne se règlent pas ici.",
    motsCles: ["paramètres", "réglage", "invitation", "durée", "jours", "lien"],
  },
  {
    id: "admin-profil",
    niveau: "Admin",
    theme: "Système",
    titre: "Protéger votre compte",
    resume: "Second facteur, photo, coordonnées et sessions ouvertes.",
    etapes: [
      "Activez le second facteur depuis « Mon compte ».",
      "Vérifiez l’appareil associé et les sessions actives.",
      "Révoquez toute session que vous ne reconnaissez pas.",
    ],
    lien: { href: "/admin/profile", libelle: "Ouvrir mon compte" },
    garde:
      "Le second facteur est optionnel pour tous les comptes. Sur un compte administrateur, l’activer reste la meilleure protection contre une prise de contrôle.",
    motsCles: ["profil", "compte", "2fa", "second facteur", "session", "photo", "mot de passe"],
  },
  {
    id: "admin-pilotage",
    niveau: "Admin",
    theme: "Pilotage",
    titre: "Lire le tableau de bord",
    resume: "Le point d’entrée du pilotage ; les indicateurs et les alertes arrivent.",
    etapes: [
      "Ouvrez le tableau de bord depuis le menu.",
      "Aujourd’hui, il donne accès à la création d’un administrateur principal et au taux en vigueur.",
      "Les indicateurs du matin, les alertes et la performance des agents seront ajoutés ensuite.",
    ],
    lien: { href: "/admin/dashboard", libelle: "Ouvrir le tableau de bord" },
    garde:
      "Les blocs d’indicateurs sont encore vides. En attendant, le tableau de bord donne accès au taux en vigueur et à la création d’un administrateur principal.",
    motsCles: ["tableau", "bord", "pilotage", "indicateur", "alerte", "matin", "performance"],
  },
  {
    id: "admin-alertes",
    niveau: "Admin",
    theme: "Pilotage",
    titre: "Traiter les alertes et réconcilier",
    resume: "Une preuve en attente, un conflit, un plafond dépassé : décider, pas masquer.",
    etapes: [
      "Ouvrez l’alerte et lisez l’entité qu’elle désigne.",
      "Tranchez le conflit : le premier enregistrement gagne, la réconciliation est humaine.",
      "Résolvez la cause : l’alerte disparaît d’elle-même, sans bouton pour la cacher.",
    ],
    bientot: true,
    garde:
      "Un conflit de synchronisation n’est pas un échec réseau. Un changement de taux concurrent n’est jamais un conflit.",
    motsCles: ["alerte", "réconciliation", "conflit", "preuve", "plafond", "synchronisation"],
  },
  {
    id: "admin-operations",
    niveau: "Admin",
    theme: "Opérations",
    titre: "Servir et suivre les commandes",
    resume: "La file, les preuves, les encaissements et les créances, du même côté.",
    etapes: [
      "Une commande crédit servie crée une créance, et une seule.",
      "Une preuve se valide ou se refuse avant l’entrée en file.",
      "Un encaissement porte une devise ; le reste à payer se lit en CDF au taux en vigueur.",
    ],
    bientot: true,
    garde:
      "Tant que ces écrans ne sont pas livrés, l’administration ne remplace pas le comptoir : les opérations de commande restent à construire.",
    motsCles: ["commande", "preuve", "encaissement", "créance", "file", "servir", "caisse rapide"],
  },
  {
    id: "admin-retards",
    niveau: "Admin",
    theme: "Clients et crédit",
    titre: "Suivre les retards et les plafonds",
    resume: "Qui relancer, depuis quand, et ce qu’il reste disponible.",
    etapes: [
      "Triez les profils par ancienneté de créance.",
      "Lisez le plafond restant par devise : jamais négatif, jamais converti.",
      "Relancez avant de bloquer : un plafond est une décision, pas une sanction automatique.",
    ],
    bientot: true,
    garde:
      "Le plafond restant ne bouge pas avec le taux. Une créance se valorise au taux du jour ; une décision de plafond, non.",
    motsCles: ["retard", "plafond", "crédit", "statut", "relance", "disponible", "promotion"],
  },
  {
    id: "admin-notifications",
    niveau: "Admin",
    theme: "Système",
    titre: "Suivre les notifications",
    resume: "L’écran existe ; les alertes qui doivent l’alimenter arrivent.",
    etapes: [
      "Ouvrez les notifications depuis l’en-tête.",
      "Aujourd’hui, l’écran est vide : aucune alerte n’est encore produite.",
      "Les preuves en attente, conflits et comptes à valider y seront regroupés.",
    ],
    lien: {
      href: "/admin/notifications",
      libelle: "Ouvrir les notifications",
    },
    garde:
      "Une notification ne remplace pas une décision. Elle signale une cause à traiter, elle ne la traite pas.",
    motsCles: ["notification", "alerte", "cloche", "preuve", "conflit", "validation"],
  },
];

export const AIDE_REPERES: AideRepere[] = [
  {
    id: "calcul",
    titre: "Le calcul normatif",
    texte:
      "Une dette et un paiement gardent chacun leur devise. Le reste à payer se convertit en CDF au taux en vigueur, au moment où on le regarde.",
    exemple:
      "Dette de 100 USD, taux 1 USD = 2 300 CDF, soit 230 000 CDF. Paiement 1 : 50 000 CDF. Paiement 2 : 50 USD, soit 115 000 CDF. Reste à payer : 65 000 CDF.",
    niveaux: ["Client", "Agent", "Admin"],
  },
  {
    id: "taux",
    titre: "Le taux en vigueur",
    texte:
      "Le dernier taux saisi fait foi, jusqu’à ce qu’un autre le remplace. Il survit aux jours : un jour sans saisie n’est pas un jour sans taux. Ressaisir la même valeur n’écrit rien ; un écart de plus de 5 % demande une confirmation. Il ne convertit que les montants en USD.",
    niveaux: ["Client", "Agent", "Admin"],
  },
  {
    id: "devises",
    titre: "Deux devises, aucune fusion",
    texte:
      "Chaque créance et chaque paiement porte exactement une devise. Le CDF est la devise d’affichage. Une dette en dollars ne se solde pas durablement en francs : pour la clore définitivement, il faut la payer en USD.",
    niveaux: ["Client", "Agent", "Admin"],
  },
  {
    id: "mots",
    titre: "Les mots justes",
    texte:
      "Dire « client », jamais « shop » ; « commande », jamais « réalisation » — sauf pour la trace d’une commande servie ; « preuve de paiement », jamais « facture » ni « reçu ». « Virtuel » n’existe pas ; dites « monnaie électronique », jamais « e-money ». « Profil client » remplace « dossier client ».",
    niveaux: ["Client", "Agent", "Admin"],
  },
  {
    id: "validation",
    titre: "Valider n’est pas rattacher",
    texte:
      "Valider un compte vérifie la personne à partir d’une pièce d’identité. Cela ne prouve pas qu’elle représente un profil client déjà enregistré. Si l’inscription ressemble à un profil existant, un agent autorisé confirme l’accès après vérification — une décision distincte, qui n’est pas encore outillée.",
    niveaux: ["Client", "Agent", "Admin"],
  },
  {
    id: "permissions",
    titre: "Zéro permission par défaut",
    texte:
      "Un agent authentifié peut se connecter, consulter son tableau de bord, son profil, ses paramètres et l’aide. Sans permission, il ne peut accomplir aucune action métier : valider, annoter, encaisser, corriger, servir. Les permissions forment une liste fermée et s’accordent une par une. Chaque changement est journalisé, et l’administrateur technique n’en accorde aucune.",
    niveaux: ["Agent", "Admin"],
  },
  {
    id: "suppression",
    titre: "Rien ne se supprime",
    texte:
      "Une opération financière ne s’efface pas : elle s’annule par une écriture inverse tracée. Le journal d’audit est append-only ; corriger, c’est ajouter une ligne, jamais réécrire l’histoire.",
    niveaux: ["Agent", "Admin"],
  },
  {
    id: "hors-ligne",
    titre: "Hors-ligne : ce qui est vrai",
    texte:
      "La session survit à une coupure réseau, mais elle expire quand même. La file d’écritures durable et la synchronisation sans doublon ne sont pas encore actives : aujourd’hui, ne saisissez pas une opération hors-ligne en comptant sur une reprise automatique.",
    niveaux: ["Client", "Agent", "Admin"],
  },
];

export function parcoursDuNiveau(niveau: AideNiveau) {
  return AIDE_PARCOURS.filter((parcours) => parcours.niveau === niveau);
}

export function reperesDuNiveau(niveau: AideNiveau) {
  return AIDE_REPERES.filter((repere) => repere.niveaux.includes(niveau));
}

export function destinationAide(profil: Profil): string {
  if (profil.type === "CLIENT") {
    if (profil.etat === "VALIDE") return "/clients/help";
    if (profil.etat === "REVOQUE") return DESTINATION_CONNEXION;
    return "/pending";
  }
  if (profil.type === "STAFF" && profil.etat === "VALIDE") {
    return profil.role === "AGENT" ? "/agent/help" : "/admin/help";
  }
  return DESTINATION_CONNEXION;
}
