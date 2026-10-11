CREATE TABLE `taux_change` (
	`id` varchar(36) NOT NULL,
	`jour` varchar(10) NOT NULL,
	`valeur` int unsigned NOT NULL,
	`saisi_par` varchar(36) NOT NULL,
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `taux_change_id` PRIMARY KEY(`id`),
	CONSTRAINT `taux_change_jour_unique` UNIQUE(`jour`)
);
--> statement-breakpoint
CREATE INDEX `taux_change_saisi_par_idx` ON `taux_change` (`saisi_par`);