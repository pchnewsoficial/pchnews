CREATE TABLE `columnistInvites` (
	`id` varchar(96) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(160) NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAtMs` bigint NOT NULL,
	`createdAtMs` bigint NOT NULL,
	`acceptedAtMs` bigint,
	CONSTRAINT `columnistInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `columnistInvites_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `authorOpenId` varchar(64);