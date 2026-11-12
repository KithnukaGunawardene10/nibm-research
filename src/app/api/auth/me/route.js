
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });

  } catch (error) {
    console.error('AUTH CHECK ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Unable to verify session.',
      },
      { status: 500 }
    );
  }
}
