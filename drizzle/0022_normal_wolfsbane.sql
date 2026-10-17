ALTER TABLE `annotations_clients` ADD `profil_client_id` varchar(36);--> statement-breakpoint
CREATE INDEX `annotations_clients_profil_idx` ON `annotations_clients` (`profil_client_id`);