import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db/client";
import * as t from "../db/schema";

const COOKIE = "threadfront_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production" && !process.env.DEMO_MODE) throw new Error("AUTH_SECRET must be set in production.");
  return new TextEncoder().encode(s ?? "dev-only-secret-change-me-dev-only-secret");
}

export type Session = { userId: string; name: string; email: string };

export async function signIn(email: string, password: string): Promise<boolean> {
  const d = await db();
  const [u] = await d.select().from(t.adminUsers).where(eq(t.adminUsers.email, email.trim().toLowerCase()));
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok) return false;
  const jwt = await new SignJWT({ name: u.name, email: u.email }).setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, jwt, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { userId: payload.sub!, name: String(payload.name), email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Use in admin pages and every admin server action. */
export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
