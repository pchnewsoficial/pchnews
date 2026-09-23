CREATE TABLE `articleAudit` (
	`id` varchar(96) NOT NULL,
	`articleId` varchar(96) NOT NULL,
	`actorOpenId` varchar(64) NOT NULL,
	`actorName` varchar(180) NOT NULL,
	`action` varchar(64) NOT NULL,
	`beforeJson` text,
	`afterJson` text,
	`createdAtMs` bigint NOT NULL,
	CONSTRAINT `articleAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `columnistInvites` ADD `revokedAtMs` bigint;