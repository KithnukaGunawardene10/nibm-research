import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching batches from Neon...');

    const batches = await sql`
      SELECT DISTINCT batch
      FROM students
      ORDER BY batch ASC
    `;

    console.log('Batches retrieved:', batches);

    return NextResponse.json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (error) {
    console.error('BATCH API ERROR:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}