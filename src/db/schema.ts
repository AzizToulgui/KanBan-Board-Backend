import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: integer('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
  },
  (t) => ({
    pk: primaryKey(t.projectId, t.userId),
  }),
);

export const board_columns = pgTable('board_columns', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  columnId: integer('column_id')
    .references(() => board_columns.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: integer('assignee_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  priority: priorityEnum('priority').notNull().default('low'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ticketAttachments = pgTable('ticket_attachments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .references(() => tickets.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  uploadedBy: integer('uploaded_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  memberProjects: many(projectMembers),
  assignedTickets: many(tickets),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  members: many(projectMembers),
  columns: many(board_columns),
}));

export const board_columnsRelations = relations(
  board_columns,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [board_columns.projectId],
      references: [projects.id],
    }),
    tickets: many(tickets),
  }),
);

export const ticketsRelations = relations(tickets, ({ one }) => ({
  column: one(board_columns, {
    fields: [tickets.columnId],
    references: [board_columns.id],
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
  }),
}));

export type TicketAttchment = typeof ticketAttachments.$inferSelect;
