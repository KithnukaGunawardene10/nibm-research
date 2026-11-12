
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in.' },
        { status: 401 }
      );
    }

    if (user.status !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Staff access only.' },
        { status: 403 }
      );
    }

    const events = await sql`
      SELECT
        e.id,
        e.event_name,
        e.qr_token,
        e.is_active,
        e.created_at,
        e.deactivated_at,
        COUNT(a.id)::int AS attendance_count
      FROM events e
      LEFT JOIN event_attendance a ON a.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;

    return NextResponse.json(
      { success: true, data: events },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('EVENTS GET ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to load events.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in.' },
        { status: 401 }
      );
    }

    if (user.status !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Staff access only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const eventName = String(body.event_name || '').trim();

    if (!eventName || eventName.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid event name (maximum 255 characters).' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO events (event_name, created_by)
      VALUES (${eventName}, ${user.id})
      RETURNING
        id,
        event_name,
        qr_token,
        is_active,
        created_at,
        deactivated_at
    `;

    return NextResponse.json(
      { success: true, data: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('EVENT CREATE ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to create event.' },
      { status: 500 }
    );
  }
}
