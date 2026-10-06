CREATE TABLE `facteurs_2fa_admin` (
	`id` varchar(36) NOT NULL,
	`compte_staff_id` varchar(36) NOT NULL,
	`nom_appareil` varchar(255) NOT NULL,
	`actif` boolean NOT NULL DEFAULT true,
	`cree_par` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`remplace_le` timestamp(3),
	CONSTRAINT `facteurs_2fa_admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `facteurs_2fa_admin_compte_staff_id_unique` UNIQUE(`compte_staff_id`)
);
--> statement-breakpoint
CREATE TABLE `pieces_identite_staff` (
	`id` varchar(36) NOT NULL,
	`compte_staff_id` varchar(36) NOT NULL,
	`type_piece` varchar(64) NOT NULL,
	`reference_image` text NOT NULL,
	`vue_par` varchar(36) NOT NULL,
	`vue_le` timestamp(3) NOT NULL DEFAULT (now()),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `pieces_identite_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `acces_temporaires_reset_staff` (
	`id` varchar(36) NOT NULL,
	`compte_staff_cible` varchar(36) NOT NULL,
	`ouvert_par` varchar(36) NOT NULL,
	`piece_id` varchar(36) NOT NULL,
	`expire_le` timestamp(3) NOT NULL,
	`consomme_le` timestamp(3),
	`avertissement_affiche` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `acces_temporaires_reset_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `facteurs_2fa_admin_compte_idx` ON `facteurs_2fa_admin` (`compte_staff_id`);--> statement-breakpoint
CREATE INDEX `facteurs_2fa_admin_cree_par_idx` ON `facteurs_2fa_admin` (`cree_par`);--> statement-breakpoint
CREATE INDEX `pieces_identite_staff_compte_idx` ON `pieces_identite_staff` (`compte_staff_id`);--> statement-breakpoint
CREATE INDEX `pieces_identite_staff_vue_par_idx` ON `pieces_identite_staff` (`vue_par`);--> statement-breakpoint
CREATE INDEX `acces_tmp_staff_cible_idx` ON `acces_temporaires_reset_staff` (`compte_staff_cible`);--> statement-breakpoint
CREATE INDEX `acces_tmp_staff_ouvert_par_idx` ON `acces_temporaires_reset_staff` (`ouvert_par`);--> statement-breakpoint
CREATE INDEX `acces_tmp_staff_piece_idx` ON `acces_temporaires_reset_staff` (`piece_id`);