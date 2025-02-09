import { queryClient } from "./queryClient";

export async function logout() {
  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  queryClient.clear();
  window.location.href = "/login";
}

export function isAuthenticated() {
  return document.cookie.includes("auth_token=");
}

export function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export function getAuthToken() {
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? match[2] : null;
}

export function checkTokenExpiry() {
  const token = getAuthToken();
  if (!token) return false;

  const payload = parseJwt(token);
  if (!payload) return false;

  const tokenExpiry = new Date(payload.tokenExpiry);
  return tokenExpiry > new Date();
}