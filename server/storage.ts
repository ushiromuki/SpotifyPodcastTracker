import { 
  users, podcastShows, playedEpisodes,
  type User, type InsertUser,
  type PodcastShow, type InsertPodcastShow,
  type PlayedEpisode, type InsertPlayedEpisode
} from "@shared/schema";
import { Database } from "./db";
import { eq } from "drizzle-orm";

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

export class D1Storage implements IStorage {
  constructor(private db: Database) {}

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.spotifyId, spotifyId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ 
        accessToken, 
        refreshToken, 
        tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000) // Convert to Unix timestamp
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Podcast show operations
  async getPodcastShows(userId: number): Promise<PodcastShow[]> {
    return this.db.select().from(podcastShows).where(eq(podcastShows.userId, userId));
  }

  async createPodcastShow(show: InsertPodcastShow): Promise<PodcastShow> {
    const [podcastShow] = await this.db.insert(podcastShows).values(show).returning();
    return podcastShow;
  }

  // Episode operations
  async getPlayedEpisodes(userId: number): Promise<PlayedEpisode[]> {
    return this.db
      .select()
      .from(playedEpisodes)
      .where(eq(playedEpisodes.userId, userId))
      .orderBy(playedEpisodes.playedAt);
  }

  async createPlayedEpisode(episode: InsertPlayedEpisode): Promise<PlayedEpisode> {
    const [playedEpisode] = await this.db.insert(playedEpisodes).values(episode).returning();
    return playedEpisode;
  }
}

// storage will be initialized with the D1 database instance in the Cloudflare Worker
export let storage: IStorage;

export function initializeStorage(db: Database) {
  storage = new D1Storage(db);
}