
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ResearchSubmissionForm from './ResearchSubmissionForm';

export const dynamic = 'force-dynamic';

export default async function ResearchSubmissionPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/');
  if (user.status !== 'student') redirect('/staff/dashboard');

  return <ResearchSubmissionForm user={user} />;
}
