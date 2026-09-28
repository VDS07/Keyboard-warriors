/**
 * Central API configuration for local development and Vercel production hosting
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ? "" // On Vercel, requests to /api route directly to serverless API functions
    : "http://localhost:3001"; // Local dev fallback
