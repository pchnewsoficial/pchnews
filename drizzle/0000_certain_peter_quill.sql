CREATE TABLE `adRequests` (
	`id` varchar(96) NOT NULL,
	`business` varchar(180) NOT NULL,
	`contact` varchar(240) NOT NULL,
	`packageName` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`status` enum('received','reviewing','approved') NOT NULL DEFAULT 'received',
	`createdAtMs` bigint NOT NULL,
	CONSTRAINT `adRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` varchar(96) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`author` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`date` varchar(32) NOT NULL,
	`updated` varchar(64) NOT NULL,
	`status` enum('published','draft','scheduled','archived') NOT NULL DEFAULT 'draft',
	`views` int NOT NULL DEFAULT 0,
	`image` text NOT NULL,
	`bodyHtml` text NOT NULL,
	`scheduledAt` bigint,
	`tags` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `columnistProfiles` (
	`slug` varchar(96) NOT NULL,
	`name` varchar(160) NOT NULL,
	`beat` varchar(180) NOT NULL,
	`bio` text NOT NULL,
	`photo` text NOT NULL,
	`instagram` varchar(160) NOT NULL,
	`facebook` varchar(160) NOT NULL,
	`x` varchar(160) NOT NULL,
	`linkedin` varchar(180) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `columnistProfiles_slug` PRIMARY KEY(`slug`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(96) NOT NULL,
	`articleId` varchar(96) NOT NULL,
	`name` varchar(160) NOT NULL,
	`text` text NOT NULL,
	`createdAtMs` bigint NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reply` text,
	`repliedBy` varchar(180),
	`repliedAtMs` bigint,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
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
