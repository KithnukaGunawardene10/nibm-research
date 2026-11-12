
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const configuredSecret = process.env.STAFF_SETUP_SECRET;

    if (!configuredSecret) {
      return NextResponse.json(
        { success: false, error: 'Staff setup is not configured.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    const suppliedSecret = String(body.setupSecret || '');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const expected = Buffer.from(configuredSecret);
    const supplied = Buffer.from(suppliedSecret);

    const secretIsValid =
      expected.length === supplied.length &&
      timingSafeEqual(expected, supplied);

    if (!secretIsValid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, error: 'Password must be between 8 and 72 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const updated = await sql`
      UPDATE portal_users
      SET
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE LOWER(email) = ${email}
        AND status = 'staff'
        AND is_active = TRUE
      RETURNING id, email, full_name, status
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active staff account found for that email.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff password configured successfully.',
      user: updated[0],
    });

  } catch (error) {
    console.error('STAFF SETUP ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to configure staff password.' },
      { status: 500 }
    );
  }
}
