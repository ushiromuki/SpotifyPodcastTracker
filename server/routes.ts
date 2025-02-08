import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { spotifyAuthSchema } from "@shared/schema";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:5000/api/auth/callback";

export function registerRoutes(app: Express): Server {
  app.get("/api/auth/login", (_req, res) => {
    const state = Math.random().toString(36).substring(7);
    const scope = "user-read-playback-position user-library-read";
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
      state,
    });

    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
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

  const httpServer = createServer(app);
  return httpServer;
}
