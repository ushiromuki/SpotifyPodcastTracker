import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.spotifyId === spotifyId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      accessToken,
      refreshToken,
      tokenExpiry,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
