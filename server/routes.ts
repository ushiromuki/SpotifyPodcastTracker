import type { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import axios from "axios";
import { sign, verify } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { getPrismaClient } from './prismaClient';
import type { Bindings } from "./bindings";
import type { D1Database } from '@cloudflare/workers-types';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:5000/api/auth/callback";
const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

type UserType = {
  spotifyId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;
};

export function registerRoutes(app: Hono<{ Bindings: Bindings }>) {
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
    const prisma = await getPrismaClient(c.env.DB as D1Database);
    try {
      const query = c.req.query();
      const { code } = z.object({ code: z.string() }).parse(query);

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

      // ユーザーを取得または作成
      let user = await prisma.user.findUnique({
        where: {
          spotifyId: spotifyUser.data.id,
        },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            spotifyId: spotifyUser.data.id,
          accessToken: access_token,
          refreshToken: refresh_token,
            tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000),
          },
        });
      } else {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiry: Math.floor(tokenExpiry.getTime() / 1000),
          },
        });
      }

      const token = await sign({
        spotifyId: user.spotifyId,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        tokenExpiry: new Date(user.tokenExpiry * 1000).toISOString(),
      }, JWT_SECRET);

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

      return c.json(response.data.items);
    } catch (error) {
      console.error('Shows fetch error:', error);
      return c.json({ message: "Failed to fetch shows" }, 500);
    }
  });

  app.get("/api/spotify/episodes/recent", auth, async (c) => {
    try {
      const user = c.get("user");
      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );

      const episodes = response.data.items
        .filter((item: any) => item.track.type === "episode");

      return c.json(episodes);
    } catch (error) {
      console.error('Episodes fetch error:', error);
      return c.json({ message: "Failed to fetch episodes" }, 500);
    }
  });

  return app;
}