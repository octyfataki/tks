ALTER TABLE `journal_audit` ADD `conteste_id` varchar(36);--> statement-breakpoint
CREATE INDEX `journal_audit_conteste_idx` ON `journal_audit` (`conteste_id`);