import { 
  users, podcastShows, playedEpisodes,
  type User, type InsertUser,
  type PodcastShow, type InsertPodcastShow,
  type PlayedEpisode, type InsertPlayedEpisode
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User>;

  // Podcast show operations
  getPodcastShows(userId: number): Promise<PodcastShow[]>;
  createPodcastShow(show: InsertPodcastShow): Promise<PodcastShow>;

  // Episode operations
  getPlayedEpisodes(userId: number): Promise<PlayedEpisode[]>;
  createPlayedEpisode(episode: InsertPlayedEpisode): Promise<PlayedEpisode>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.spotifyId, spotifyId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ accessToken, refreshToken, tokenExpiry })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Podcast show operations
  async getPodcastShows(userId: number): Promise<PodcastShow[]> {
    return db.select().from(podcastShows).where(eq(podcastShows.userId, userId));
  }

  async createPodcastShow(show: InsertPodcastShow): Promise<PodcastShow> {
    const [podcastShow] = await db.insert(podcastShows).values(show).returning();
    return podcastShow;
  }

  // Episode operations
  async getPlayedEpisodes(userId: number): Promise<PlayedEpisode[]> {
    return db
      .select()
      .from(playedEpisodes)
      .where(eq(playedEpisodes.userId, userId))
      .orderBy(desc(playedEpisodes.playedAt));
  }

  async createPlayedEpisode(episode: InsertPlayedEpisode): Promise<PlayedEpisode> {
    const [playedEpisode] = await db.insert(playedEpisodes).values(episode).returning();
    return playedEpisode;
  }
}

export const storage = new DatabaseStorage();