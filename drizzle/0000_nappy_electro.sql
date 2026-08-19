CREATE TABLE `ssdCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`manufacturer` varchar(64) NOT NULL,
	`model` varchar(128) NOT NULL,
	`formFactor` varchar(32),
	`capacityGb` int NOT NULL,
	`pcieGen` varchar(16),
	`nvmeVersion` varchar(16),
	`readIops` int,
	`writeIops` int,
	`readMBps` int,
	`writeMBps` int,
	`dwpd` decimal(6,2),
	`enduranceTbw` int,
	`powerActiveW` decimal(6,2),
	`powerLossProtection` enum('verified','not_verified','unknown') NOT NULL DEFAULT 'unknown',
	`encryption` enum('verified','not_verified','unknown') NOT NULL DEFAULT 'unknown',
	`sourceFileName` varchar(255),
	`sourceUrl` varchar(2048),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ssdCandidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `ssdCandidates_user_idx` ON `ssdCandidates` (`userId`);