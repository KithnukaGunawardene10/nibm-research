import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Retrieve all active supervisors
export async function GET() {
  try {
    const supervisors = await sql`
      SELECT id, supervisor_name
      FROM supervisors
      WHERE is_active = TRUE
      ORDER BY supervisor_name ASC
    `;

    return NextResponse.json({
      success: true,
      data: supervisors
    });

  } catch (error) {
    console.error('SUPERVISORS GET ERROR:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

//

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in first.' },
        { status: 401 }
      );
    }

    if (user.status !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Only staff members can add supervisors.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supervisorName = body.supervisor_name?.trim();

    if (!supervisorName) {
      return NextResponse.json(
        { success: false, error: 'Supervisor name is required.' },
        { status: 400 }
      );
    }

    if (supervisorName.length > 150) {
      return NextResponse.json(
        { success: false, error: 'Supervisor name cannot exceed 150 characters.' },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO supervisors (supervisor_name)
      VALUES (${supervisorName})
      ON CONFLICT (LOWER(supervisor_name)) DO NOTHING
      RETURNING id, supervisor_name
    `;

    if (inserted.length === 0) {
      const existing = await sql`
        SELECT id, supervisor_name
        FROM supervisors
        WHERE LOWER(supervisor_name) = LOWER(${supervisorName})
        LIMIT 1
      `;

      return NextResponse.json({
        success: true,
        alreadyExists: true,
        data: existing[0]
      });
    }

    return NextResponse.json(
      {
        success: true,
        alreadyExists: false,
        message: 'Supervisor added successfully.',
        data: inserted[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('SUPERVISORS POST ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to add supervisor.' },
      { status: 500 }
    );
  }
}
