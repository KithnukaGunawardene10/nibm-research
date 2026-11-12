
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/app/components/LogoutButton';

export default function ResearchSubmissionForm({ user }) {
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [researchTitle, setResearchTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const res = await fetch('/api/supervisors');
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Unable to load supervisors.');
        }

        setSupervisors(result.data || []);
      } catch (error) {
        setMessage(error.message);
        setMessageType('error');
      }
    };

    loadSupervisors();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supervisor_id: selectedSupervisor,
          research_title: researchTitle.trim() || null
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Unable to save submission.');
      }

      setMessage('Research submission saved successfully!');
      setMessageType('success');
      setResearchTitle('');
      setSelectedSupervisor('');

    } catch (error) {
      setMessage(error.message || 'Network error.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111216] p-4 sm:p-7 text-white">

      <header className="w-full max-w-[1200px] mx-auto mb-6 px-5 sm:px-8 py-5 bg-[#1C1D22] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-4 shadow-xl">
        <div>
          <Link href="/student/dashboard" className="text-lg sm:text-xl font-bold">
            Research Portal
          </Link>
          <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mt-1">
            Research Submission
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/dashboard"
            className="hidden sm:inline-block text-sm text-gray-400 hover:text-white"
          >
            Dashboard
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[45%_55%] overflow-hidden rounded-2xl shadow-2xl">

        {/* FORM PANEL */}
        <section className="relative bg-[#1C1D22] px-6 py-12 sm:px-10 lg:px-12">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9B65E8] to-transparent" />

          <div className="max-w-[440px] mx-auto">

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#9860E8]/15 border border-[#9860E8]/30 flex items-center justify-center text-[#B48AF5] text-xl">
                  +
                </div>

                <span className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium">
                  Research Portal
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Research Submission<span className="text-[#A878EF]">.</span>
              </h1>

              <p className="text-gray-400 text-sm leading-7">
                Review your student details and complete your research submission below.
              </p>
            </div>

            {/* AUTHENTICATED STUDENT DETAILS */}
            <div className="mb-9 p-5 rounded-xl bg-[#25242D] border border-[#7953AD]/30">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#B68AF4] mb-4">
                Your Student Information
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Student Name
                  </p>
                  <p className="text-sm font-medium text-white mt-1">
                    {user.full_name}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Index Number
                  </p>
                  <p className="text-sm font-medium text-white mt-1">
                    {user.index_no}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Batch
                  </p>
                  <p className="text-sm font-medium text-white mt-1">
                    {user.batch}
                  </p>
                </div>
              </div>

              <p className="mt-4 pt-4 border-t border-white/10 text-[11px] text-gray-500 leading-5">
                These details are taken from your registered account and cannot be changed through this form.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* OPTIONAL RESEARCH TITLE */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Research Title <span className="text-gray-600">(Optional)</span>
                </label>

                <input
                  type="text"
                  value={researchTitle}
                  onChange={(e) => setResearchTitle(e.target.value)}
                  placeholder="Enter your research title"
                  maxLength={500}
                  className="w-full bg-transparent border-b border-[#50515A] text-white py-3.5 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600"
                />

                <p className="mt-2 text-[11px] text-gray-500">
                  You may leave this field blank and provide the title later.
                </p>
              </div>

              {/* SUPERVISOR */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Supervisor Name
                </label>

                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  required
                  className="w-full bg-[#25262C] border border-[#45454F] rounded-lg px-4 py-3.5 text-sm text-white outline-none focus:border-[#A878EF]"
                >
                  <option value="">Select Supervisor</option>

                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.supervisor_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedSupervisor}
                className="w-full bg-[#9860E8] hover:bg-[#A878EF] text-white py-4 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Submit Research Information →'}
              </button>

            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-lg text-sm text-center border ${
                  messageType === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Research Management
              </p>
              <span className="text-[10px] tracking-[0.18em] text-gray-600 uppercase">
                Secure Portal
              </span>
            </div>

          </div>
        </section>

        {/* WELCOME / IMAGE PANEL */}
        <section className="relative bg-[#925BE0] overflow-hidden min-h-[550px] flex flex-col justify-between px-7 py-10 sm:px-12 sm:py-14 lg:px-14">

          <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#B58AF0] opacity-30 blur-[2px]" />
          <div className="absolute top-[25%] -left-36 w-[450px] h-[450px] rounded-full bg-[#B18BEF] opacity-20" />
          <div className="absolute -bottom-40 right-[-100px] w-[600px] h-[600px] rounded-full bg-[#713DBF] opacity-20" />

          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
              backgroundSize: '55px 55px'
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/30 bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 19V5l8 7 8-7v14" />
              </svg>
            </div>
            <span className="text-white/90 text-xs tracking-[0.2em] uppercase font-semibold">
              Research Information
            </span>
          </div>

          <div className="relative z-10 my-16">
            <p className="text-white/75 text-sm font-medium tracking-[0.22em] uppercase mb-5">
              Your research journey starts here
            </p>

            <h2 className="text-5xl sm:text-6xl xl:text-[72px] leading-[0.98] tracking-[-0.045em] text-white">
              <span className="font-bold block">Research</span>
              <span className="font-light block mt-2">Management</span>
            </h2>

            <p className="mt-6 text-white/80 text-sm sm:text-base max-w-md leading-7">
              A simple and seamless way to submit your research information and connect it with your academic supervisor.
            </p>

            <div className="mt-10 rounded-[32px] bg-white/[0.09] border border-white/10 p-5 sm:p-7">
              <img
                src="/images/research.png"
                alt="Research and data analysis illustration"
                className="w-full max-h-[330px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-6 border-t border-white/20">
            <p className="text-white text-xs font-semibold tracking-[0.17em] uppercase">
              Research Portal
            </p>
            <p className="text-white/55 text-[11px] mt-2">
              A researcher's way to success
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}
