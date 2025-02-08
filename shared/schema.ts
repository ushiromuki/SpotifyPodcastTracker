import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry").notNull(),
});

export const podcastShows = pgTable("podcast_shows", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(),
  name: text("name").notNull(),
  publisher: text("publisher").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const playedEpisodes = pgTable("played_episodes", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull(),
  name: text("name").notNull(),
  durationMs: integer("duration_ms").notNull(),
  playedAt: timestamp("played_at").notNull(),
  showId: integer("show_id").notNull().references(() => podcastShows.id),
  userId: integer("user_id").notNull().references(() => users.id),
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