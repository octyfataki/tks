ALTER TABLE `profils_clients` ADD `nom_normalise` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `profils_clients_nom_normalise_idx` ON `profils_clients` (`nom_normalise`);