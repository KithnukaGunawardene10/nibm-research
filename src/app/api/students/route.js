import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const batch = searchParams.get('batch');

  if (!batch) {
    return NextResponse.json(
      { success: false, error: 'Batch is required' },
      { status: 400 }
    );
  }

  try {
    const students = await sql`
      SELECT index_no, student_name
      FROM students
      WHERE batch = ${batch}
      ORDER BY index_no
    `;

    return NextResponse.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Students API error:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}