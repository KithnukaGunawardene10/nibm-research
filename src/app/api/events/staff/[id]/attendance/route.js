
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    // Only staff members can access attendance reports.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to continue.' },
        { status: 401 }
      );
    }

    if (user.status !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Access denied.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || !/^\d+$/.test(String(id))) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID.' },
        { status: 400 }
      );
    }

    // Check whether the event exists.
    const events = await sql`
      SELECT
        id,
        event_name,
        is_active,
        created_at,
        deactivated_at
      FROM events
      WHERE id = ${id}
      LIMIT 1
    `;

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found.' },
        { status: 404 }
      );
    }

    const event = events[0];

    /*
      Retrieve every scan session.

      A scan session is:
      - not_submitted: QR scanned, form not submitted.
      - submitted: attendance was successfully recorded.
      - already_registered: form submitted, but the student
        already had attendance recorded from an earlier scan.
    */
    const scans = await sql`
      SELECT
        ss.id,
        ss.batch,
        ss.index_no,
        ss.student_name,
        ss.scanned_at,
        ss.submitted_at,

        CASE
          WHEN ss.submitted_at IS NULL
            THEN 'not_submitted'

          WHEN ea.id IS NULL
            THEN 'submitted'

          WHEN ss.submitted_at = ea.submitted_at
            THEN 'submitted'

          ELSE 'already_registered'
        END AS scan_status

      FROM event_scan_sessions AS ss

      LEFT JOIN event_attendance AS ea
        ON ea.event_id = ss.event_id
        AND ea.index_no = ss.index_no

      WHERE ss.event_id = ${id}

      ORDER BY ss.scanned_at DESC
    `;

    // Count unique confirmed attendance records.
    const attendanceCounts = await sql`
      SELECT COUNT(*)::INTEGER AS total
      FROM event_attendance
      WHERE event_id = ${id}
    `;

    const totalScans = scans.length;

    const submittedScans = scans.filter(
      (scan) => scan.scan_status === 'submitted'
    ).length;

    const alreadyRegisteredScans = scans.filter(
      (scan) => scan.scan_status === 'already_registered'
    ).length;

    const incompleteScans = scans.filter(
      (scan) => scan.scan_status === 'not_submitted'
    ).length;

    return NextResponse.json({
      success: true,

      event,

      // All QR scan sessions, including incomplete scans.
      data: scans,

      summary: {
        total_scans: totalScans,
        confirmed_attendance: attendanceCounts[0].total,
        submitted_scans: submittedScans,
        already_registered_scans: alreadyRegisteredScans,
        incomplete_scans: incompleteScans,
      },
    });

  } catch (error) {
    console.error('Attendance report error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load the attendance report.',
      },
      { status: 500 }
    );
  }
}
