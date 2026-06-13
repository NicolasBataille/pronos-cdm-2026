import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

const COOKIE = "cdm_session";
const DAY = 60 * 60 * 24;

function getSecret(): Uint8Array {
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Persiste un secret aléatoire dans ./data pour ne pas invalider les sessions au redémarrage
    const file = path.join(process.cwd(), "data", ".session-secret");
    try {
      secret = fs.readFileSync(file, "utf8");
    } catch {
      secret = crypto.randomUUID() + crypto.randomUUID();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, secret, { mode: 0o600 });
    }
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
  isAdmin: boolean;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/**
 * Le cookie n'est marqué `Secure` que sur une vraie connexion HTTPS.
 * Sinon Safari (et le self-hosting en http://ip:3000) rejette le cookie
 * et casse la session. `SECURE_COOKIES=1` force le flag si besoin.
 */
async function shouldUseSecureCookie(): Promise<boolean> {
  if (process.env.SECURE_COOKIES === "1") return true;
  if (process.env.SECURE_COOKIES === "0") return false;
  try {
    const h = await headers();
    return h.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  } catch {
    return false;
  }
}

export async function createSession(userId: number): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookie(),
    path: "/",
    maxAge: 30 * DAY,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const uid = payload.uid as number;
    const user = db.select().from(users).where(eq(users.id, uid)).get();
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}
