import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  is_approved: boolean("is_approved").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const watchlist_movies = pgTable("watchlist_movies", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  movie_id: integer("movie_id").notNull(),
  movie_title: text("movie_title").notNull(),
  poster_path: text("poster_path"),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

// Neue Tabelle für den Download-Status
export const download_status = pgTable("download_status", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  status: text("status").notNull(), // 'processing', 'downloading', 'extracting', 'failed', 'completed'
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  watchlist: many(watchlist_movies),
}));

export const watchlistRelations = relations(watchlist_movies, ({ one }) => ({
  user: one(users, {
    fields: [watchlist_movies.user_id],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertWatchlistMovieSchema = createInsertSchema(watchlist_movies);
export const selectWatchlistMovieSchema = createSelectSchema(watchlist_movies);
export type InsertWatchlistMovie = typeof watchlist_movies.$inferInsert;
export type SelectWatchlistMovie = typeof watchlist_movies.$inferSelect;

export const insertDownloadStatusSchema = createInsertSchema(download_status);
export const selectDownloadStatusSchema = createSelectSchema(download_status);
export type InsertDownloadStatus = typeof download_status.$inferInsert;
export type SelectDownloadStatus = typeof download_status.$inferSelect;