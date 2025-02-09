import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { sqliteTable, text as sqliteText, integer as sqliteInteger } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite schema for Cloudflare D1
export const users = sqliteTable("users", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  spotifyId: sqliteText("spotify_id").notNull().unique(),
  accessToken: sqliteText("access_token").notNull(),
  refreshToken: sqliteText("refresh_token").notNull(),
  tokenExpiry: sqliteInteger("token_expiry").notNull(), // SQLite doesn't have timestamp, store as Unix timestamp
});

export const podcastShows = sqliteTable("podcast_shows", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  spotifyId: sqliteText("spotify_id").notNull().unique(),
  name: sqliteText("name").notNull(),
  publisher: sqliteText("publisher").notNull(),
  description: sqliteText("description").notNull(),
  imageUrl: sqliteText("image_url").notNull(),
  userId: sqliteInteger("user_id").notNull(),
});

export const playedEpisodes = sqliteTable("played_episodes", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  spotifyId: sqliteText("spotify_id").notNull(),
  name: sqliteText("name").notNull(),
  durationMs: sqliteInteger("duration_ms").notNull(),
  playedAt: sqliteInteger("played_at").notNull(), // SQLite doesn't have timestamp, store as Unix timestamp
  showId: sqliteInteger("show_id").notNull(),
  userId: sqliteInteger("user_id").notNull(),
});

// Schema for user insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema for podcast show insertion
export const insertPodcastShowSchema = createInsertSchema(podcastShows).omit({ id: true });
export type InsertPodcastShow = z.infer<typeof insertPodcastShowSchema>;
export type PodcastShow = typeof podcastShows.$inferSelect;

// Schema for played episode insertion
export const insertPlayedEpisodeSchema = createInsertSchema(playedEpisodes).omit({ id: true });
export type InsertPlayedEpisode = z.infer<typeof insertPlayedEpisodeSchema>;
export type PlayedEpisode = typeof playedEpisodes.$inferSelect;

// Auth schema remains the same
export const spotifyAuthSchema = z.object({
  code: z.string(),
  state: z.string(),
});