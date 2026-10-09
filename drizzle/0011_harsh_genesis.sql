CREATE TABLE `comptes_clients` (
	`id` varchar(36) NOT NULL,
	`better_auth_user_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`telephone` varchar(32) NOT NULL,
	`etat` varchar(32) NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
	`cree_par` varchar(36),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`valide_le` timestamp(3),
	`refuse_motif` varchar(500),
	CONSTRAINT `comptes_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `comptes_clients_better_auth_user_id_unique` UNIQUE(`better_auth_user_id`),
	CONSTRAINT `comptes_clients_email_unique` UNIQUE(`email`),
	CONSTRAINT `comptes_clients_telephone_unique` UNIQUE(`telephone`)
);
--> statement-breakpoint
CREATE INDEX `comptes_clients_etat_idx` ON `comptes_clients` (`etat`);--> statement-breakpoint
CREATE INDEX `comptes_clients_cree_par_idx` ON `comptes_clients` (`cree_par`);