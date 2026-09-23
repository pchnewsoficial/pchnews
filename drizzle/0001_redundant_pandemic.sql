CREATE TABLE `viewEvents` (
	`id` varchar(96) NOT NULL,
	`articleId` varchar(96) NOT NULL,
	`visitorId` varchar(128) NOT NULL,
	`viewedAtMs` bigint NOT NULL,
	CONSTRAINT `viewEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','columnist') NOT NULL DEFAULT 'user';