import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { spotifyAuthSchema } from "@shared/schema";
import axios from "axios";
import { sign, verify } from "hono/jwt";
import { setCookie } from "hono/cookie";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const REDIRECT_URI = "https://3635f46b-4ee1-45e0-b0f2-2f0abfcad691-00-1gm4duagcdqnv.janeway.replit.dev/api/auth/callback";
const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

type UserType = {
  spotifyId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: UserType;
  }
}

export function registerRoutes(app: Hono) {
  // Auth routes
  app.get("/api/auth/login", async (c) => {
    try {
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
      return c.json({ url: authUrl });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Failed to initiate login process' }, 500);
    }
  });

  app.get("/api/auth/callback", async (c) => {
    try {
      const query = c.req.query();
      const { code, state } = spotifyAuthSchema.parse(query);

      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
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

      // Create JWT token
      const token = await sign({
        spotifyId: spotifyUser.data.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: tokenExpiry.toISOString(),
      }, JWT_SECRET);

      // Set JWT token in cookie using Hono's setCookie
      setCookie(c, "auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });

      return c.redirect("/stats");
    } catch (error) {
      console.error('Auth callback error:', error);
      return c.redirect("/login?error=auth_failed");
    }
  });

  // Protected route middleware
  const auth = async (c: any, next: any) => {
    const token = c.cookie("auth_token");
    if (!token) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    try {
      const payload = await verify(token, JWT_SECRET);
      c.set("user", payload as UserType);
      await next();
    } catch (error) {
      return c.json({ message: "Invalid token" }, 401);
    }
  };

  // Spotify API routes
  app.get("/api/spotify/shows", auth, async (c) => {
    try {
      const user = c.get("user");
      const response = await axios.get("https://api.spotify.com/v1/me/shows", {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      const shows = response.data.items.map((item: any) => {
        const show = item.show;
        return {
          id: show.id,
          name: show.name,
          publisher: show.publisher,
          description: show.description,
          images: show.images,
        };
      });

      return c.json(shows);
    } catch (error) {
      console.error('Shows fetch error:', error);
      return c.json({ message: "Failed to fetch shows" }, 500);
    }
  });

  app.get("/api/spotify/episodes/played", auth, async (c) => {
    try {
      const user = c.get("user");
      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );

      const episodes = response.data.items
        .filter((item: any) => item.track.type === "episode")
        .map((item: any) => {
          const episode = item.track;
          return {
            id: episode.id,
            name: episode.name,
            duration_ms: episode.duration_ms,
            played_at: item.played_at,
          };
        });

      return c.json(episodes);
    } catch (error) {
      console.error('Episodes fetch error:', error);
      return c.json({ message: "Failed to fetch episodes" }, 500);
    }
  });

  return app;
}