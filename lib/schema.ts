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
  model: text('model').default('meta-llama/llama-3.1-8b-instruct:free').notNull(),
  temperature: real('temperature').default(0.7).notNull(),
  topP: real('topP').default(1.0).notNull(),
  openrouterApiKey: text('openrouterApiKey'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const chatMessages = sqliteTable('chatMessage', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // user, assistant
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
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
  experience: text('experience'),
  goal: text('goal'),
  healthConcerns: text('healthConcerns'),
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
  intake: one(intakes, {
    fields: [users.id],
    references: [intakes.userId],
  }),
  progress: many(progress),
  reflections: many(reflections),
  chatMessages: many(chatMessages),
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
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
