import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "./types";

const COOKIE_NAME = "ucr_session";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// ─── Password hashing ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Session token ────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const rawToken = generateToken();
  const tokenHash = await sha256(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({ data: { id: tokenHash, userId, expiresAt } });

  const jar = await cookies();
  jar.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (raw) {
    const tokenHash = await sha256(raw);
    await db.session.deleteMany({ where: { id: tokenHash } }).catch(() => {});
  }
  jar.delete(COOKIE_NAME);
}

// ─── Session lookup ───────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  affiliation: string | null;
  orcid: string | null;
  roles: Role[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const tokenHash = await sha256(raw);
  const session = await db.session.findUnique({
    where: { id: tokenHash },
    include: { user: { include: { roles: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: tokenHash } }).catch(() => {});
    }
    return null;
  }

  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    title: u.title,
    affiliation: u.affiliation,
    orcid: u.orcid,
    roles: u.roles.map((r) => r.role as Role),
  };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Requires any authenticated session. Redirects to /login if absent. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires the session user to have at least one of the specified roles. */
export async function requireRole(
  user: SessionUser,
  roles: Role[]
): Promise<void> {
  const hasRole = roles.some((r) => user.roles.includes(r));
  if (!hasRole) redirect("/dashboard");
}

export function isEditor(user: SessionUser): boolean {
  return user.roles.includes("EDITOR") || user.roles.includes("ADMIN");
}

export function isAdmin(user: SessionUser): boolean {
  return user.roles.includes("ADMIN");
}
