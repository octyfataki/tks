CREATE TABLE `dossiers_clients` (
	`id` varchar(36) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`contact` varchar(32) NOT NULL,
	`adresse` text NOT NULL,
	`cree_par` varchar(36),
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `dossiers_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dossiers_clients_contact_idx` ON `dossiers_clients` (`contact`);