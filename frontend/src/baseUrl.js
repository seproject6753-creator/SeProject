// Return API base URL. In dev, REACT_APP_APILINK should be set in .env.
// Fallback defaults to port 4000 (backend default) so local dev works
// even if the .env wasn't loaded before starting the frontend.
export const baseApiURL = () => {
  // Prefer explicit env var
  if (process.env.REACT_APP_APILINK) return process.env.REACT_APP_APILINK;
  // In production (Netlify), use relative path which is proxied to Render via netlify.toml
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "/api";
  }
  // Dev fallback
  return "http://localhost:4000/api";
};
