import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id: token } = await params;

    const body = await request.json();

    const scanToken = String(body.scan_token || '').trim();
    const batch = String(body.batch || '').trim();
    const indexNo = String(body.index_no || '').trim();

    // Validate required fields
    if (!token || !scanToken || !batch || !indexNo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide all required attendance details.',
        },
        { status: 400 }
      );
    }

    // Validate UUID formats
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(token) || !uuidRegex.test(scanToken)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid attendance link.',
        },
        { status: 400 }
      );
    }

    if (batch.length > 100 || indexNo.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid batch or index number.',
        },
        { status: 400 }
      );
    }

    // Confirm that the selected student exists in the students table.
    const students = await sql`
      SELECT
        batch,
        index_no,
        student_name
      FROM students
      WHERE batch = ${batch}
        AND index_no = ${indexNo}
      LIMIT 1
    `;

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected student could not be found. Please check the batch and index number.',
        },
        { status: 404 }
      );
    }

    const student = students[0];

    /*
      Save the scan-session submission and attendance record
      in one PostgreSQL statement.

      The event and scan-session rows are locked while the
      submission is processed. This prevents a deactivation
      or duplicate submission from creating inconsistent data.
    */
    const result = await sql`
      WITH valid_session AS MATERIALIZED (
        SELECT
          ss.id,
          ss.event_id,
          ss.scanned_at
        FROM event_scan_sessions AS ss
        INNER JOIN events AS e
          ON e.id = ss.event_id
        WHERE ss.scan_token = ${scanToken}::uuid
          AND e.qr_token = ${token}::uuid
          AND e.is_active = TRUE
          AND ss.submitted_at IS NULL
        FOR UPDATE OF ss, e
      ),

      updated_session AS (
        UPDATE event_scan_sessions AS ss
        SET
          batch = ${student.batch},
          index_no = ${student.index_no},
          student_name = ${student.student_name},
          submitted_at = NOW()
        FROM valid_session AS vs
        WHERE ss.id = vs.id
        RETURNING
          ss.id,
          ss.event_id,
          ss.batch,
          ss.index_no,
          ss.student_name,
          ss.scanned_at,
          ss.submitted_at
      ),

      inserted_attendance AS (
        INSERT INTO event_attendance (
          event_id,
          batch,
          index_no,
          student_name,
          scanned_at,
          submitted_at
        )
        SELECT
          us.event_id,
          us.batch,
          us.index_no,
          us.student_name,
          us.scanned_at,
          us.submitted_at
        FROM updated_session AS us
        ON CONFLICT (event_id, index_no) DO NOTHING
        RETURNING
          id,
          event_id,
          index_no
      )

      SELECT
        us.id AS scan_session_id,
        us.event_id,
        us.batch,
        us.index_no,
        us.student_name,
        us.scanned_at,
        us.submitted_at,
        (ia.id IS NOT NULL) AS attendance_created
      FROM updated_session AS us
      LEFT JOIN inserted_attendance AS ia
        ON ia.event_id = us.event_id
        AND ia.index_no = us.index_no
    `;

    // No session was updated. Determine why.
    if (result.length === 0) {
      const events = await sql`
        SELECT id, is_active
        FROM events
        WHERE qr_token = ${token}::uuid
        LIMIT 1
      `;

      if (events.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'This attendance link is invalid.',
          },
          { status: 404 }
        );
      }

      if (!events[0].is_active) {
        return NextResponse.json(
          {
            success: false,
            error: 'This event is no longer accepting attendance submissions.',
          },
          { status: 410 }
        );
      }

      const sessions = await sql`
        SELECT id, submitted_at
        FROM event_scan_sessions
        WHERE scan_token = ${scanToken}::uuid
          AND event_id = ${events[0].id}
        LIMIT 1
      `;

      if (sessions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid scan session. Please scan the event QR code again.',
          },
          { status: 404 }
        );
      }

      if (sessions[0].submitted_at) {
        return NextResponse.json(
          {
            success: false,
            error: 'This scan session has already been submitted.',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process this attendance submission. Please try scanning the QR code again.',
        },
        { status: 409 }
      );
    }

    const saved = result[0];

    return NextResponse.json({
      success: true,
      already_registered: !saved.attendance_created,
      message: saved.attendance_created
        ? 'Attendance submitted successfully.'
        : 'You have already been registered for this event.',
      data: {
        scan_session_id: saved.scan_session_id,
        event_id: saved.event_id,
        batch: saved.batch,
        index_no: saved.index_no,
        student_name: saved.student_name,
        scanned_at: saved.scanned_at,
        submitted_at: saved.submitted_at,
      },
    });
  } catch (error) {
    console.error('Event attendance submission error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to submit attendance. Please try again.',
      },
      { status: 500 }
    );
  }
}