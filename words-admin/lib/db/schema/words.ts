import { bigint, integer, json, pgTable, text } from "drizzle-orm/pg-core";

/**
 * 单词表：保存词书中的单词数据
 * content 为 json 类型的单词详情（例句、音标、释义、短语等）
 */
export const words = pgTable("words", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  wordRank: integer("wordRank"),
  headWord: text("headWord"),
  content: json("content"),
  bookId: text("bookId"),
});

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
