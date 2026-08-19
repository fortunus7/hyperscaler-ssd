/**
 * OAuth login start guard — prevents a manual login click and an asynchronous
 * unauthorized-query redirect from minting competing one-time nonce cookies.
 */
export const OAUTH_LOGIN_LOCK_KEY = "signal-ledger-oauth-login-started-at";
export const OAUTH_LOGIN_LOCK_TTL_MS = 15_000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function acquireOAuthLoginLock(storage: StorageLike, now = Date.now(), force = false) {
  const rawStartedAt = storage.getItem(OAUTH_LOGIN_LOCK_KEY);
  const startedAt = rawStartedAt === null ? Number.NaN : Number(rawStartedAt);
  const isRecent = Number.isFinite(startedAt) && startedAt <= now && now - startedAt < OAUTH_LOGIN_LOCK_TTL_MS;
  if (isRecent && !force) return false;
  storage.setItem(OAUTH_LOGIN_LOCK_KEY, String(now));
  return true;
}

export function clearOAuthLoginLock(storage: StorageLike) {
  storage.removeItem(OAUTH_LOGIN_LOCK_KEY);
}
