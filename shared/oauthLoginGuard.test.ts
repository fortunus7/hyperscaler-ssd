import { describe, expect, it } from "vitest";
import { acquireOAuthLoginLock, clearOAuthLoginLock, OAUTH_LOGIN_LOCK_KEY, OAUTH_LOGIN_LOCK_TTL_MS } from "./oauthLoginGuard";

function createStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("OAuth login start guard", () => {
  it("allows the first start but blocks a second nonce-minting login within the lock window", () => {
    const storage = createStorage();
    expect(acquireOAuthLoginLock(storage, 1_000)).toBe(true);
    expect(acquireOAuthLoginLock(storage, 1_001)).toBe(false);
  });

  it("permits a retry after expiry or an explicit clear", () => {
    const storage = createStorage({ [OAUTH_LOGIN_LOCK_KEY]: "1000" });
    expect(acquireOAuthLoginLock(storage, 1_000 + OAUTH_LOGIN_LOCK_TTL_MS)).toBe(true);
    clearOAuthLoginLock(storage);
    expect(storage.getItem(OAUTH_LOGIN_LOCK_KEY)).toBeNull();
    expect(acquireOAuthLoginLock(storage, 9_999)).toBe(true);
  });

  it("lets an explicit user click renew a stale in-flight login lock", () => {
    const storage = createStorage({ [OAUTH_LOGIN_LOCK_KEY]: "1000" });
    expect(acquireOAuthLoginLock(storage, 1_001, true)).toBe(true);
    expect(storage.getItem(OAUTH_LOGIN_LOCK_KEY)).toBe("1001");
  });
});
