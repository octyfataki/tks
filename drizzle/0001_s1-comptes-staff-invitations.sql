CREATE TABLE `comptes_staff` (
	`id` varchar(36) NOT NULL,
	`better_auth_user_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(32) NOT NULL,
	`etat` varchar(32) NOT NULL DEFAULT 'VALIDE',
	`cree_par` varchar(36),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`revoked_at` timestamp(3),
	CONSTRAINT `comptes_staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `comptes_staff_better_auth_user_id_unique` UNIQUE(`better_auth_user_id`),
	CONSTRAINT `comptes_staff_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `invitations_agents` (
	`id` varchar(36) NOT NULL,
	`jeton` varchar(255) NOT NULL,
	`role_cible` varchar(32) NOT NULL DEFAULT 'AGENT',
	`expire_le` timestamp(3) NOT NULL,
	`consomme_le` timestamp(3),
	`consomme_par` varchar(36),
	`cree_par` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_agents_jeton_unique` UNIQUE(`jeton`)
);
--> statement-breakpoint
CREATE INDEX `comptes_staff_role_etat_idx` ON `comptes_staff` (`role`,`etat`);--> statement-breakpoint
CREATE INDEX `comptes_staff_cree_par_idx` ON `comptes_staff` (`cree_par`);--> statement-breakpoint
CREATE INDEX `invitations_agents_cree_par_idx` ON `invitations_agents` (`cree_par`);