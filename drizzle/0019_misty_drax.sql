CREATE TABLE `profils_clients` (
	`id` varchar(36) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`adresse` varchar(500),
	`contact_telephone` varchar(32) NOT NULL,
	`statut` varchar(16) NOT NULL DEFAULT 'EN_EVALUATION',
	`plafond_montant` int unsigned NOT NULL,
	`plafond_devise` varchar(3) NOT NULL,
	`cree_par` varchar(36) NOT NULL,
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `profils_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `profils_clients_contact_idx` ON `profils_clients` (`contact_telephone`);--> statement-breakpoint
CREATE INDEX `profils_clients_nom_idx` ON `profils_clients` (`nom`);