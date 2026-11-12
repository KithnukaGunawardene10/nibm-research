
'use client';

import { use, useCallback, useEffect, useState } from 'react';

export default function EventAttendancePage({ params }) {
  const { token } = use(params);

  const [eventName, setEventName] = useState('');
  const [scanToken, setScanToken] = useState('');
  const [scannedAt, setScannedAt] = useState('');

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [studentName, setStudentName] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inactive, setInactive] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Open and validate the QR event.
  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/events/${encodeURIComponent(token)}/scan`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 410 || data.inactive) {
          setInactive(true);
        }

        throw new Error(
          data.error || 'Unable to open this event.'
        );
      }

      setEventName(data.data.event_name);
      setScanToken(data.data.scan_token);
      setScannedAt(data.data.scanned_at);

      const batchResponse = await fetch('/api/batches', {
        cache: 'no-store',
      });

      const batchData = await batchResponse.json();

      if (!batchResponse.ok || !batchData.success) {
        throw new Error(
          batchData.error || 'Unable to load student batches.'
        );
      }

      setBatches(batchData.data || []);
    } catch (err) {
      setError(err.message || 'Unable to open attendance form.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Load students whenever the selected batch changes.
  async function handleBatchChange(batch) {
    setSelectedBatch(batch);
    setSelectedIndex('');
    setStudentName('');
    setStudents([]);
    setError('');
    setSuccess('');

    if (!batch) return;

    try {
      setLoadingStudents(true);

      const response = await fetch(
        `/api/students?batch=${encodeURIComponent(batch)}`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to load students.'
        );
      }

      setStudents(data.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load students.');
    } finally {
      setLoadingStudents(false);
    }
  }

  // Automatically retrieve the student's name.
  function handleIndexChange(indexNo) {
    setSelectedIndex(indexNo);
    setError('');
    setSuccess('');

    const student = students.find(
      (item) => String(item.index_no) === String(indexNo)
    );

    setStudentName(student ? student.student_name : '');
  }

  // Submit attendance.
  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');
    setAlreadyRegistered(false);

    if (!selectedBatch || !selectedIndex || !studentName) {
      setError('Please select your batch and index number.');
      return;
    }

    if (!scanToken) {
      setError('Your scan session is invalid. Please scan the QR code again.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/events/${encodeURIComponent(token)}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scan_token: scanToken,
            batch: selectedBatch,
            index_no: selectedIndex,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 410) {
          setInactive(true);
        }

        throw new Error(
          data.error || 'Unable to submit attendance.'
        );
      }

      setAlreadyRegistered(Boolean(data.already_registered));
      setSuccess(data.message || 'Attendance submitted successfully.');

    } catch (err) {
      setError(err.message || 'Unable to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  }

  // Initial loading screen.
  if (loading) {
    return (
      <main className="min-h-screen bg-[#111216] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-5">
            Loading event attendance...
          </p>
        </div>
      </main>
    );
  }

  // Inactive or invalid event.
  if (inactive || (!eventName && error)) {
    return (
      <main className="min-h-screen bg-[#111216] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1C1D22] border border-white/10 rounded-3xl p-8 text-center">

          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-3xl text-red-400">!</span>
          </div>

          <h1 className="text-2xl font-bold mt-6">
            Event Unavailable
          </h1>

          <p className="text-gray-400 text-sm leading-6 mt-3">
            {error || 'This event is no longer accepting attendance submissions.'}
          </p>

          <p className="text-gray-600 text-xs mt-8">
            Research Portal · Student Attendance
          </p>
        </div>
      </main>
    );
  }

  // Successful submission screen.
  if (success) {
    return (
      <main className="min-h-screen bg-[#111216] text-white flex items-center justify-center p-6">

        <div className="w-full max-w-md bg-[#1C1D22] border border-white/10 rounded-3xl p-8 text-center">

          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            alreadyRegistered
              ? 'bg-blue-500/10'
              : 'bg-green-500/10'
          }`}>
            <span className={`text-4xl ${
              alreadyRegistered ? 'text-blue-400' : 'text-green-400'
            }`}>
              ✓
            </span>
          </div>

          <h1 className="text-2xl font-bold mt-6">
            {alreadyRegistered
              ? 'Already Registered'
              : 'Attendance Submitted!'}
          </h1>

          <p className="text-gray-400 text-sm leading-6 mt-3">
            {success}
          </p>

          <div className="mt-7 bg-[#111216] rounded-2xl p-5 text-left space-y-3">

            <div>
              <p className="text-xs text-gray-500">Event</p>
              <p className="text-sm font-semibold mt-1">{eventName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Student Name</p>
              <p className="text-sm font-semibold mt-1">{studentName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Index Number</p>
              <p className="text-sm font-semibold mt-1">{selectedIndex}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Batch</p>
              <p className="text-sm font-semibold mt-1">{selectedBatch}</p>
            </div>

          </div>

          <p className="text-xs text-gray-600 mt-7">
            Research Portal · Student Attendance
          </p>

        </div>
      </main>
    );
  }

  // Attendance form.
  return (
    <main className="min-h-screen bg-[#111216] text-white px-4 py-8 sm:py-12">

      <div className="max-w-xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#925BE0] to-[#713DBF] shadow-lg shadow-purple-900/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-8 h-8"
            >
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
              <path d="M14 14h3v3h-3zM19 14h2v2h-2zM19 19h2v2h-2zM14 19h2" />
            </svg>
          </div>

          <p className="text-purple-400 text-xs uppercase tracking-[0.2em] font-semibold mt-5">
            Student Attendance
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            Event Registration
          </h1>

          <p className="text-gray-500 text-sm mt-3">
            Complete the form below to record your attendance.
          </p>

        </div>

        {/* EVENT DETAILS */}
        <div className="bg-gradient-to-br from-[#925BE0] to-[#713DBF] rounded-2xl p-6 mb-6">

          <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">
            Event Name
          </p>

          <h2 className="text-xl sm:text-2xl font-bold mt-3">
            {eventName}
          </h2>

          <p className="text-white/60 text-xs mt-4">
            Your attendance will be recorded for this event.
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8"
        >

          <div className="mb-6">
            <h3 className="text-lg font-semibold">
              Student Information
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Select your batch and index number.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 mb-5 text-sm">
              {error}
            </div>
          )}

          {/* BATCH */}
          <div className="mb-5">

            <label className="block text-sm text-gray-300 font-medium mb-2">
              Batch <span className="text-red-400">*</span>
            </label>

            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              required
              className="w-full bg-[#111216] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500 transition"
            >

              <option value="">Select your batch</option>

              {batches.map((item, index) => {
                const batch = typeof item === 'string'
                  ? item
                  : item.batch;

                return (
                  <option key={`${batch}-${index}`} value={batch}>
                    {batch}
                  </option>
                );
              })}

            </select>

          </div>

          {/* INDEX NUMBER */}
          <div className="mb-5">

            <label className="block text-sm text-gray-300 font-medium mb-2">
              Index Number <span className="text-red-400">*</span>
            </label>

            <select
              value={selectedIndex}
              onChange={(e) => handleIndexChange(e.target.value)}
              disabled={!selectedBatch || loadingStudents || students.length === 0}
              required
              className="w-full bg-[#111216] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500 transition disabled:opacity-50"
            >

              <option value="">
                {!selectedBatch
                  ? 'Select your batch first'
                  : loadingStudents
                    ? 'Loading students...'
                    : students.length === 0
                      ? 'No students found'
                      : 'Select your index number'}
              </option>

              {students.map((student) => (
                <option
                  key={student.index_no}
                  value={student.index_no}
                >
                  {student.index_no}
                </option>
              ))}

            </select>

          </div>

          {/* AUTOMATIC STUDENT NAME */}
          <div className="mb-7">

            <label className="block text-sm text-gray-300 font-medium mb-2">
              Student Name
            </label>

            <div className="w-full bg-[#111216] border border-white/10 rounded-xl px-4 py-3.5 min-h-[50px] flex items-center">

              {studentName ? (
                <span className="text-white font-medium">
                  {studentName}
                </span>
              ) : (
                <span className="text-gray-600 text-sm">
                  Student name will appear automatically
                </span>
              )}

            </div>

            <p className="text-xs text-gray-600 mt-2">
              Retrieved automatically from the official student records.
            </p>

          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={
              submitting ||
              !selectedBatch ||
              !selectedIndex ||
              !studentName ||
              !scanToken
            }
            className="w-full bg-gradient-to-r from-[#925BE0] to-[#713DBF] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-4 font-semibold text-white transition shadow-lg shadow-purple-900/20"
          >
            {submitting ? 'Submitting Attendance...' : 'Submit Attendance'}
          </button>

          <p className="text-center text-xs text-gray-600 mt-5">
            Please verify your details before submitting.
          </p>

        </form>

        {/* FOOTER */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Research Portal · Student Attendance
        </p>

      </div>
    </main>
  );
}
