CREATE TABLE `cash_accounts` (
	`id` varchar(36) NOT NULL,
	`type` varchar(20) NOT NULL,
	`network` varchar(32) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`opening_amount` int unsigned NOT NULL,
	`opened_at` timestamp(3) NOT NULL,
	`opened_by` varchar(36) NOT NULL,
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cash_accounts_type_network_currency_uk` UNIQUE(`type`,`network`,`currency`)
);
--> statement-breakpoint
CREATE TABLE `cash_movements` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`kind` varchar(12) NOT NULL,
	`direction` varchar(4) NOT NULL,
	`category` varchar(20) NOT NULL,
	`amount` int unsigned NOT NULL,
	`currency` varchar(3) NOT NULL,
	`description` varchar(400),
	`occurred_at` timestamp(3) NOT NULL,
	`entered_by` varchar(36) NOT NULL,
	`source_kind` varchar(10) NOT NULL,
	`source_id` varchar(36),
	`transfer_id` varchar(36),
	`corrected_of` varchar(36),
	`device_id` varchar(64),
	`received_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cash_accounts_opened_at_idx` ON `cash_accounts` (`opened_at`);--> statement-breakpoint
CREATE INDEX `cash_movements_account_occurred_idx` ON `cash_movements` (`account_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `cash_movements_category_occurred_idx` ON `cash_movements` (`category`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `cash_movements_transfer_idx` ON `cash_movements` (`transfer_id`);--> statement-breakpoint
CREATE INDEX `cash_movements_corrected_of_idx` ON `cash_movements` (`corrected_of`);--> statement-breakpoint
CREATE INDEX `cash_movements_entered_by_idx` ON `cash_movements` (`entered_by`);
--> statement-breakpoint
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_type_ck` CHECK (`type` IN ('CASH', 'ELECTRONIC_MONEY'));--> statement-breakpoint
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_currency_ck` CHECK (`currency` IN ('USD', 'CDF'));--> statement-breakpoint
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_forme_ck` CHECK ((`type` = 'CASH' AND `network` = '') OR (`type` = 'ELECTRONIC_MONEY' AND `network` IN ('ORANGE', 'AIRTEL', 'AFRICELL', 'VODACOM')));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_sens_ck` CHECK (`direction` IN ('IN', 'OUT'));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_nature_ck` CHECK (`kind` IN ('OPERATION', 'CORRECTION'));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_source_ck` CHECK (`source_kind` IN ('MANUAL', 'AUTOMATIC'));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_devise_ck` CHECK (`currency` IN ('USD', 'CDF'));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_montant_ck` CHECK (`amount` > 0);--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_categorie_sens_ck` CHECK (`kind` = 'CORRECTION' OR (`category` = 'TRANSFER' AND `direction` IN ('IN', 'OUT')) OR (`category` = 'SALE' AND `direction` = 'IN') OR (`category` IN ('BANK_WITHDRAWAL', 'OPERATOR_TOPUP', 'REPAYMENT', 'OWNER_WITHDRAWAL') AND `direction` = 'OUT'));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_transfert_paire_ck` CHECK (`transfer_id` IS NULL OR `category` = 'TRANSFER');--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_correction_liee_ck` CHECK ((`kind` = 'CORRECTION' AND `corrected_of` IS NOT NULL) OR (`kind` = 'OPERATION' AND `corrected_of` IS NULL));--> statement-breakpoint
ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_automatique_sale_ck` CHECK (`source_kind` = 'MANUAL' OR (`source_kind` = 'AUTOMATIC' AND `source_id` IS NOT NULL AND `category` = 'SALE'));
--> statement-breakpoint
CREATE TRIGGER `cash_accounts_block_update` BEFORE UPDATE ON `cash_accounts`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trésorerie append-only : mise à jour de compte interdite';
--> statement-breakpoint
CREATE TRIGGER `cash_accounts_block_delete` BEFORE DELETE ON `cash_accounts`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trésorerie append-only : suppression de compte interdite';
--> statement-breakpoint
CREATE TRIGGER `cash_movements_block_update` BEFORE UPDATE ON `cash_movements`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trésorerie append-only : mise à jour de mouvement interdite';
--> statement-breakpoint
CREATE TRIGGER `cash_movements_block_delete` BEFORE DELETE ON `cash_movements`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trésorerie append-only : suppression de mouvement interdite';