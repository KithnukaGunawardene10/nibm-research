
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();

    if (body.is_active !== false) {
      return NextResponse.json(
        { success: false, error: 'Only event deactivation is supported.' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE events
      SET
        is_active = FALSE,
        deactivated_at = NOW()
      WHERE id = ${id}
        AND is_active = TRUE
      RETURNING id, event_name, is_active, deactivated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found or already deactivated.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Event deactivated successfully.'
    });
  } catch (error) {
    console.error('EVENT DEACTIVATION ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to deactivate event.' },
      { status: 500 }
    );
  }
}
