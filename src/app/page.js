
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('student');

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  const [batch, setBatch] = useState('');
  const [indexNo, setIndexNo] = useState('');
  const [studentName, setStudentName] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    fetch('/api/auth/me')
      .then(async (res) => {
        const result = await res.json();

        if (res.ok && result.authenticated && result.user) {
          const destination =
            result.user.status === 'staff'
              ? '/staff/dashboard'
              : '/student/dashboard';

          router.replace(destination);
          return;
        }

        if (active) setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    fetch('/api/batches')
      .then(async (res) => {
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Unable to load batches.');
        }

        setBatches(result.data || []);
      })
      .catch((error) => {
        console.error(error);
        setMessage(error.message);
      });
  }, []);

  useEffect(() => {
    if (mode !== 'signup' || !batch) {
      setStudents([]);
      setIndexNo('');
      setStudentName('');
      return;
    }

    fetch(`/api/students?batch=${encodeURIComponent(batch)}`)
      .then(async (res) => {
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Unable to load students.');
        }

        return result.data || [];
      })
      .then(setStudents)
      .catch((error) => {
        console.error(error);
        setMessage(error.message);
      });
  }, [batch, mode]);

  useEffect(() => {
    const student = students.find(
      (item) => item.index_no === indexNo
    );

    setStudentName(student?.student_name || '');
  }, [indexNo, students]);

  const resetForm = () => {
    setMessage('');
    setIdentifier('');
    setPassword('');
    setConfirmPassword('');
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setRole('student');
    setBatch('');
    setIndexNo('');
    setStudentName('');
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (mode === 'signup') {
      if (!batch || !indexNo) {
        setMessage('Please select your batch and index number.');
        return;
      }

      if (password !== confirmPassword) {
        setMessage('The passwords do not match.');
        return;
      }

      if (password.length < 8) {
        setMessage('Password must contain at least 8 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === 'signup'
          ? '/api/auth/signup'
          : '/api/auth/login';

      const payload =
        mode === 'signup'
          ? {
              batch,
              index_no: indexNo,
              password
            }
          : {
              role,
              identifier: identifier.trim(),
              password
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Authentication failed.');
      }

      const user = result.user;

      const destination =
        user.status === 'staff'
          ? '/staff/dashboard'
          : '/student/dashboard';

      router.replace(destination);
      router.refresh();

    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#111216] flex items-center justify-center text-white">
        <p className="text-gray-400 text-sm">Loading Research Portal...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111216] p-4 sm:p-7 flex items-center justify-center">
      <div className="w-full max-w-[1250px] min-h-[760px] grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl shadow-2xl">

        {/* LEFT: AUTHENTICATION */}
        <section className="bg-[#1C1D22] text-white flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9B65E8] to-transparent" />

          <div className="w-full max-w-[430px]">

            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-[#9860E8]/20 border border-[#9860E8]/40 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#B68AF4]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 19V5l8 7 8-7v14" />
                </svg>
              </div>

              <div>
                <p className="font-bold text-white text-lg">Research Portal</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                  Research Management System
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[#B68AF4] text-xs tracking-[0.2em] uppercase font-semibold mb-3">
                Welcome
              </p>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                {mode === 'login' ? 'Sign in' : 'Create account'}
                <span className="text-[#A878EF]">.</span>
              </h1>

              <p className="mt-4 text-gray-400 text-sm leading-7">
                {mode === 'login'
                  ? 'Access your Research Portal account using your registered login details.'
                  : 'Register using your official student batch and index number.'}
              </p>
            </div>

            {/* MODE TOGGLE */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#111216] border border-white/5 mb-8">
              <button
                type="button"
                onClick={() => changeMode('login')}
                className={`py-3 rounded-lg text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-[#9860E8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => changeMode('signup')}
                className={`py-3 rounded-lg text-sm font-semibold transition ${
                  mode === 'signup'
                    ? 'bg-[#9860E8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Student Signup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* LOGIN */}
              {mode === 'login' && (
                <>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                      Account Type
                    </label>

                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setIdentifier('');
                        setMessage('');
                      }}
                      className="w-full bg-[#25262C] border border-[#45454F] rounded-lg px-4 py-3.5 text-sm text-white outline-none focus:border-[#A878EF]"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Academic Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                      {role === 'student' ? 'Index Number' : 'Institutional Email'}
                    </label>

                    <input
                      type={role === 'staff' ? 'email' : 'text'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        role === 'student'
                          ? 'Enter your index number'
                          : 'Enter your staff email'
                      }
                      required
                      autoComplete="username"
                      className="w-full bg-transparent border-b border-[#50515A] text-white py-3.5 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600"
                    />
                  </div>
                </>
              )}

              {/* SIGNUP */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                      Student Batch
                    </label>

                    <select
                      value={batch}
                      onChange={(e) => {
                        setBatch(e.target.value);
                        setMessage('');
                      }}
                      required
                      className="w-full bg-[#25262C] border border-[#45454F] rounded-lg px-4 py-3.5 text-sm text-white outline-none focus:border-[#A878EF]"
                    >
                      <option value="">Select your batch</option>
                      {batches.map((item) => (
                        <option key={item.batch} value={item.batch}>
                          {item.batch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                      Index Number
                    </label>

                    <select
                      value={indexNo}
                      onChange={(e) => setIndexNo(e.target.value)}
                      disabled={!batch}
                      required
                      className="w-full bg-[#25262C] border border-[#45454F] rounded-lg px-4 py-3.5 text-sm text-white outline-none focus:border-[#A878EF] disabled:opacity-40"
                    >
                      <option value="">Select your index number</option>
                      {students.map((item) => (
                        <option key={item.index_no} value={item.index_no}>
                          {item.index_no}
                        </option>
                      ))}
                    </select>
                  </div>

                  {studentName && (
                    <div className="rounded-xl bg-[#9860E8]/10 border border-[#9860E8]/25 p-4">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#B68AF4] font-semibold mb-2">
                        Verified Student Name
                      </p>
                      <p className="text-white text-sm font-medium">
                        {studentName}
                      </p>
                    </div>
                  )}

                  {indexNo && (
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                        Institutional Student Email
                      </label>

                      <div className="w-full bg-[#111216] border border-white/10 rounded-lg px-4 py-3.5 text-sm text-gray-300 break-all">
                        {indexNo}@student.nibm.lk
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent border-b border-[#50515A] text-white py-3.5 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] font-semibold text-gray-400 mb-3">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-transparent border-b border-[#50515A] text-white py-3.5 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <p className="text-xs text-gray-500 leading-5">
                  Your account email will be generated automatically using your official index number. No OTP verification is required.
                </p>
              )}

              {message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && !studentName)}
                className="w-full bg-[#9860E8] hover:bg-[#A878EF] text-white py-4 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Login to Research Portal'
                    : 'Create Student Account'}
              </button>

            </form>

            <div className="mt-10 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-500">
                Research Management System · Secure Portal
              </p>
            </div>

          </div>
        </section>

        {/* RIGHT: WELCOME PANEL */}
        <section className="relative bg-[#925BE0] overflow-hidden px-8 py-12 sm:px-12 lg:px-14 flex flex-col justify-between min-h-[550px]">

          <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#B58AF0] opacity-30 blur-sm" />
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

          <div className="relative z-10 py-16">
            <p className="text-white/75 text-sm font-medium tracking-[0.22em] uppercase mb-5">
              Your research journey starts here
            </p>

            <h2 className="text-5xl sm:text-6xl xl:text-[76px] leading-[0.98] tracking-[-0.045em] text-white">
              <span className="font-bold block">Welcome to</span>
              <span className="font-light block mt-2">Research Portal</span>
            </h2>

            <p className="mt-7 text-white/80 text-sm sm:text-base max-w-md leading-7">
              A centralised platform for student research information, supervisor details and research management.
            </p>

            <div className="mt-12 rounded-3xl bg-white/[0.09] border border-white/15 p-6 sm:p-8 backdrop-blur-sm">
              <img
                src="/images/research.png"
                alt="Research and data analysis illustration"
                className="w-full max-h-[300px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold tracking-[0.17em] uppercase">
                Research Portal
              </p>
              <p className="text-white/55 text-[11px] mt-2">
                A researcher's way to success
              </p>
            </div>

            <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
