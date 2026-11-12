
import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      batch,
      index_no,
      supervisor_id,
      research_title
    } = body;

    // Validate required fields
    if (!batch || !index_no || !supervisor_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch, Index No and Supervisor are required.'
        },
        { status: 400 }
      );
    }

    // Research title is optional
    const cleanedResearchTitle =
      typeof research_title === 'string' && research_title.trim()
        ? research_title.trim()
        : null;

    if (
      cleanedResearchTitle &&
      cleanedResearchTitle.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Research title cannot exceed 500 characters.'
        },
        { status: 400 }
      );
    }

    // Find student
    const student = await sql`
      SELECT
        batch,
        index_no,
        student_name
      FROM students
      WHERE batch = ${batch}
      AND index_no = ${index_no}
      LIMIT 1
    `;

    if (student.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found.'
        },
        { status: 404 }
      );
    }

    // Find supervisor
    const supervisor = await sql`
      SELECT
        id,
        supervisor_name
      FROM supervisors
      WHERE id = ${Number(supervisor_id)}
      LIMIT 1
    `;

    if (supervisor.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Selected supervisor not found.'
        },
        { status: 404 }
      );
    }

    // Save submission
    const savedSubmission = await sql`
      INSERT INTO submissions (
        batch,
        index_no,
        student_name,
        supervisor_id,
        supervisor_name,
        research_title
      )
      VALUES (
        ${student[0].batch},
        ${student[0].index_no},
        ${student[0].student_name},
        ${supervisor[0].id},
        ${supervisor[0].supervisor_name},
        ${cleanedResearchTitle}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: 'Submission saved successfully!',
      data: savedSubmission[0]
    });

  } catch (error) {
    console.error('SUBMISSION FAILURE:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unable to save submission.'
      },
      { status: 500 }
    );
  }
}
