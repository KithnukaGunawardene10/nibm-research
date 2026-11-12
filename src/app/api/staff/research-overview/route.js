
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

    // Get the latest research submission for each student.
    const records = await sql`
      SELECT DISTINCT ON (s.batch, s.index_no)
        s.id,
        s.batch,
        s.index_no,
        s.student_name,
        s.research_title,
        s.supervisor_id,
        s.supervisor_name,
        s.created_at
      FROM submissions s
      ORDER BY
        s.batch,
        s.index_no,
        s.created_at DESC,
        s.id DESC
    `;

    const withSupervisor = [];
    const withoutSupervisor = [];

    for (const record of records) {
      const hasSupervisor =
        record.supervisor_id !== null &&
        record.supervisor_id !== undefined;

      const student = {
        id: record.id,
        batch: record.batch,
        index_no: record.index_no,
        student_name: record.student_name,
        research_title: record.research_title,
        supervisor_id: record.supervisor_id,
        supervisor_name: record.supervisor_name,
        created_at: record.created_at,
      };

      if (hasSupervisor) {
        withSupervisor.push(student);
      } else {
        withoutSupervisor.push(student);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          withSupervisor,
          withoutSupervisor,
          total: records.length,
          totalWithSupervisor: withSupervisor.length,
          totalWithoutSupervisor: withoutSupervisor.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('RESEARCH OVERVIEW ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to retrieve research overview.',
      },
      { status: 500 }
    );
  }
}
