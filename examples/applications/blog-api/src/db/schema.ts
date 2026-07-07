import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const postsTable = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  tags: text("tags"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
