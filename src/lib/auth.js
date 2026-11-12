
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';
import { sql } from '@/lib/db';

const COOKIE_NAME = 'portal_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// Create a secure login session
export async function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION * 1000
  );

  await sql`
    DELETE FROM portal_sessions
    WHERE expires_at <= NOW()
  `;

  await sql`
    INSERT INTO portal_sessions (
      user_id,
      token_hash,
      expires_at
    )
    VALUES (
      ${userId},
      ${tokenHash},
      ${expiresAt.toISOString()}
    )
  `;

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  });
}

// Get the currently authenticated user
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const users = await sql`
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.status,
      u.batch,
      u.index_no,
      u.is_active
    FROM portal_sessions s
    INNER JOIN portal_users u
      ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
    LIMIT 1
  `;

  return users.length > 0 ? users[0] : null;
}

// Destroy the current login session
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);

    await sql`
      DELETE FROM portal_sessions
      WHERE token_hash = ${tokenHash}
    `;
  }

  cookieStore.delete(COOKIE_NAME);
}
