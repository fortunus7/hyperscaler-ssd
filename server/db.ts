import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertServerCandidate, InsertSsdCandidate, InsertUser, serverCandidates, ssdCandidates, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Candidate records are always filtered by their authenticated owner. */
export async function listSsdCandidates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(ssdCandidates).where(eq(ssdCandidates.userId, userId)).orderBy(desc(ssdCandidates.updatedAt));
}

export async function createSsdCandidates(userId: number, candidates: Omit<InsertSsdCandidate, "id" | "userId" | "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (candidates.length === 0) return;
  await db.insert(ssdCandidates).values(candidates.map((candidate) => ({ ...candidate, userId })));
}

export async function deleteSsdCandidate(userId: number, candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(ssdCandidates).where(and(eq(ssdCandidates.id, candidateId), eq(ssdCandidates.userId, userId)));
}

/** Server records are scoped to the authenticated owner exactly like SSD candidates. */
export async function listServerCandidates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(serverCandidates).where(eq(serverCandidates.userId, userId)).orderBy(desc(serverCandidates.updatedAt));
}

export async function createServerCandidates(userId: number, candidates: Omit<InsertServerCandidate, "id" | "userId" | "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (candidates.length === 0) return;
  await db.insert(serverCandidates).values(candidates.map((candidate) => ({ ...candidate, userId })));
}

export async function deleteServerCandidate(userId: number, candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(serverCandidates).where(and(eq(serverCandidates.id, candidateId), eq(serverCandidates.userId, userId)));
}
