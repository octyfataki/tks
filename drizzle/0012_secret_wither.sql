CREATE TABLE `pieces_identite_clients` (
	`id` varchar(36) NOT NULL,
	`compte_client_id` varchar(36) NOT NULL,
	`type_piece` varchar(64) NOT NULL,
	`mime` varchar(64) NOT NULL,
	`reference_image` text NOT NULL,
	`vue_par` varchar(36),
	`vue_le` timestamp(3),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `pieces_identite_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pieces_identite_clients_compte_idx` ON `pieces_identite_clients` (`compte_client_id`);