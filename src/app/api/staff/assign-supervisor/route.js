
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in first.' },
        { status: 401 }
      );
    }

    // Only staff can manage assignments
    if (user.status !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Only staff can update supervisors.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const batch =
      typeof body.batch === 'string' ? body.batch.trim() : '';

    const indexNo =
      typeof body.index_no === 'string'
        ? body.index_no.trim()
        : '';

    if (!batch || !indexNo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch and index number are required.',
        },
        { status: 400 }
      );
    }

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
          {
            success: false,
            error: 'Invalid supervisor selection.',
          },
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
          {
            success: false,
            error: 'Selected supervisor does not exist or is inactive.',
          },
          { status: 404 }
        );
      }

      supervisorName = supervisors[0].supervisor_name;
    }

    // Update only the latest research submission for this student.
    const updated = await sql`
      UPDATE submissions
      SET
        supervisor_id = ${supervisorId},
        supervisor_name = ${supervisorName}
      WHERE id = (
        SELECT id
        FROM submissions
        WHERE batch = ${batch}
          AND index_no = ${indexNo}
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      )
      RETURNING
        id,
        batch,
        index_no,
        student_name,
        research_title,
        supervisor_id,
        supervisor_name,
        created_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No research submission was found for this student.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        supervisorId === null
          ? 'Supervisor assignment removed successfully.'
          : 'Supervisor assigned successfully.',
      data: updated[0],
    });

  } catch (error) {
    console.error('ASSIGN SUPERVISOR ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to update supervisor assignment.',
      },
      { status: 500 }
    );
  }
}
