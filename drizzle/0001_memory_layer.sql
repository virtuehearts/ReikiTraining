CREATE TABLE IF NOT EXISTS `memoryConfig` (
  `id` text PRIMARY KEY NOT NULL DEFAULT 'default',
  `retentionDays` integer NOT NULL DEFAULT 90,
  `updatedAt` integer NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS `memoryItem` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text,
  `scope` text NOT NULL DEFAULT 'user',
  `type` text NOT NULL DEFAULT 'note',
  `content` text NOT NULL,
  `tags` text NOT NULL DEFAULT '[]',
  `confidence` integer NOT NULL DEFAULT 60,
  `pinned` integer NOT NULL DEFAULT false,
  `source` text NOT NULL DEFAULT 'chat',
  `createdAt` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  `updatedAt` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  `lastUsedAt` integer,
  `expiresAt` integer,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `memoryEvent` (
  `id` text PRIMARY KEY NOT NULL,
  `actorId` text,
  `userId` text,
  `action` text NOT NULL,
  `details` text NOT NULL DEFAULT '{}',
  `createdAt` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE set null,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE set null
);

CREATE INDEX IF NOT EXISTS `memoryItem_user_idx` ON `memoryItem` (`userId`);
CREATE INDEX IF NOT EXISTS `memoryItem_scope_idx` ON `memoryItem` (`scope`);
CREATE INDEX IF NOT EXISTS `memoryItem_expires_idx` ON `memoryItem` (`expiresAt`);
CREATE INDEX IF NOT EXISTS `memoryEvent_created_idx` ON `memoryEvent` (`createdAt`);
