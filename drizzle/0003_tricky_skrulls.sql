CREATE TABLE `reglages` (
	`cle` varchar(64) NOT NULL,
	`valeur` varchar(255) NOT NULL,
	`modifie_par` varchar(36),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `reglages_cle` PRIMARY KEY(`cle`)
);
