
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/app/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user) redirect('/');
  if (user.status !== 'student') redirect('/staff/dashboard');

  return (
    <main className="min-h-screen bg-[#111216] text-white p-5 sm:p-8">
      <div className="max-w-6xl mx-auto">

        <header className="flex items-center justify-between gap-4 bg-[#1C1D22] border border-white/10 rounded-2xl p-5 sm:p-7">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Research Portal
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Student Dashboard
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 bg-gradient-to-br from-[#925BE0] to-[#713DBF] rounded-3xl p-8 sm:p-12">
          <p className="text-white/70 text-xs uppercase tracking-[0.2em] font-semibold">
            Student Dashboard
          </p>

          <h2 className="text-3xl sm:text-5xl font-bold mt-4">
            Welcome, {user.full_name}
          </h2>

          <p className="text-white/75 mt-4 max-w-xl leading-7">
            Access your research submission area and manage your research information through the Research Portal.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest">
              Student Information
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="text-white font-medium mt-1">{user.full_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Index Number</p>
                <p className="text-white font-medium mt-1">{user.index_no}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Batch</p>
                <p className="text-white font-medium mt-1">{user.batch}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Institutional Email</p>
                <p className="text-white font-medium mt-1 break-all">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#9860E8]/15 border border-[#9860E8]/30 flex items-center justify-center text-[#B68AF4] text-2xl">
                +
              </div>

              <h3 className="text-xl font-bold mt-5">
                Research Submission
              </h3>

              <p className="text-gray-400 text-sm leading-6 mt-3">
                Submit your research information and select your research supervisor. Your student details will be loaded automatically.
              </p>
            </div>

            <Link
              href="/student/research-submission"
              className="mt-8 block text-center bg-[#9860E8] hover:bg-[#A878EF] rounded-lg py-3.5 px-5 text-sm font-semibold transition"
            >
              Open Research Submission Form →
            </Link>
          </div>

        </section>

        <p className="text-center text-gray-600 text-xs mt-12">
          Research Management System · Secure Student Portal
        </p>

      </div>
    </main>
  );
}
