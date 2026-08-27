import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 单词书表：保存单词书信息，通过 bookId 与 words 表关联
 */
export const books = pgTable("books", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  wordCount: integer("word_count").notNull().default(0),
  coverUrl: text("cover_url"),
  bookId: varchar("book_id", { length: 100 }).notNull().unique(),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;