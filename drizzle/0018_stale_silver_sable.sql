ALTER TABLE `pieces_identite_clients` ADD `statut_piece` varchar(32) DEFAULT 'EN_ATTENTE' NOT NULL;--> statement-breakpoint
ALTER TABLE `pieces_identite_clients` ADD `refus_motif` text;--> statement-breakpoint
UPDATE `pieces_identite_clients` SET `statut_piece` = 'ACCEPTEE' WHERE `vue_par` IS NOT NULL;