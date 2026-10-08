CREATE TABLE `permissions_agents` (
	`agent_id` varchar(36) NOT NULL,
	`permission` varchar(64) NOT NULL,
	`accorde_par` varchar(36) NOT NULL,
	`accorde_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_agents_agent_id_permission_pk` PRIMARY KEY(`agent_id`,`permission`)
);
--> statement-breakpoint
CREATE TABLE `journal_audit` (
	`id` varchar(36) NOT NULL,
	`acteur_id` varchar(36),
	`role_au_moment` varchar(32) NOT NULL,
	`type_action` varchar(128) NOT NULL,
	`entite` varchar(128) NOT NULL,
	`entite_id` varchar(36),
	`avant` json,
	`apres` json,
	`appareil_id` varchar(128),
	`horodatage_local` timestamp(3) NOT NULL,
	`recu_le` timestamp(3) NOT NULL DEFAULT (now()),
	`statut` varchar(16) NOT NULL DEFAULT 'REUSSIE',
	`motif` varchar(255),
	CONSTRAINT `journal_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `permissions_agents_agent_idx` ON `permissions_agents` (`agent_id`);--> statement-breakpoint
CREATE INDEX `permissions_agents_permission_idx` ON `permissions_agents` (`permission`);--> statement-breakpoint
CREATE INDEX `journal_audit_acteur_idx` ON `journal_audit` (`acteur_id`);--> statement-breakpoint
CREATE INDEX `journal_audit_entite_idx` ON `journal_audit` (`entite`,`entite_id`);--> statement-breakpoint
CREATE INDEX `journal_audit_type_idx` ON `journal_audit` (`type_action`);--> statement-breakpoint
CREATE INDEX `journal_audit_recu_idx` ON `journal_audit` (`recu_le`);
--> statement-breakpoint
-- S2 issue 01 — journal append-only garanti par la base (ADR-0006) :
-- toute mise à jour ou suppression est rejetée, y compris par un accès
-- direct en base. Seule l'insertion est possible.
CREATE TRIGGER `journal_audit_bloque_update` BEFORE UPDATE ON `journal_audit`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'journal append-only : mise à jour interdite';
--> statement-breakpoint
CREATE TRIGGER `journal_audit_bloque_delete` BEFORE DELETE ON `journal_audit`
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'journal append-only : suppression interdite';