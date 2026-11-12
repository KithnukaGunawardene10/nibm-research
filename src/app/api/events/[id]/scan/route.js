
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id: token } = await params;

    // Validate the event QR token.
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(String(token))) {
      return NextResponse.json(
        { success: false, error: 'Invalid event QR code.' },
        { status: 400 }
      );
    }

    // Create a new scan session only if the event is active.
    const sessions = await sql`
      INSERT INTO event_scan_sessions (event_id)
      SELECT id
      FROM events
      WHERE qr_token = ${token}::uuid
        AND is_active = TRUE
      RETURNING scan_token, scanned_at, event_id
    `;

    if (sessions.length === 0) {
      const existingEvent = await sql`
        SELECT id, is_active
        FROM events
        WHERE qr_token = ${token}::uuid
        LIMIT 1
      `;

      if (existingEvent.length === 0) {
        return NextResponse.json(
          { success: false, error: 'This event QR code is invalid.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'This event is no longer accepting attendance.',
          inactive: true,
        },
        { status: 410 }
      );
    }

    const event = await sql`
      SELECT id, event_name, is_active
      FROM events
      WHERE id = ${sessions[0].event_id}
      LIMIT 1
    `;

    if (event.length === 0 || !event[0].is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'This event is no longer accepting attendance.',
        },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          event_name: event[0].event_name,
          event_id: event[0].id,
          scan_token: sessions[0].scan_token,
          scanned_at: sessions[0].scanned_at,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

  } catch (error) {
    console.error('EVENT QR SCAN ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to open event attendance.' },
      { status: 500 }
    );
  }
}
