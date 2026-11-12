
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
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
        (
          SELECT COUNT(*)
          FROM event_attendance a
          WHERE a.event_id = e.id
        ) AS attendance_count
      FROM events e
      ORDER BY e.created_at DESC, e.id DESC
    `;

    return NextResponse.json(
      {
        success: true,
        data: events,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

  } catch (error) {
    console.error('EVENT LIST ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to retrieve events.' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: 'Staff access only.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const eventName = String(body.event_name || '').trim();

    if (!eventName) {
      return NextResponse.json(
        { success: false, error: 'Event name is required.' },
        { status: 400 }
      );
    }

    if (eventName.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Event name cannot exceed 255 characters.' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO events (
        event_name,
        created_by
      )
      VALUES (
        ${eventName},
        ${user.id}
      )
      RETURNING
        id,
        event_name,
        qr_token,
        is_active,
        created_at,
        deactivated_at
    `;

    return NextResponse.json({
      success: true,
      message: 'Event created successfully.',
      data: result[0],
    });

  } catch (error) {
    console.error('EVENT CREATE ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to create event.' },
      { status: 500 }
    );
  }
}
