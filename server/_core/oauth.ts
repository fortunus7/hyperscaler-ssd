import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    const redirectUri = getQueryParam(req, "redirectUri");
    const portalUrl = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;

    if (!redirectUri || !portalUrl || !appId) {
      res.status(400).json({ error: "OAuth start is not configured" });
      return;
    }

    try {
      const target = new URL(redirectUri);
      // The frontend supplies its actual origin. Behind the deployment gateway,
      // req.host is an internal upstream host and cannot safely identify that origin.
      if (target.protocol !== "https:" || target.pathname !== "/api/oauth/callback") {
        res.status(400).json({ error: "invalid OAuth redirect URI" });
        return;
      }

      const nonce = randomUUID();
      // Set by the same-origin server so browser cookie policies cannot drop a
      // script-created nonce during the external OAuth round trip.
      res.cookie(OAUTH_STATE_COOKIE, nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60 * 1000,
      });

      const state = encodeOAuthState({ redirectUri, nonce });
      const authUrl = new URL("/app-auth", portalUrl);
      authUrl.searchParams.set("appId", appId);
      authUrl.searchParams.set("redirectUri", redirectUri);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("type", "signIn");
      res.redirect(302, authUrl.toString());
    } catch {
      res.status(400).json({ error: "invalid OAuth redirect URI" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
