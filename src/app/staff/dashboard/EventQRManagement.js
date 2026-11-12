
'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function EventQRManagement() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const [reportEvent, setReportEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [reportSummary, setReportSummary] = useState({
    total_scans: 0,
    confirmed_attendance: 0,
    submitted_scans: 0,
    already_registered_scans: 0,
    incomplete_scans: 0,
  });

  const [reportLoading, setReportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/events/staff', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load events.');
      }

      setEvents(data.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load events.');
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

    const cleanName = eventName.trim();

    if (!cleanName) {
      setError('Please enter an event name.');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/events/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: cleanName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to create event.');
      }

      const newEvent = data.data;

      setEventName('');
      setMessage('Event created successfully.');

      await loadEvents();
      await showQRCode(newEvent);
    } catch (err) {
      setError(err.message || 'Unable to create event.');
    } finally {
      setCreating(false);
    }
  }

  async function showQRCode(event) {
    try {
      const url = `${window.location.origin}/event-attendance/${event.qr_token}`;

      const image = await QRCode.toDataURL(url, {
        width: 700,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#111216',
          light: '#FFFFFF',
        },
      });

      setSelectedEvent(event);
      setQrImage(image);
      setQrUrl(url);
    } catch (err) {
      setError('Unable to generate QR code.');
    }
  }

  function downloadQRCode() {
    if (!qrImage || !selectedEvent) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${selectedEvent.event_name.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    link.click();
  }

  async function copyEventLink() {
    if (!qrUrl) return;

    try {
      await navigator.clipboard.writeText(qrUrl);
      setMessage('Event attendance link copied.');
    } catch {
      setError('Unable to copy the link. Please copy it manually.');
    }
  }

  async function deactivateEvent(event) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${event.event_name}"?\n\nNew scans and attendance submissions will no longer be accepted. Existing attendance records will remain available.`
    );

    if (!confirmed) return;

    try {
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/events/staff/${event.id}`,
        {
          method: 'PATCH',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to deactivate event.');
      }

      setMessage('Event deactivated successfully.');

      if (selectedEvent?.id === event.id) {
        setSelectedEvent({
          ...event,
          ...(data.data || {}),
          is_active: false,
        });
      }

      await loadEvents();
    } catch (err) {
      setError(err.message || 'Unable to deactivate event.');
    }
  }

  async function openAttendanceReport(event) {
    setReportEvent(event);
    setAttendance([]);
    setSearchTerm('');

    setReportSummary({
      total_scans: 0,
      confirmed_attendance: 0,
      submitted_scans: 0,
      already_registered_scans: 0,
      incomplete_scans: 0,
    });

    setReportLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/events/staff/${event.id}/attendance`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load attendance report.');
      }

      setAttendance(data.data || []);

      setReportSummary({
        total_scans: Number(data.summary?.total_scans || 0),
        confirmed_attendance: Number(data.summary?.confirmed_attendance || 0),
        submitted_scans: Number(data.summary?.submitted_scans || 0),
        already_registered_scans: Number(data.summary?.already_registered_scans || 0),
        incomplete_scans: Number(data.summary?.incomplete_scans || 0),
      });
    } catch (err) {
      setError(err.message || 'Unable to load attendance report.');
    } finally {
      setReportLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'submitted':
        return 'Submitted';

      case 'already_registered':
        return 'Already Registered';

      case 'not_submitted':
        return 'Not Submitted';

      default:
        return 'Unknown';
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'submitted':
        return 'bg-green-500/10 text-green-400 border-green-500/20';

      case 'already_registered':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';

      case 'not_submitted':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';

      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }

  const filteredAttendance = attendance.filter((record) => {
    const search = searchTerm.toLowerCase();

    return (
      String(record.index_no || '').toLowerCase().includes(search) ||
      String(record.student_name || '').toLowerCase().includes(search) ||
      String(record.batch || '').toLowerCase().includes(search) ||
      getStatusLabel(record.scan_status).toLowerCase().includes(search)
    );
  });

  function exportCSV() {
    if (!reportEvent || attendance.length === 0) return;

    const headers = [
      'Batch',
      'Index Number',
      'Student Name',
      'Scanned Date and Time',
      'Submitted Date and Time',
      'Scan Status',
    ];

    const rows = filteredAttendance.map((record) => [
      record.batch || '',
      record.index_no || '',
      record.student_name || '',
      formatDate(record.scanned_at),
      formatDate(record.submitted_at),
      getStatusLabel(record.scan_status),
    ]);

    const escapeCSV = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${reportEvent.event_name.replace(/[^a-z0-9]/gi, '_')}_attendance_report.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  const activeEvents = events.filter((event) => event.is_active);
  const inactiveEvents = events.filter((event) => !event.is_active);

  return (
    <section className="mt-8 space-y-6">

      {/* SECTION HEADER */}
      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold">
              Event Management
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold mt-2">
              QR Attendance System
            </h2>

            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-6">
              Create event-specific QR codes, collect student attendance,
              and monitor participation through downloadable reports.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-5 py-4">
            <p className="text-xs text-gray-400">Active Events</p>
            <p className="text-3xl font-bold text-purple-300 mt-1">
              {activeEvents.length}
            </p>
          </div>

        </div>
      </div>

      {/* ALERTS */}
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

      {/* CREATE EVENT */}
      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">

        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            Create New Event
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Generate a reusable QR code for student attendance.
          </p>
        </div>

        <form onSubmit={createEvent} className="flex flex-col sm:flex-row gap-3">

          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Enter event name"
            maxLength={255}
            required
            className="flex-1 bg-[#111216] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
          />

          <button
            type="submit"
            disabled={creating}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl px-7 py-3 transition"
          >
            {creating ? 'Creating...' : '+ Generate QR Code'}
          </button>

        </form>

        <p className="text-xs text-gray-500 mt-3">
          Each event receives its own unique QR code. The code remains
          reusable until staff deactivates the event.
        </p>

      </div>

      {/* EVENT LIST */}
      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              Created Events
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage event QR codes and attendance reports.
            </p>
          </div>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="text-sm text-purple-300 hover:text-purple-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <p className="text-gray-400 font-medium">
              No events created yet.
            </p>

            <p className="text-gray-600 text-sm mt-2">
              Create your first event using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {events.map((event) => (
              <div
                key={event.id}
                className="bg-[#111216] border border-white/10 rounded-xl p-5"
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">

                      <h4 className="font-semibold text-white break-words">
                        {event.event_name}
                      </h4>

                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${
                          event.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {event.is_active ? 'Active' : 'Deactivated'}
                      </span>

                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Created: {formatDate(event.created_at)}
                    </p>

                    {event.deactivated_at && (
                      <p className="text-xs text-red-400/70 mt-1">
                        Deactivated: {formatDate(event.deactivated_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {event.is_active && (
                      <button
                        onClick={() => showQRCode(event)}
                        className="bg-purple-600/15 border border-purple-500/30 text-purple-300 hover:bg-purple-600/25 px-4 py-2 rounded-lg text-xs font-semibold"
                      >
                        View QR
                      </button>
                    )}

                    <button
                      onClick={() => openAttendanceReport(event)}
                      className="bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-semibold"
                    >
                      Attendance Report
                    </button>

                    {event.is_active && (
                      <button
                        onClick={() => deactivateEvent(event)}
                        className="bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 px-4 py-2 rounded-lg text-xs font-semibold"
                      >
                        Deactivate
                      </button>
                    )}

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* QR CODE MODAL */}
      {selectedEvent && qrImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-[#1C1D22] border border-white/10 rounded-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold">
                  Event QR Code
                </p>

                <h3 className="text-xl font-bold mt-2">
                  {selectedEvent.event_name}
                </h3>

                <p className="text-xs text-gray-500 mt-2">
                  {selectedEvent.is_active
                    ? 'This QR code is active.'
                    : 'This event is deactivated.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setQrImage('');
                  setQrUrl('');
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
                aria-label="Close QR code"
              >
                ×
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 mt-6 flex justify-center">
              <img
                src={qrImage}
                alt="Event attendance QR code"
                className="w-full max-w-[320px] h-auto"
              />
            </div>

            <div className="mt-5 bg-[#111216] border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-2">
                Attendance URL
              </p>

              <p className="text-xs text-purple-300 break-all">
                {qrUrl}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

              <button
                onClick={downloadQRCode}
                disabled={!selectedEvent.is_active}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-3 text-sm font-semibold"
              >
                Download QR PNG
              </button>

              <button
                onClick={copyEventLink}
                disabled={!selectedEvent.is_active}
                className="bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 rounded-xl py-3 text-sm font-semibold"
              >
                Copy Attendance Link
              </button>

            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Share this QR code with students. Multiple students can scan
              and submit attendance using the same code.
            </p>

          </div>
        </div>
      )}

      {/* ATTENDANCE REPORT MODAL */}
      {reportEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">

          <div className="bg-[#1C1D22] border border-white/10 rounded-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* REPORT HEADER */}
            <div className="p-5 sm:p-7 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>
                <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                  Event Attendance Report
                </p>

                <h3 className="text-xl font-bold mt-2">
                  {reportEvent.event_name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  All QR scans and attendance submissions
                </p>
              </div>

              <button
                onClick={() => {
                  setReportEvent(null);
                  setAttendance([]);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-white text-2xl self-end sm:self-auto"
                aria-label="Close attendance report"
              >
                ×
              </button>

            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 sm:px-7 pb-2">

              <div className="bg-[#111216] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Total QR Scans
                </p>
                <p className="text-2xl font-bold text-purple-300 mt-2">
                  {reportSummary.total_scans}
                </p>
              </div>

              <div className="bg-[#111216] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Confirmed Attendance
                </p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  {reportSummary.confirmed_attendance}
                </p>
              </div>

              <div className="bg-[#111216] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Incomplete Scans
                </p>
                <p className="text-2xl font-bold text-yellow-300 mt-2">
                  {reportSummary.incomplete_scans}
                </p>
              </div>

              <div className="bg-[#111216] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Already Registered
                </p>
                <p className="text-2xl font-bold text-blue-300 mt-2">
                  {reportSummary.already_registered_scans}
                </p>
              </div>

            </div>

            {/* SEARCH AND EXPORT */}
            <div className="p-5 sm:px-7 flex flex-col sm:flex-row gap-3">

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search index number, student name, batch or status..."
                className="flex-1 bg-[#111216] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500"
              />

              <button
                onClick={exportCSV}
                disabled={attendance.length === 0 || reportLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                Export CSV
              </button>

            </div>

            {/* STATUS LEGEND */}
            <div className="px-5 sm:px-7 pb-4 flex flex-wrap gap-4 text-xs">

              <span className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Submitted
              </span>

              <span className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-yellow-300" />
                Not Submitted
              </span>

              <span className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-300" />
                Already Registered
              </span>

            </div>

            {/* REPORT TABLE */}
            <div className="overflow-auto px-5 sm:px-7 pb-6 flex-1">

              {reportLoading ? (
                <p className="text-gray-400 text-center py-12">
                  Loading attendance records...
                </p>
              ) : filteredAttendance.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No scan records found.
                </p>
              ) : (
                <table className="w-full text-left min-w-[1050px]">

                  <thead className="sticky top-0 bg-[#25262C]">
                    <tr className="text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4">Batch</th>
                      <th className="p-4">Index Number</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Scanned At</th>
                      <th className="p-4">Submitted At</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAttendance.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-white/5 text-sm hover:bg-white/[0.02]"
                      >

                        <td className="p-4 text-gray-400">
                          {record.batch || '-'}
                        </td>

                        <td className="p-4 font-medium text-purple-300">
                          {record.index_no || '-'}
                        </td>

                        <td className="p-4 text-white">
                          {record.student_name || (
                            <span className="text-gray-500 italic">
                              Unidentified scan
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-gray-400 whitespace-nowrap">
                          {formatDate(record.scanned_at)}
                        </td>

                        <td className="p-4 text-gray-400 whitespace-nowrap">
                          {formatDate(record.submitted_at)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-full border whitespace-nowrap ${getStatusStyle(record.scan_status)}`}
                          >
                            {getStatusLabel(record.scan_status)}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              )}

            </div>

            {/* REPORT FOOTER */}
            <div className="border-t border-white/10 px-5 sm:px-7 py-4 flex flex-wrap justify-between gap-3 text-xs text-gray-500">

              <span>
                Showing {filteredAttendance.length} of {attendance.length} scan records
              </span>

              <span>
                {reportEvent.is_active
                  ? 'Event is active'
                  : 'Event is deactivated'}
              </span>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
