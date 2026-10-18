ALTER TABLE `comptes_clients` ADD `profil_candidat_id` varchar(36);--> statement-breakpoint
ALTER TABLE `profils_clients` ADD `origine` varchar(16) DEFAULT 'AGENT' NOT NULL;--> statement-breakpoint
CREATE INDEX `comptes_clients_profil_candidat_idx` ON `comptes_clients` (`profil_candidat_id`);