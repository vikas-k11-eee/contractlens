CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`obligationId` int,
	`alertType` varchar(120) NOT NULL,
	`message` text NOT NULL,
	`deadline` timestamp,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clauses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`documentId` int NOT NULL,
	`clauseNumber` varchar(32),
	`title` varchar(255) NOT NULL,
	`text` text NOT NULL,
	`category` varchar(100),
	`pageNumber` int,
	`confidence` decimal(5,2),
	CONSTRAINT `clauses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`kind` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`severity` enum('info','review','critical') NOT NULL DEFAULT 'info',
	`documentId` int,
	`pageNumber` int,
	`section` varchar(120),
	CONSTRAINT `contractInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractParties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`partyType` varchar(80),
	`role` varchar(120),
	`address` text,
	CONSTRAINT `contractParties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`documentId` int NOT NULL,
	`versionLabel` varchar(80) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`contractType` varchar(120) NOT NULL,
	`status` enum('active','review','expiring','archived') NOT NULL DEFAULT 'active',
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`effectiveDate` timestamp,
	`expirationDate` timestamp,
	`renewalDate` timestamp,
	`ownerName` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deadlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`obligationId` int,
	`label` varchar(255) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`status` enum('upcoming','due_soon','due','completed','overdue') NOT NULL DEFAULT 'upcoming',
	CONSTRAINT `deadlines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileKey` varchar(512),
	`fileSize` int,
	`pageCount` int,
	`processingStatus` enum('uploading','processing','analyzing','completed','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obligations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`clauseId` int,
	`obligation` text NOT NULL,
	`responsibleParty` varchar(255) NOT NULL,
	`beneficiary` varchar(255),
	`dueDate` timestamp,
	`frequency` varchar(80),
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('upcoming','due_soon','due','completed','overdue') NOT NULL DEFAULT 'upcoming',
	`sourceClause` varchar(120),
	`sourcePage` int,
	`confidence` decimal(5,2),
	CONSTRAINT `obligations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourceReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`documentId` int NOT NULL,
	`pageNumber` int,
	`section` varchar(120),
	`clauseNumber` varchar(32),
	`excerpt` text NOT NULL,
	CONSTRAINT `sourceReferences_id` PRIMARY KEY(`id`)
);
