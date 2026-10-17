CREATE TABLE `acces_profil_clients` (
	`id` varchar(36) NOT NULL,
	`compte_client_id` varchar(36) NOT NULL,
	`profil_client_id` varchar(36) NOT NULL,
	`statut` varchar(16) NOT NULL DEFAULT 'ACCORDE',
	`motif` varchar(500),
	`decide_par` varchar(36) NOT NULL,
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	`compte_actif` varchar(36) GENERATED ALWAYS AS ((if(`statut` = 'ACCORDE', `compte_client_id`, null))) VIRTUAL,
	`profil_actif` varchar(36) GENERATED ALWAYS AS ((if(`statut` = 'ACCORDE', `profil_client_id`, null))) VIRTUAL,
	CONSTRAINT `acces_profil_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `acces_profil_clients_compte_actif_uq` UNIQUE(`compte_actif`),
	CONSTRAINT `acces_profil_clients_profil_actif_uq` UNIQUE(`profil_actif`)
);
--> statement-breakpoint
CREATE INDEX `acces_profil_clients_compte_idx` ON `acces_profil_clients` (`compte_client_id`);--> statement-breakpoint
CREATE INDEX `acces_profil_clients_profil_idx` ON `acces_profil_clients` (`profil_client_id`);--> statement-breakpoint
CREATE INDEX `acces_profil_clients_statut_idx` ON `acces_profil_clients` (`statut`);