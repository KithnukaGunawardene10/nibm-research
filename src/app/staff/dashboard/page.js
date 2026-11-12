
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/app/components/LogoutButton';
import ResearchManagement from './ResearchManagement';

export const dynamic = 'force-dynamic';

export default async function StaffDashboard() {
  const user = await getCurrentUser();

  if (!user) redirect('/');
  if (user.status !== 'staff') redirect('/student/dashboard');

  return (
    <main className="min-h-screen bg-[#111216] text-white p-5 sm:p-8">
      <div className="max-w-7xl mx-auto">

        <header className="flex items-center justify-between gap-4 bg-[#1C1D22] border border-white/10 rounded-2xl p-5 sm:p-7">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Research Portal
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Academic Staff Dashboard
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 bg-gradient-to-br from-[#925BE0] to-[#713DBF] rounded-3xl p-8 sm:p-12">
          <p className="text-white/70 text-xs uppercase tracking-[0.2em] font-semibold">
            Academic Staff
          </p>

          <h2 className="text-3xl sm:text-5xl font-bold mt-4">
            Welcome, {user.full_name}
          </h2>

          <p className="text-white/75 mt-4 max-w-xl leading-7">
            Manage research submissions, monitor supervisor assignments,
            and update student research records.
          </p>
        </section>

        {/* Research analytics and supervisor management */}
        <ResearchManagement />

        <section className="mt-8 bg-[#1C1D22] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Account Information
          </p>

          <div className="mt-5 grid sm:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-medium mt-1">{user.full_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Institutional Email</p>
              <p className="font-medium mt-1 break-all">{user.email}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Account Type</p>
              <p className="font-medium mt-1">Academic Staff</p>
            </div>
          </div>
        </section>

        <p className="text-center text-gray-600 text-xs mt-12">
          Research Management System · Staff Portal
        </p>

      </div>
    </main>
  );
}
