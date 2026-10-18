CREATE TABLE `price_grid` (
	`id` varchar(36) NOT NULL,
	`network` varchar(32) NOT NULL,
	`amount` int unsigned NOT NULL,
	`currency` varchar(3) NOT NULL,
	`effective_at` timestamp(3) NOT NULL,
	`entered_by` varchar(36) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `price_grid_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `price_grid_network_effective_at_idx` ON `price_grid` (`network`,`effective_at`);--> statement-breakpoint
CREATE INDEX `price_grid_effective_at_idx` ON `price_grid` (`effective_at`);--> statement-breakpoint
CREATE INDEX `price_grid_entered_by_idx` ON `price_grid` (`entered_by`);
--> statement-breakpoint
-- S5-01 — grille tarifaire append-only garantie par la base (même patron
-- que le journal d'audit, ADR-0006) : un prix ne s'écrase ni ne se
-- supprime, y compris par un accès direct en base. La correction passe
-- par une nouvelle ligne datée. Seule l'insertion est possible.
CREATE TRIGGER `price_grid_block_update` BEFORE UPDATE ON `price_grid`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'grille tarifaire append-only : mise à jour interdite';
--> statement-breakpoint
CREATE TRIGGER `price_grid_block_delete` BEFORE DELETE ON `price_grid`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'grille tarifaire append-only : suppression interdite';
