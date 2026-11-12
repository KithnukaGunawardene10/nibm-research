
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

function getPiePath(startAngle, endAngle, radius = 90) {
  const start = {
    x: 100 + radius * Math.cos(startAngle),
    y: 100 + radius * Math.sin(startAngle),
  };

  const end = {
    x: 100 + radius * Math.cos(endAngle),
    y: 100 + radius * Math.sin(endAngle),
  };

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    'M 100 100',
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export default function ResearchManagement() {
  const [overview, setOverview] = useState({
    withSupervisor: [],
    withoutSupervisor: [],
  });

  const [supervisors, setSupervisors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState('');

  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [detailCategory, setDetailCategory] = useState(null);

  const [selectedStudentKey, setSelectedStudentKey] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // --------------------------------------------------
  // LOAD RESEARCH OVERVIEW
  // --------------------------------------------------

  const loadOverview = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        '/api/staff/research-overview',
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to load research overview.'
        );
      }

      setOverview({
        withSupervisor: data.data.withSupervisor || [],
        withoutSupervisor: data.data.withoutSupervisor || [],
      });

      setRefreshError('');
    } catch (error) {
      console.error('Research overview error:', error);

      setRefreshError(
        error.message || 'Unable to refresh research data.'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // --------------------------------------------------
  // LOAD SUPERVISORS
  // --------------------------------------------------

  const loadSupervisors = useCallback(async () => {
    try {
      const response = await fetch('/api/supervisors', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to load supervisors.'
        );
      }

      setSupervisors(data.data || []);
    } catch (error) {
      console.error('Supervisor loading error:', error);
    }
  }, []);

  // Initial loading
  useEffect(() => {
    loadOverview(true);
    loadSupervisors();
  }, [loadOverview, loadSupervisors]);

  // --------------------------------------------------
  // AUTOMATIC ONE-SECOND CHART REFRESH
  // --------------------------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      loadOverview(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [loadOverview]);

  // --------------------------------------------------
  // CALCULATE CHART DATA
  // --------------------------------------------------

  const totalWith = overview.withSupervisor.length;
  const totalWithout = overview.withoutSupervisor.length;

  const totalStudents = totalWith + totalWithout;

  const percentageWith = totalStudents
    ? Math.round((totalWith / totalStudents) * 100)
    : 0;

  const percentageWithout = totalStudents
    ? 100 - percentageWith
    : 0;

  const categories = [
    {
      key: 'with',
      title: 'With Supervisor',
      color: '#9860E8',
      count: totalWith,
      percentage: percentageWith,
      students: overview.withSupervisor,
    },
    {
      key: 'without',
      title: 'Without Supervisor',
      color: '#F59E0B',
      count: totalWithout,
      percentage: percentageWithout,
      students: overview.withoutSupervisor,
    },
  ];

  let currentAngle = -Math.PI / 2;

  const chartSegments = categories.map((category) => {
    const angle = totalStudents
      ? (category.count / totalStudents) * Math.PI * 2
      : 0;

    const segment = {
      ...category,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };

    currentAngle += angle;

    return segment;
  });

  const hoveredStudents = categories.find(
    (category) => category.key === hoveredCategory
  )?.students || [];

  // --------------------------------------------------
  // SELECTED STUDENT
  // --------------------------------------------------

  const selectedStudent = useMemo(() => {
    const allStudents = [
      ...overview.withSupervisor,
      ...overview.withoutSupervisor,
    ];

    return allStudents.find(
      (student) =>
        `${student.batch}::${student.index_no}` === selectedStudentKey
    ) || null;
  }, [overview, selectedStudentKey]);

  // Important:
  // Only reset the supervisor when the selected student changes.
  // Do not reset it on every one-second overview refresh.
  useEffect(() => {
    if (selectedStudent) {
      setSelectedSupervisor(
        selectedStudent.supervisor_id
          ? String(selectedStudent.supervisor_id)
          : ''
      );
    } else {
      setSelectedSupervisor('');
    }
  }, [selectedStudentKey]);

  // --------------------------------------------------
  // ADD NEW SUPERVISOR
  // --------------------------------------------------

  async function handleAddSupervisor() {
    setMessage('');
    setMessageType('');

    const name = newSupervisorName.trim();

    if (!name) {
      setMessage('Please enter a supervisor name.');
      setMessageType('error');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supervisor_name: name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to add supervisor.'
        );
      }

      await loadSupervisors();

      // Automatically select the newly added supervisor.
      setSelectedSupervisor(String(data.data.id));

      setNewSupervisorName('');
      setShowAddSupervisor(false);

      setMessage(
        data.alreadyExists
          ? 'This supervisor already exists and has been selected.'
          : 'New supervisor added successfully. Save the assignment to apply it to the student.'
      );

      setMessageType('success');

    } catch (error) {
      setMessage(
        error.message || 'Unable to add supervisor.'
      );

      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // SAVE SUPERVISOR ASSIGNMENT
  // --------------------------------------------------

  async function handleSaveAssignment() {
    if (!selectedStudent) {
      setMessage('Please select a student.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch(
        '/api/staff/assign-supervisor',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: selectedStudent.batch,
            index_no: selectedStudent.index_no,
            supervisor_id: selectedSupervisor || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to update supervisor.'
        );
      }

      setMessage(
        data.message || 'Supervisor assignment updated successfully.'
      );

      setMessageType('success');

      // Refresh chart and supervisor list.
      await loadOverview(false);
      await loadSupervisors();

    } catch (error) {
      setMessage(
        error.message || 'Unable to update supervisor.'
      );

      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // MODAL DETAILS
  // --------------------------------------------------

  const detailStudents =
    detailCategory === 'with'
      ? overview.withSupervisor
      : overview.withoutSupervisor;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <section className="mt-8 space-y-8">

      {/* ==============================================
          RESEARCH ANALYTICS / PIE CHART
      ============================================== */}

      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Research Analytics
            </p>

            <h2 className="text-2xl font-bold mt-2">
              Supervisor Assignment Overview
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Latest research submission for each student.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              Total Students
            </p>

            <p className="text-3xl font-bold">
              {totalStudents}
            </p>

            <p className="text-[11px] text-green-400 mt-1">
              Auto-refresh: Every second
            </p>
          </div>

        </div>

        {refreshError && (
          <p className="text-sm text-red-400 mt-4">
            {refreshError}
          </p>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-400">
            Loading research analytics...
          </div>
        ) : (

          <div className="mt-8 grid lg:grid-cols-2 gap-8 items-center">

            {/* PIE CHART */}

            <div className="flex flex-col items-center">

              <div className="relative w-64 h-64">

                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full overflow-visible"
                  role="img"
                  aria-label="Student supervisor assignment pie chart"
                >

                  {totalStudents === 0 ? (

                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="#34343C"
                    />

                  ) : (

                    chartSegments.map((segment) => (

                      segment.count > 0 && (

                        <path
                          key={segment.key}
                          d={getPiePath(
                            segment.startAngle,
                            segment.endAngle
                          )}
                          fill={segment.color}
                          stroke="#1C1D22"
                          strokeWidth="2"
                          className="cursor-pointer transition-opacity duration-200"
                          style={{
                            opacity:
                              hoveredCategory &&
                              hoveredCategory !== segment.key
                                ? 0.4
                                : 1,
                          }}
                          onMouseEnter={() =>
                            setHoveredCategory(segment.key)
                          }
                          onMouseLeave={() =>
                            setHoveredCategory(null)
                          }
                          onClick={() =>
                            setDetailCategory(segment.key)
                          }
                        />

                      )

                    ))

                  )}

                </svg>

                {/* CENTER VALUE */}

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

                  <span className="text-4xl font-bold">
                    {totalStudents}
                  </span>

                  <span className="text-xs text-gray-400 mt-1">
                    Students
                  </span>

                </div>

              </div>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Hover over a chart segment to preview student index numbers.
                Click a segment to open its detailed list.
              </p>

              {/* PIE CHART HOVER DETAILS */}

              {hoveredCategory && (

                <div className="w-full mt-5 bg-[#15161B] border border-white/10 rounded-xl p-4">

                  <div className="flex justify-between items-center gap-3">

                    <p className="text-sm font-semibold">
                      {hoveredCategory === 'with'
                        ? 'Students With Supervisors'
                        : 'Students Without Supervisors'}
                    </p>

                    <span className="text-xs text-gray-400">
                      {hoveredStudents.length} students
                    </span>

                  </div>

                  {hoveredStudents.length > 0 ? (

                    <div className="flex flex-wrap gap-2 mt-3 max-h-28 overflow-y-auto">

                      {hoveredStudents.map((student) => (

                        <span
                          key={`${student.batch}-${student.index_no}`}
                          className="text-xs bg-[#292832] rounded-md px-2 py-1 text-gray-300"
                        >
                          {student.index_no}
                        </span>

                      ))}

                    </div>

                  ) : (

                    <p className="text-xs text-gray-500 mt-3">
                      No students in this category.
                    </p>

                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setDetailCategory(hoveredCategory)
                    }
                    className="text-xs text-[#B68AFF] hover:text-white font-semibold mt-4"
                  >
                    More →
                  </button>

                </div>

              )}

            </div>

            {/* CATEGORY SUMMARY */}

            <div className="space-y-4">

              {categories.map((category) => (

                <div
                  key={category.key}
                  className="bg-[#15161B] border border-white/5 rounded-xl p-5"
                  onMouseEnter={() =>
                    setHoveredCategory(category.key)
                  }
                  onMouseLeave={() =>
                    setHoveredCategory(null)
                  }
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: category.color,
                        }}
                      />

                      <span className="font-semibold text-sm">
                        {category.title}
                      </span>

                    </div>

                    <span className="text-xl font-bold">
                      {category.count}
                    </span>

                  </div>

                  {/* PROGRESS BAR */}

                  <div className="mt-3 h-2 bg-[#303039] rounded-full overflow-hidden">

                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${category.percentage}%`,
                        background: category.color,
                      }}
                    />

                  </div>

                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">

                    <span>
                      {category.percentage}% of students
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setDetailCategory(category.key)
                      }
                      className="text-[#B68AFF] hover:text-white font-semibold"
                    >
                      More →
                    </button>

                  </div>

                  {/* CATEGORY HOVER PREVIEW */}

                  {hoveredCategory === category.key && (

                    <div className="mt-4 pt-3 border-t border-white/10">

                      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                        Student Index Numbers
                      </p>

                      {category.students.length > 0 ? (

                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">

                          {category.students.map((student) => (

                            <span
                              key={`${student.batch}-${student.index_no}`}
                              className="text-xs bg-[#292832] rounded-md px-2 py-1 text-gray-300"
                            >
                              {student.index_no}
                            </span>

                          ))}

                        </div>

                      ) : (

                        <p className="text-xs text-gray-500">
                          No students in this category.
                        </p>

                      )}

                    </div>

                  )}

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

      {/* ==============================================
          STUDENT SUPERVISOR MANAGEMENT
      ============================================== */}

      <div className="bg-[#1C1D22] border border-white/10 rounded-2xl p-6 sm:p-8">

        <div>

          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Staff Management
          </p>

          <h2 className="text-2xl font-bold mt-2">
            Update Student Supervisor
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Select a student to view their research details and manage their supervisor.
          </p>

        </div>

        <div className="mt-7 space-y-5">

          {/* STUDENT SELECTION */}

          <div>

            <label className="block text-sm text-gray-300 font-semibold mb-2">
              Select Student by Index Number
            </label>

            <select
              value={selectedStudentKey}
              onChange={(event) => {
                setSelectedStudentKey(event.target.value);
                setMessage('');
                setMessageType('');
              }}
              className="w-full bg-[#14151A] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#9860E8]"
            >

              <option value="">
                Choose a student
              </option>

              {[
                ...overview.withSupervisor,
                ...overview.withoutSupervisor,
              ]
                .sort((a, b) =>
                  String(a.index_no).localeCompare(
                    String(b.index_no)
                  )
                )
                .map((student) => (

                  <option
                    key={`${student.batch}::${student.index_no}`}
                    value={`${student.batch}::${student.index_no}`}
                  >
                    {student.index_no} — {student.student_name}
                  </option>

                ))}

            </select>

          </div>

          {/* AUTOMATIC STUDENT INFORMATION */}

          {selectedStudent && (

            <div className="grid sm:grid-cols-2 gap-4">

              <div className="bg-[#15161B] border border-white/5 rounded-xl p-4">

                <p className="text-xs text-gray-500">
                  Student Name
                </p>

                <p className="font-semibold mt-2">
                  {selectedStudent.student_name}
                </p>

              </div>

              <div className="bg-[#15161B] border border-white/5 rounded-xl p-4">

                <p className="text-xs text-gray-500">
                  Index Number
                </p>

                <p className="font-semibold mt-2">
                  {selectedStudent.index_no}
                </p>

              </div>

              <div className="bg-[#15161B] border border-white/5 rounded-xl p-4 sm:col-span-2">

                <p className="text-xs text-gray-500">
                  Research Title
                </p>

                <p className="font-semibold mt-2">
                  {selectedStudent.research_title || 'Not provided'}
                </p>

              </div>

              <div className="bg-[#15161B] border border-white/5 rounded-xl p-4 sm:col-span-2">

                <p className="text-xs text-gray-500">
                  Current Supervisor
                </p>

                <p className="font-semibold mt-2">
                  {selectedStudent.supervisor_name || 'Not assigned'}
                </p>

              </div>

            </div>

          )}

          {/* SUPERVISOR SELECTION */}

          {selectedStudent && (

            <>

              <div>

                <label className="block text-sm text-gray-300 font-semibold mb-2">
                  Select Supervisor
                </label>

                <select
                  value={selectedSupervisor}
                  onChange={(event) =>
                    setSelectedSupervisor(event.target.value)
                  }
                  className="w-full bg-[#14151A] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#9860E8]"
                >

                  <option value="">
                    No supervisor assigned
                  </option>

                  {supervisors.map((supervisor) => (

                    <option
                      key={supervisor.id}
                      value={supervisor.id}
                    >
                      {supervisor.supervisor_name}
                    </option>

                  ))}

                </select>

                <p className="text-xs text-gray-500 mt-2">
                  Selecting No supervisor assigned will remove the current assignment when saved.
                </p>

              </div>

              {/* ADD NEW SUPERVISOR */}

              <div className="bg-[#15161B] border border-white/5 rounded-xl p-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddSupervisor(!showAddSupervisor)
                  }
                  className="text-[#B68AFF] text-sm font-semibold hover:text-white"
                >
                  {showAddSupervisor
                    ? '− Cancel adding supervisor'
                    : '+ Add a new supervisor'}
                </button>

                {showAddSupervisor && (

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">

                    <input
                      type="text"
                      value={newSupervisorName}
                      onChange={(event) =>
                        setNewSupervisorName(event.target.value)
                      }
                      placeholder="Enter new supervisor name"
                      maxLength={150}
                      className="flex-1 bg-[#24252C] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#9860E8]"
                    />

                    <button
                      type="button"
                      onClick={handleAddSupervisor}
                      disabled={saving}
                      className="bg-[#713DBF] hover:bg-[#8652D0] disabled:opacity-50 px-5 py-3 rounded-xl font-semibold text-sm"
                    >
                      {saving ? 'Adding...' : 'Add Supervisor'}
                    </button>

                  </div>

                )}

                <p className="text-xs text-gray-500 mt-3">
                  Adding a supervisor does not automatically assign them.
                  Select the supervisor and save the assignment.
                </p>

              </div>

              {/* SAVE ASSIGNMENT */}

              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={saving}
                className="w-full sm:w-auto bg-[#9860E8] hover:bg-[#8650D0] disabled:opacity-50 px-8 py-3.5 rounded-xl font-bold text-sm"
              >
                {saving
                  ? 'Saving...'
                  : 'Save Supervisor Assignment'}
              </button>

            </>

          )}

          {!selectedStudent && (

            <p className="text-sm text-gray-500 bg-[#15161B] rounded-xl p-4">
              Select a student above to view their research details and manage their supervisor.
            </p>

          )}

          {/* STATUS MESSAGE */}

          {message && (

            <div
              role="status"
              className={`p-4 rounded-xl text-sm ${
                messageType === 'success'
                  ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                  : 'bg-red-500/10 text-red-300 border border-red-500/20'
              }`}
            >
              {message}
            </div>

          )}

        </div>

      </div>

      {/* ==============================================
          DETAILED STUDENT LIST MODAL
      ============================================== */}

      {detailCategory && (

        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailCategory(null)}
        >

          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-hidden bg-[#1C1D22] border border-white/10 rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="p-5 sm:p-7 border-b border-white/10 flex items-center justify-between gap-4">

              <div>

                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Research Student Details
                </p>

                <h3 className="text-xl sm:text-2xl font-bold mt-2">
                  {detailCategory === 'with'
                    ? 'Students With Supervisors'
                    : 'Students Without Supervisors'}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {detailStudents.length} student(s)
                </p>

              </div>

              <button
                type="button"
                onClick={() => setDetailCategory(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-xl"
                aria-label="Close details"
              >
                ×
              </button>

            </div>

            {/* MODAL TABLE */}

            <div className="overflow-auto max-h-[65vh]">

              <table className="w-full text-sm text-left">

                <thead className="sticky top-0 bg-[#25262D] text-gray-400">

                  <tr>

                    <th className="p-4">
                      Index Number
                    </th>

                    <th className="p-4">
                      Student Name
                    </th>

                    {detailCategory === 'with' && (

                      <th className="p-4">
                        Research Title
                      </th>

                    )}

                    <th className="p-4">
                      Supervisor
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {detailStudents.map((student) => (

                    <tr
                      key={`${student.batch}-${student.index_no}`}
                      className="border-t border-white/5 hover:bg-white/[0.03]"
                    >

                      <td className="p-4 font-medium whitespace-nowrap">
                        {student.index_no}
                      </td>

                      <td className="p-4">
                        {student.student_name}
                      </td>

                      {detailCategory === 'with' && (

                        <td className="p-4 min-w-48">
                          {student.research_title || 'Not provided'}
                        </td>

                      )}

                      <td className="p-4">
                        {student.supervisor_name || 'Not assigned'}
                      </td>

                    </tr>

                  ))}

                  {detailStudents.length === 0 && (

                    <tr>

                      <td
                        colSpan={detailCategory === 'with' ? 4 : 3}
                        className="p-8 text-center text-gray-500"
                      >
                        No students found in this category.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            {/* MODAL FOOTER */}

            <div className="p-4 border-t border-white/10 flex justify-end">

              <button
                type="button"
                onClick={() => setDetailCategory(null)}
                className="bg-[#713DBF] hover:bg-[#8652D0] px-6 py-2.5 rounded-lg text-sm font-semibold"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}
