CREATE TABLE `order_events` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`actor_id` varchar(36),
	`payload` json,
	`local_timestamp` timestamp(3) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(36) NOT NULL,
	`network` varchar(32) NOT NULL,
	`channel` varchar(16) NOT NULL,
	`type` varchar(16) NOT NULL,
	`units` int unsigned NOT NULL,
	`price_per_hundred` int unsigned NOT NULL,
	`amount` int unsigned NOT NULL,
	`currency` varchar(3) NOT NULL,
	`created_by` varchar(36),
	`local_timestamp` timestamp(3) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(36) NOT NULL,
	`order_id` varchar(36),
	`amount` int unsigned NOT NULL,
	`currency` varchar(3) NOT NULL,
	`occurred_at` timestamp(3) NOT NULL,
	`entered_by` varchar(36) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `receivables_id` PRIMARY KEY(`id`),
	CONSTRAINT `receivables_order_unique` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `payment_proofs` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`file_key` text NOT NULL,
	`mime` varchar(64) NOT NULL,
	`size_bytes` int unsigned NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`refusal_reason` varchar(500),
	`submitted_by` varchar(36),
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp(3),
	`local_timestamp` timestamp(3) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_proofs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_events_kind_idx` ON `order_events` (`kind`);--> statement-breakpoint
CREATE INDEX `orders_profile_idx` ON `orders` (`profile_id`);--> statement-breakpoint
CREATE INDEX `orders_local_timestamp_idx` ON `orders` (`local_timestamp`);--> statement-breakpoint
CREATE INDEX `orders_network_idx` ON `orders` (`network`);--> statement-breakpoint
CREATE INDEX `receivables_profile_currency_idx` ON `receivables` (`profile_id`,`currency`);--> statement-breakpoint
CREATE INDEX `payment_proofs_order_idx` ON `payment_proofs` (`order_id`);--> statement-breakpoint
CREATE TRIGGER `order_events_block_update` BEFORE UPDATE ON `order_events`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenements de commande append-only : mise a jour interdite';--> statement-breakpoint
CREATE TRIGGER `order_events_block_delete` BEFORE DELETE ON `order_events`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenements de commande append-only : suppression interdite';--> statement-breakpoint
CREATE TRIGGER `receivables_block_update` BEFORE UPDATE ON `receivables`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'creance inalterable : mise a jour interdite';--> statement-breakpoint
CREATE TRIGGER `receivables_block_delete` BEFORE DELETE ON `receivables`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'creance inalterable : suppression interdite';