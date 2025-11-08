// Return API base URL. In dev, REACT_APP_APILINK should be set in .env.
// Fallback defaults to port 4000 (backend default) so local dev works
// even if the .env wasn't loaded before starting the frontend.
export const baseApiURL = () => {
  return process.env.REACT_APP_APILINK || "http://localhost:4000/api";
};
