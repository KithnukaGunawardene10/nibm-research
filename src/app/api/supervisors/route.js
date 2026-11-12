import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

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

// POST: Add a new supervisor
export async function POST(request) {
  try {
    const body = await request.json();

    const supervisorName = body.supervisor_name?.trim();

    if (!supervisorName) {
      return NextResponse.json({
        success: false,
        error: 'Supervisor name is required'
      }, { status: 400 });
    }

    if (supervisorName.length > 150) {
      return NextResponse.json({
        success: false,
        error: 'Supervisor name cannot exceed 150 characters'
      }, { status: 400 });
    }

    // Insert supervisor, avoiding duplicates
    const inserted = await sql`
      INSERT INTO supervisors (supervisor_name)
      VALUES (${supervisorName})
      ON CONFLICT (LOWER(supervisor_name)) DO NOTHING
      RETURNING id, supervisor_name
    `;

    // If the supervisor already exists, retrieve the existing record
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

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      message: 'Supervisor added successfully',
      data: inserted[0]
    }, { status: 201 });

  } catch (error) {
    console.error('SUPERVISORS POST ERROR:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}