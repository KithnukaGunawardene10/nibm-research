
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    const role = String(body.role || '').trim().toLowerCase();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!['student', 'staff'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid account type.' },
        { status: 400 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Login details are required.' },
        { status: 400 }
      );
    }

    let users;

    if (role === 'student') {
      users = await sql`
        SELECT
          id,
          email,
          full_name,
          status,
          batch,
          index_no,
          password_hash,
          is_active
        FROM portal_users
        WHERE index_no = ${identifier}
          AND status = 'student'
        LIMIT 1
      `;
    } else {
      const email = identifier.toLowerCase();

      users = await sql`
        SELECT
          id,
          email,
          full_name,
          status,
          batch,
          index_no,
          password_hash,
          is_active
        FROM portal_users
        WHERE LOWER(email) = ${email}
          AND status = 'staff'
        LIMIT 1
      `;
    }

    if (
      users.length === 0 ||
      !users[0].is_active ||
      !users[0].password_hash
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid login details or account not yet configured.',
        },
        { status: 401 }
      );
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, error: 'Invalid login details.' },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        status: user.status,
        batch: user.batch,
        index_no: user.index_no,
      },
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to log in. Please try again.',
      },
      { status: 500 }
    );
  }
}
