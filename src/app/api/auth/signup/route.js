
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    const batch = String(body.batch || '').trim();
    const indexNo = String(body.index_no || '').trim();
    const password = String(body.password || '');

    if (!batch || !indexNo || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch, index number and password are required.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must contain at least 8 characters.',
        },
        { status: 400 }
      );
    }

    if (password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is too long.',
        },
        { status: 400 }
      );
    }

    // Verify the student against the official student records
    const students = await sql`
      SELECT batch, index_no, student_name
      FROM students
      WHERE batch = ${batch}
        AND index_no = ${indexNo}
      LIMIT 1
    `;

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student record not found. Please check your batch and index number.',
        },
        { status: 404 }
      );
    }

    const student = students[0];

    // Generate the institutional email automatically
    const email = `${student.index_no}@student.nibm.lk`;

    // Check whether this student already has an account
    const existing = await sql`
      SELECT id
      FROM portal_users
      WHERE index_no = ${student.index_no}
         OR email = ${email}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account already exists for this student. Please log in.',
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUsers = await sql`
      INSERT INTO portal_users (
        email,
        full_name,
        status,
        batch,
        index_no,
        password_hash,
        is_verified,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${email},
        ${student.student_name},
        'student',
        ${student.batch},
        ${student.index_no},
        ${passwordHash},
        TRUE,
        TRUE,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        email,
        full_name,
        status,
        batch,
        index_no
    `;

    const user = createdUsers[0];

    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Student account created successfully.',
        user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('STUDENT SIGNUP ERROR:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error: 'An account already exists for this student.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to create your account. Please try again.',
      },
      { status: 500 }
    );
  }
}
