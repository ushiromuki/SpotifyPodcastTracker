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

// Memory storage for development
class MemStorage implements IStorage {
  private users: User[] = [];
  private shows: PodcastShow[] = [];
  private episodes: PlayedEpisode[] = [];
  private nextId = 1;

  async getUser(id: number) {
    return this.users.find(u => u.id === id);
  }

  async getUserBySpotifyId(spotifyId: string) {
    return this.users.find(u => u.spotifyId === spotifyId);
  }

  async createUser(user: InsertUser) {
    const newUser = { ...user, id: this.nextId++ } as User;
    this.users.push(newUser);
    return newUser;
  }

  async updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date) {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, { accessToken, refreshToken, tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000) });
    return user;
  }

  async getPodcastShows(userId: number) {
    return this.shows.filter(s => s.userId === userId);
  }

  async createPodcastShow(show: InsertPodcastShow) {
    const newShow = { ...show, id: this.nextId++ } as PodcastShow;
    this.shows.push(newShow);
    return newShow;
  }

  async getPlayedEpisodes(userId: number) {
    return this.episodes.filter(e => e.userId === userId);
  }

  async createPlayedEpisode(episode: InsertPlayedEpisode) {
    const newEpisode = { ...episode, id: this.nextId++ } as PlayedEpisode;
    this.episodes.push(newEpisode);
    return newEpisode;
  }
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
        tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000)
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

export let storage: IStorage;

export function initializeStorage(db: Database | null) {
  storage = db ? new D1Storage(db) : new MemStorage();
}