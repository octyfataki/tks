CREATE TABLE `annotations_clients` (
	`id` varchar(36) NOT NULL,
	`compte_client_id` varchar(36) NOT NULL,
	`etiquette` varchar(64) NOT NULL,
	`statut` varchar(16) NOT NULL,
	`acteur_id` varchar(36),
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `annotations_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `annotations_clients_compte_idx` ON `annotations_clients` (`compte_client_id`);--> statement-breakpoint
CREATE INDEX `annotations_clients_compte_etiquette_idx` ON `annotations_clients` (`compte_client_id`,`etiquette`);