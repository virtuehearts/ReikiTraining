import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const users = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  image: text('image'),
  role: text('role').default('USER').notNull(),
  status: text('status').default('PENDING').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const aiSettings = sqliteTable('aiSettings', {
  id: text('id').primaryKey().default('default'),
  systemPrompt: text('systemPrompt').notNull(),
  model: text('model').default('nvidia/nemotron-3-nano-30b-a3b:free').notNull(),
  temperature: real('temperature').default(0.7).notNull(),
  topP: real('topP').default(1.0).notNull(),
  maxContextMessages: integer('maxContextMessages').default(40).notNull(),
  enableMemory: integer('enableMemory', { mode: 'boolean' }).default(true).notNull(),
  openrouterApiKey: text('openrouterApiKey'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const memoryConfig = sqliteTable('memoryConfig', {
  id: text('id').primaryKey().default('default'),
  retentionDays: integer('retentionDays').default(90).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const memoryItems = sqliteTable('memoryItem', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
  scope: text('scope').notNull().default('user'),
  type: text('type').notNull().default('note'),
  content: text('content').notNull(),
  tags: text('tags').default('[]').notNull(),
  confidence: integer('confidence').default(60).notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).default(false).notNull(),
  source: text('source').default('chat').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  lastUsedAt: integer('lastUsedAt', { mode: 'timestamp' }),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }),
});

export const memoryEvents = sqliteTable('memoryEvent', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  actorId: text('actorId').references(() => users.id, { onDelete: 'set null' }),
  userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  details: text('details').default('{}').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const chatMessages = sqliteTable('chatMessage', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // user, assistant
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const userMemories = sqliteTable('userMemory', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  memory: text('memory').notNull(),
  source: text('source').default('chat').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const coreMemories = sqliteTable('coreMemory', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  memory: text('memory').notNull(),
  sourceUserId: text('sourceUserId').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const messages = sqliteTable('message', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  senderId: text('senderId').notNull().references(() => users.id),
  receiverId: text('receiverId').notNull().references(() => users.id),
  content: text('content').notNull(),
  isRead: integer('isRead', { mode: 'boolean' }).default(false).notNull(),
  isBooking: integer('isBooking', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const intakes = sqliteTable('intake', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  age: integer('age'),
  location: text('location'),
  gender: text('gender'),
  experience: text('experience'),
  goal: text('goal'),
  whyJoined: text('whyJoined'),
  healthConcerns: text('healthConcerns'),
  userAgent: text('userAgent'),
  browserType: text('browserType'),
  ipAddress: text('ipAddress'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const progress = sqliteTable('progress', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: integer('day').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
}, (t) => ({
  unq: unique().on(t.userId, t.day),
}));

export const reflections = sqliteTable('reflection', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: integer('day').notNull(),
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.day),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  intake: one(intakes),
  progress: many(progress),
  reflections: many(reflections),
  chatMessages: many(chatMessages),
  userMemories: many(userMemories),
  authoredCoreMemories: many(coreMemories),
  memoryItems: many(memoryItems),
  actorMemoryEvents: many(memoryEvents, { relationName: 'actorMemoryEvents' }),
  targetMemoryEvents: many(memoryEvents, { relationName: 'targetMemoryEvents' }),
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
}));

export const memoryItemsRelations = relations(memoryItems, ({ one }) => ({
  user: one(users, {
    fields: [memoryItems.userId],
    references: [users.id],
  }),
}));

export const memoryEventsRelations = relations(memoryEvents, ({ one }) => ({
  actor: one(users, {
    fields: [memoryEvents.actorId],
    references: [users.id],
    relationName: 'actorMemoryEvents',
  }),
  targetUser: one(users, {
    fields: [memoryEvents.userId],
    references: [users.id],
    relationName: 'targetMemoryEvents',
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const userMemoriesRelations = relations(userMemories, ({ one }) => ({
  user: one(users, {
    fields: [userMemories.userId],
    references: [users.id],
  }),
}));

export const coreMemoriesRelations = relations(coreMemories, ({ one }) => ({
  sourceUser: one(users, {
    fields: [coreMemories.sourceUserId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sentMessages',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'receivedMessages',
  }),
}));

export const intakesRelations = relations(intakes, ({ one }) => ({
  user: one(users, {
    fields: [intakes.userId],
    references: [users.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
}));

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  user: one(users, {
    fields: [reflections.userId],
    references: [users.id],
  }),
}));
