
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify login
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in first.' },
        { status: 401 }
      );
    }

    // Only students can submit
    if (user.status !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can submit research details.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Supervisor is optional
    let supervisorId = null;
    let supervisorName = 'Not assigned';

    if (
      body.supervisor_id !== undefined &&
      body.supervisor_id !== null &&
      String(body.supervisor_id).trim() !== ''
    ) {
      supervisorId = Number(body.supervisor_id);

      if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid supervisor selection.' },
          { status: 400 }
        );
      }

      const supervisors = await sql`
        SELECT id, supervisor_name
        FROM supervisors
        WHERE id = ${supervisorId}
          AND is_active = TRUE
        LIMIT 1
      `;

      if (supervisors.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Selected supervisor is unavailable.' },
          { status: 404 }
        );
      }

      supervisorName = supervisors[0].supervisor_name;
    }

    // Research title is optional
    const researchTitle =
      typeof body.research_title === 'string' &&
      body.research_title.trim()
        ? body.research_title.trim()
        : null;

    if (researchTitle && researchTitle.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Research title cannot exceed 500 characters.',
        },
        { status: 400 }
      );
    }

    // Get official student information from the database
    const students = await sql`
      SELECT batch, index_no, student_name
      FROM students
      WHERE batch = ${user.batch}
        AND index_no = ${user.index_no}
      LIMIT 1
    `;

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student record not found. Please contact the administrator.',
        },
        { status: 404 }
      );
    }

    const student = students[0];

    // Insert submission
    const result = await sql`
      INSERT INTO submissions (
        batch,
        index_no,
        student_name,
        supervisor_id,
        supervisor_name,
        research_title
      )
      VALUES (
        ${student.batch},
        ${student.index_no},
        ${student.student_name},
        ${supervisorId},
        ${supervisorName},
        ${researchTitle}
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        success: true,
        message: 'Research details submitted successfully.',
        data: result[0],
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Research submission error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to save research details. Please try again.',
      },
      { status: 500 }
    );
  }
}
