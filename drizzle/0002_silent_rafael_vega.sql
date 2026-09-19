CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`deadlineAlerts` boolean NOT NULL DEFAULT true,
	`renewalAlerts` boolean NOT NULL DEFAULT true,
	`overdueAlerts` boolean NOT NULL DEFAULT true,
	`weeklySummary` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `chatSessions` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `obligations` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` varchar(512);