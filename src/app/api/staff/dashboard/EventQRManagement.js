
'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function EventQRManagement() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [busyEventId, setBusyEventId] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events', {
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load events.');
      }

      setEvents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function createEvent(e) {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!eventName.trim()) {
      setError('Please enter an event name.');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_name: eventName.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to create event.');
      }

      const created = data.data;

      const attendanceUrl =
        `${window.location.origin}/event-attendance/${created.qr_token}`;

      const image = await QRCode.toDataURL(attendanceUrl, {
        width: 600,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#111216',
          light: '#FFFFFF'
        }
      });

      setSelectedEvent({
        ...created,
        attendanceUrl
      });

      setQrImage(image);
      setEventName('');
      setMessage('Event and QR code created successfully.');

      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function showQRCode(event) {
    setError('');
    setMessage('');

    try {
      const attendanceUrl =
        `${window.location.origin}/event-attendance/${event.qr_token}`;

      const image = await QRCode.toDataURL(attendanceUrl, {
        width: 600,
        margin: 3,
        errorCorrectionLevel: 'H'
      });

      setSelectedEvent({
        ...event,
        attendanceUrl
      });

      setQrImage(image);
    } catch (err) {
      setError('Unable to generate QR code image.');
    }
  }

  function downloadQR() {
    if (!qrImage || !selectedEvent) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `event-qr-${selectedEvent.id}.png`;
    link.click();
  }

  async function copyEventLink() {
    if (!selectedEvent?.attendanceUrl) return;

    try {
      await navigator.clipboard.writeText(
        selectedEvent.attendanceUrl
      );
      setMessage('Event link copied successfully.');
    } catch {
      setError('Unable to copy the event link.');
    }
  }

  async function deactivateEvent(event) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${event.event_name}"? New attendance submissions will no longer be accepted.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setBusyEventId(event.id);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: false
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to deactivate event.');
      }

      if (String(selectedEvent?.id) === String(event.id)) {
        setSelectedEvent(null);
        setQrImage('');
      }

      setMessage('Event deactivated successfully.');
      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyEventId(null);
    }
  }

  async function viewReport(event) {
    setReportLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch(
        `/api/events/staff/${event.id}/attendance`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load report.');
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  function exportCSV() {
    if (!report) return;

    const rows = [
      [
        'Batch',
        'Index Number',
        'Student Name',
        'Scanned At',
        'Submitted At'
      ],
      ...report.data.map((student) => [
        student.batch,
        student.index_no,
        student.student_name,
        new Date(student.scanned_at).toLocaleString(),
        new Date(student.submitted_at).toLocaleString()
      ])
    ];

    const csv = rows
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? '').replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `attendance-event-${report.event.id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const activeCount = events.filter((event) => event.is_active).length;
  const inactiveCount = events.length - activeCount;

  return (
    <section className="mt-8 space-y-6">

      {/* Section heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold">
            Event Management
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">
            QR Attendance System
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Create event QR codes and monitor student attendance.
          </p>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 rounded-xl p-4 text-sm">
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Total Events</p>
          <p className="text-3xl font-bold mt-2">{events.length}</p>
        </div>

        <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Active Events</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {activeCount}
          </p>
        </div>

        <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Deactivated Events</p>
          <p className="text-3xl font-bold text-gray-400 mt-2">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Create event */}
      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300">
            <span className="text-xl">⌗</span>
          </div>

          <div>
            <h3 className="font-bold text-lg">Create New Event</h3>
            <p className="text-xs text-gray-500">
              Generate a reusable QR attendance code.
            </p>
          </div>
        </div>

        <form onSubmit={createEvent} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            maxLength={255}
            placeholder="Enter event name"
            className="flex-1 bg-[#111216] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={creating}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl px-6 py-3 font-semibold transition"
          >
            {creating ? 'Creating...' : 'Generate QR Code'}
          </button>
        </form>
      </div>

      {/* Selected QR code */}
      {selectedEvent && qrImage && (
        <div className="bg-[#1C1D22] border border-purple-500/30 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-purple-400">
                Generated QR Code
              </p>
              <h3 className="text-xl font-bold mt-2">
                {selectedEvent.event_name}
              </h3>
            </div>

            <span className="text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded-full w-fit">
              Reusable QR Code
            </span>
          </div>

          <div className="mt-7 flex flex-col items-center">
            <div className="bg-white rounded-2xl p-4 w-fit">
              <img
                src={qrImage}
                alt="Event attendance QR code"
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-sm text-gray-400 text-center mt-5">
              Students can scan this QR code using their mobile phones.
            </p>

            <div className="w-full max-w-xl mt-5 bg-[#111216] border border-white/10 rounded-xl p-3 break-all text-xs text-gray-400">
              {selectedEvent.attendanceUrl}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <button
                onClick={downloadQR}
                className="bg-purple-600 hover:bg-purple-500 px-5 py-3 rounded-xl text-sm font-semibold"
              >
                Download QR
              </button>

              <button
                onClick={copyEventLink}
                className="bg-white/10 hover:bg-white/15 px-5 py-3 rounded-xl text-sm font-semibold"
              >
                Copy Event Link
              </button>

              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setQrImage('');
                }}
                className="bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold">Created Events</h3>
            <p className="text-xs text-gray-500 mt-1">
              Manage QR codes and view attendance records.
            </p>
          </div>

          <button
            onClick={loadEvents}
            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm py-6">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No events created yet.</p>
            <p className="text-xs text-gray-600 mt-2">
              Create your first event above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-[#111216] border border-white/10 rounded-xl p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">
                        {event.event_name}
                      </h4>

                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        event.is_active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {event.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(event.created_at).toLocaleString()}
                    </p>

                    <p className="text-xs text-purple-300 mt-1">
                      {event.attendance_count} confirmed attendance(s)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.is_active && (
                      <button
                        onClick={() => showQRCode(event)}
                        className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-2 rounded-lg text-xs"
                      >
                        View QR
                      </button>
                    )}

                    <button
                      onClick={() => viewReport(event)}
                      className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-xs"
                    >
                      View Report
                    </button>

                    {event.is_active && (
                      <button
                        onClick={() => deactivateEvent(event)}
                        disabled={busyEventId === event.id}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-xs disabled:opacity-50"
                      >
                        {busyEventId === event.id ? 'Deactivating...' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance report */}
      {report && (
        <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-purple-400">
                Attendance Report
              </p>
              <h3 className="text-xl font-bold mt-2">
                {report.event.event_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {report.total} confirmed student(s)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                disabled={report.total === 0}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Export CSV
              </button>

              <button
                onClick={() => setReport(null)}
                className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs">
                  <th className="py-3 pr-4">No.</th>
                  <th className="py-3 pr-4">Batch</th>
                  <th className="py-3 pr-4">Index Number</th>
                  <th className="py-3 pr-4">Student Name</th>
                  <th className="py-3 pr-4">Scanned At</th>
                  <th className="py-3 pr-4">Submitted At</th>
                </tr>
              </thead>

              <tbody>
                {report.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No confirmed attendance records yet.
                    </td>
                  </tr>
                ) : (
                  report.data.map((student, index) => (
                    <tr
                      key={`${student.index_no}-${index}`}
                      className="border-b border-white/5"
                    >
                      <td className="py-3 pr-4 text-gray-500">{index + 1}</td>
                      <td className="py-3 pr-4">{student.batch}</td>
                      <td className="py-3 pr-4 font-medium">
                        {student.index_no}
                      </td>
                      <td className="py-3 pr-4">{student.student_name}</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">
                        {new Date(student.scanned_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">
                        {new Date(student.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportLoading && (
        <div className="bg-[#1C1D22] border border-white/10 rounded-xl p-5 text-sm text-gray-400">
          Loading attendance report...
        </div>
      )}
    </section>
  );
}
