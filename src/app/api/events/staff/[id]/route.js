
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
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

    const { id } = await params;

    if (!/^\d+$/.test(String(id))) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID.' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE events
      SET
        is_active = FALSE,
        deactivated_at = COALESCE(deactivated_at, NOW())
      WHERE id = ${id}
      RETURNING
        id,
        event_name,
        qr_token,
        is_active,
        created_at,
        deactivated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deactivated successfully.',
      data: result[0],
    });

  } catch (error) {
    console.error('EVENT DEACTIVATION ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to deactivate event.' },
      { status: 500 }
    );
  }
}
