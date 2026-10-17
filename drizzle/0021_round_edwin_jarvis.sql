CREATE TABLE `demandes_acces_profil` (
	`id` varchar(36) NOT NULL,
	`compte_client_id` varchar(36) NOT NULL,
	`profil_client_id` varchar(36) NOT NULL,
	`statut` varchar(16) NOT NULL DEFAULT 'EN_ATTENTE',
	`motif` varchar(500),
	`decide_par` varchar(36),
	`decide_le` timestamp(3),
	`indice_detection` varchar(128),
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `demandes_acces_profil_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `demandes_acces_profil_compte_idx` ON `demandes_acces_profil` (`compte_client_id`);--> statement-breakpoint
CREATE INDEX `demandes_acces_profil_profil_idx` ON `demandes_acces_profil` (`profil_client_id`);--> statement-breakpoint
CREATE INDEX `demandes_acces_profil_statut_idx` ON `demandes_acces_profil` (`statut`);