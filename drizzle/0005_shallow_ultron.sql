CREATE TABLE `premiers_acces_admin` (
	`id` varchar(36) NOT NULL,
	`compte_staff_cible` varchar(36) NOT NULL,
	`jeton` varchar(255) NOT NULL,
	`expire_le` timestamp(3) NOT NULL,
	`consomme_le` timestamp(3),
	`cree_par` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `premiers_acces_admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `premiers_acces_admin_jeton_unique` UNIQUE(`jeton`)
);
--> statement-breakpoint
CREATE INDEX `premiers_acces_admin_cible_idx` ON `premiers_acces_admin` (`compte_staff_cible`);