import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { spotifyAuthSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:5000/api/auth/callback";

export function registerRoutes(app: Express): Server {
  app.get("/api/auth/login", (_req, res) => {
    try {
      // Debug logs for environment variables
      console.log('SPOTIFY_CLIENT_ID exists:', !!SPOTIFY_CLIENT_ID);
      console.log('SPOTIFY_CLIENT_SECRET exists:', !!SPOTIFY_CLIENT_SECRET);

      const state = Math.random().toString(36).substring(7);
      const scope = "user-read-playback-position user-library-read user-read-recently-played";

      const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
        state,
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      console.log('Full auth URL:', authUrl);

      // 直接URLにリダイレクトする代わりに、JSONレスポンスを返す
      res.json({ url: authUrl });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to initiate login process' });
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    try {
      const { code, state } = spotifyAuthSchema.parse(req.query);

      const response = await axios.post("https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }), {
          headers: {
            "Authorization": `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      const spotifyUser = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const tokenExpiry = new Date(Date.now() + expires_in * 1000);

      let user = await storage.getUserBySpotifyId(spotifyUser.data.id);
      if (!user) {
        user = await storage.createUser({
          spotifyId: spotifyUser.data.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry,
        });
      } else {
        user = await storage.updateUserToken(user.id, access_token, refresh_token, tokenExpiry);
      }

      req.session.userId = user.id;
      res.redirect("/stats");
    } catch (error) {
      console.error(error);
      res.redirect("/login?error=auth_failed");
    }
  });

  // New endpoint to fetch user's saved shows
  app.get("/api/spotify/shows", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const response = await axios.get("https://api.spotify.com/v1/me/shows", {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      const shows = await Promise.all(
        response.data.items.map(async (item: any) => {
          const show = item.show;
          const existingShow = await storage.createPodcastShow({
            spotifyId: show.id,
            name: show.name,
            publisher: show.publisher,
            description: show.description,
            imageUrl: show.images[0]?.url || "",
            userId: user.id,
          });
          return existingShow;
        })
      );

      res.json(shows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch shows" });
    }
  });

  // New endpoint to fetch recently played episodes
  app.get("/api/spotify/episodes/played", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played", {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );

      const episodes = await Promise.all(
        response.data.items
          .filter((item: any) => item.track.type === "episode")
          .map(async (item: any) => {
            const episode = item.track;
            const show = await storage.createPodcastShow({
              spotifyId: episode.show.id,
              name: episode.show.name,
              publisher: episode.show.publisher,
              description: episode.show.description,
              imageUrl: episode.show.images[0]?.url || "",
              userId: user.id,
            });

            return storage.createPlayedEpisode({
              spotifyId: episode.id,
              name: episode.name,
              durationMs: episode.duration_ms,
              playedAt: new Date(item.played_at),
              showId: show.id,
              userId: user.id,
            });
          })
      );

      res.json(episodes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}