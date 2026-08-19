import { acquireOAuthLoginLock, clearOAuthLoginLock } from "@shared/oauthLoginGuard";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it asks the same-origin server to set a one-time
// HttpOnly nonce cookie before navigating to OAuth. Do NOT call it during
// render (no `href={startLogin()}` / `loginUrl={startLogin()}`).
export const startLogin = ({ force = false }: { force?: boolean } = {}) => {
  try {
    if (!acquireOAuthLoginLock(sessionStorage, Date.now(), force)) return;
  } catch {
    // If sessionStorage is unavailable, retain the secure nonce flow rather than blocking login.
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const url = new URL("/api/oauth/start", window.location.origin);
  url.searchParams.set("redirectUri", redirectUri);

  window.location.href = url.toString();
};

export const clearPendingLoginStart = () => {
  try {
    clearOAuthLoginLock(sessionStorage);
  } catch {
    // sessionStorage unavailable
  }
};
