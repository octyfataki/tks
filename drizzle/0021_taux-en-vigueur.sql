ALTER TABLE `taux_change` DROP INDEX `taux_change_jour_unique`;--> statement-breakpoint
ALTER TABLE `taux_change` ADD `numero` bigint unsigned NOT NULL;--> statement-breakpoint
UPDATE `taux_change`
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `horodatage_local`, `recu_le`) AS `rang`
  FROM `taux_change`
) `premier_a_dernier` ON `premier_a_dernier`.`id` = `taux_change`.`id`
SET `taux_change`.`numero` = `premier_a_dernier`.`rang`;--> statement-breakpoint
ALTER TABLE `taux_change` ADD CONSTRAINT `taux_change_numero_unique` UNIQUE(`numero`);--> statement-breakpoint
CREATE INDEX `taux_change_journal_idx` ON `taux_change` (`jour`);