// Return API base URL. In dev, REACT_APP_APILINK should be set in .env,
// but provide a safe fallback so the app still works if the dev server
// was started before .env was changed.
export const baseApiURL = () => {
  return process.env.REACT_APP_APILINK || "http://localhost:4100/api";
};
