CREATE TABLE `facteurs_2fa_clients` (
	`id` varchar(36) NOT NULL,
	`compte_client_id` varchar(36) NOT NULL,
	`nom_appareil` varchar(255) NOT NULL,
	`actif` boolean NOT NULL DEFAULT true,
	`cree_par` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`remplace_le` timestamp(3),
	CONSTRAINT `facteurs_2fa_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `facteurs_2fa_clients_compte_client_id_unique` UNIQUE(`compte_client_id`)
);
--> statement-breakpoint
CREATE INDEX `facteurs_2fa_clients_compte_idx` ON `facteurs_2fa_clients` (`compte_client_id`);--> statement-breakpoint
CREATE INDEX `facteurs_2fa_clients_cree_par_idx` ON `facteurs_2fa_clients` (`cree_par`);