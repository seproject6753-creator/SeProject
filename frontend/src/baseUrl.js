// Return API base URL. In dev, REACT_APP_APILINK should be set in .env.
// Fallback defaults to port 4000 (backend default) so local dev works
// even if the .env wasn't loaded before starting the frontend.
export const baseApiURL = () => {
  // Prefer explicit env var
  if (process.env.REACT_APP_APILINK) return process.env.REACT_APP_APILINK;
  // In production (Netlify), call Render directly as robust fallback
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://seproject-1-skjz.onrender.com/api";
  }
  // Dev fallback
  return "http://localhost:4000/api";
};
