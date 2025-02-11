import { PrismaClient } from '@prisma/client';
import type { User, PodcastShow, PlayedEpisode } from '@prisma/client';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | null>;
  getUserBySpotifyId(spotifyId: string): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User>;

  // Podcast show operations
  getPodcastShows(userId: number): Promise<PodcastShow[]>;
  createPodcastShow(show: Omit<PodcastShow, 'id'>): Promise<PodcastShow>;

  // Episode operations
  getPlayedEpisodes(userId: number): Promise<PlayedEpisode[]>;
  createPlayedEpisode(episode: Omit<PlayedEpisode, 'id'>): Promise<PlayedEpisode>;
}

export class PrismaStorage implements IStorage {
  constructor(private prisma: PrismaClient) {}

  async getUser(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getUserBySpotifyId(spotifyId: string) {
    return this.prisma.user.findUnique({ where: { spotifyId } });
  }

  async createUser(user: Omit<User, 'id'>) {
    return this.prisma.user.create({ data: user });
  }

  async updateUserToken(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { 
        accessToken, 
        refreshToken, 
        tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000)
      }
    });
  }

  async getPodcastShows(userId: number) {
    return this.prisma.podcastShow.findMany({ where: { userId } });
  }

  async createPodcastShow(show: Omit<PodcastShow, 'id'>) {
    return this.prisma.podcastShow.create({ data: show });
  }

  async getPlayedEpisodes(userId: number) {
    return this.prisma.playedEpisode.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' }
    });
  }

  async createPlayedEpisode(episode: Omit<PlayedEpisode, 'id'>) {
    return this.prisma.playedEpisode.create({ data: episode });
  }
}