import axios from "axios";
import { apiRequest } from "./queryClient";

export interface Show {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  publisher: string;
}

export interface Episode {
  id: string;
  name: string;
  duration_ms: number;
  played_at: string;
}

export async function getShows() {
  const response = await apiRequest("GET", "/api/spotify/shows");
  return response.json() as Promise<Show[]>;
}

export async function getPlayedEpisodes() {
  const response = await apiRequest("GET", "/api/spotify/episodes/played");
  return response.json() as Promise<Episode[]>;
}
