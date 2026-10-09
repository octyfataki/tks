CREATE TABLE `permissions_socle_agents` (
	`permission` varchar(64) NOT NULL,
	`accorde_par` varchar(36) NOT NULL,
	`accorde_le` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_socle_agents_permission` PRIMARY KEY(`permission`)
);
