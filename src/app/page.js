// 'use client';

// import { useState, useEffect } from 'react';

// export default function Home() {
//   const [batches, setBatches] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState('');
//   const [selectedIndex, setSelectedIndex] = useState('');
//   const [studentName, setStudentName] = useState('');
//   const [supervisorName, setSupervisorName] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [supervisors, setSupervisors] = useState([]);
//   const [selectedSupervisor, setSelectedSupervisor] = useState('');

//   const [showAddSupervisor, setShowAddSupervisor] = useState(false);
//   const [newSupervisorName, setNewSupervisorName] = useState('');

//   const [supervisorLoading, setSupervisorLoading] = useState(false);
//   const [supervisorMessage, setSupervisorMessage] = useState('');
//   useEffect(() => {
//   fetch('/api/batches')
//     .then(async (res) => {
//       const result = await res.json();

//       if (!res.ok || !result.success) {
//         throw new Error(result.error || 'Failed to load batches');
//       }

//       return result.data;
//     })
//     .then((data) => {
//       setBatches(data);
//       console.log('Batches loaded:', data);
//     })
//     .catch((err) => {
//       console.error('Batch loading error:', err);
//       setMessage(err.message);
//     });
// }, []);

//   // When batch changes → load students of that batch
//   useEffect(() => {
//   if (!selectedBatch) {
//     setStudents([]);
//     setSelectedIndex('');
//     setStudentName('');
//     return;
//   }

//   fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`)
//     .then(async (res) => {
//       const result = await res.json();

//       if (!res.ok || !result.success) {
//         throw new Error(result.error || 'Failed to load students');
//       }

//       return result.data;
//     })
//     .then((data) => {
//       setStudents(data);
//       setSelectedIndex('');
//       setStudentName('');
//     })
//     .catch((err) => {
//       console.error('Student loading error:', err);
//     });
// }, [selectedBatch]);

//   // When index changes → auto set student name
//   useEffect(() => {
//     if (!selectedIndex) {
//       setStudentName('');
//       return;
//     }
//     const found = students.find((s) => s.index_no === selectedIndex);
//     setStudentName(found ? found.student_name : '');
//   }, [selectedIndex, students]);

//   const handleSubmit = async (e) => {
//   e.preventDefault();

//   setLoading(true);
//   setMessage('');

//   try {
//     const res = await fetch('/api/submit', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         batch: selectedBatch,
//         index_no: selectedIndex,
//         supervisor_id: selectedSupervisor
//       })
//     });

//     const data = await res.json();

//     if (!res.ok || !data.success) {
//       throw new Error(data.error || 'Something went wrong');
//     }

//     setMessage('Submission saved successfully!');

//     // Reset form
//     setSelectedBatch('');
//     setSelectedIndex('');
//     setStudentName('');
//     setSelectedSupervisor('');

//   } catch (error) {
//     console.error('Submission error:', error);
//     setMessage(error.message || 'Network error');

//   } finally {
//     setLoading(false);
//   }
// };

//   useEffect(() => {
//   const loadSupervisors = async () => {
//     try {
//       const res = await fetch('/api/supervisors');
//       const result = await res.json();

//       if (!res.ok || !result.success) {
//         throw new Error(result.error || 'Failed to load supervisors');
//       }

//       setSupervisors(result.data);

//     } catch (error) {
//       console.error('Supervisor loading error:', error);
//       setMessage(error.message);
//     }
//   };

//   loadSupervisors();
// }, []);
// const handleAddSupervisor = async () => {
//   const name = newSupervisorName.trim();

//   if (!name) {
//     setSupervisorMessage('Please enter a supervisor name.');
//     return;
//   }

//   setSupervisorLoading(true);
//   setSupervisorMessage('');

//   try {
//     const res = await fetch('/api/supervisors', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         supervisor_name: name
//       })
//     });

//     const result = await res.json();

//     if (!res.ok || !result.success) {
//       throw new Error(result.error || 'Unable to add supervisor');
//     }

//     const supervisor = result.data;

//     // Refresh supervisor list
//     const updatedRes = await fetch('/api/supervisors');
//     const updatedResult = await updatedRes.json();

//     if (!updatedRes.ok || !updatedResult.success) {
//       throw new Error('Supervisor was saved, but the list could not refresh. Reload the page.');
//     }

//     setSupervisors(updatedResult.data);

//     // Automatically select the newly added supervisor
//     setSelectedSupervisor(String(supervisor.id));

//     setNewSupervisorName('');
//     setShowAddSupervisor(false);

//     setSupervisorMessage(
//       result.alreadyExists
//         ? 'This supervisor already exists. Existing record selected.'
//         : 'New supervisor added successfully!'
//     );

//   } catch (error) {
//     console.error('Add supervisor error:', error);
//     setSupervisorMessage(error.message);

//   } finally {
//     setSupervisorLoading(false);
//   }
// };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-6 text-center">Student Form</h1>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Batch */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Batch</label>
//             <select
//               value={selectedBatch}
//               onChange={(e) => setSelectedBatch(e.target.value)}
//               required
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="">Select Batch</option>
//               {batches.map((b) => (
//                 <option key={b.batch} value={b.batch}>
//                   {b.batch}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Index No */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Index No</label>
//             <select
//               value={selectedIndex}
//               onChange={(e) => setSelectedIndex(e.target.value)}
//               required
//               disabled={!selectedBatch}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//             >
//               <option value="">Select Index No</option>
//               {students.map((s) => (
//                 <option key={s.index_no} value={s.index_no}>
//                   {s.index_no}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Student Name */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Student Name</label>
//             <select
//               value={studentName}
//               onChange={(e) => setStudentName(e.target.value)}
//               required
//               disabled={!selectedIndex}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//             >
//               <option value="">Select Student Name</option>
//               {students
//                 .filter((s) => s.index_no === selectedIndex)
//                 .map((s) => (
//                   <option key={s.index_no} value={s.student_name}>
//                     {s.student_name}
//                   </option>
//                 ))}
//             </select>
//           </div>

//           {/* Supervisor */}
//   <div>
//     <label className="block text-sm font-medium mb-1">
//       Supervisor Name
//     </label>

//     <select
//       value={selectedSupervisor}
//       onChange={(e) => setSelectedSupervisor(e.target.value)}
//       required
//       className="w-full border border-gray-300 rounded-lg px-3 py-2
//       focus:outline-none focus:ring-2 focus:ring-blue-500"
//     >
//       <option value="">Select Supervisor</option>

//       {supervisors.map((supervisor) => (
//         <option
//           key={supervisor.id}
//           value={supervisor.id}
//         >
//           {supervisor.supervisor_name}
//         </option>
//       ))}
//     </select>

//     {/* Add New Supervisor Button */}
//     <button
//       type="button"
//       onClick={() => {
//         setShowAddSupervisor(!showAddSupervisor);
//         setSupervisorMessage('');
//       }}
//       className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
//     >
//       {showAddSupervisor
//         ? '− Cancel'
//         : '+ Add New Supervisor'}
//     </button>

//     {/* New Supervisor Input */}
//     {showAddSupervisor && (
//       <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50">

//         <label className="block text-sm font-medium mb-2">
//           New Supervisor Name
//         </label>

//         <input
//           type="text"
//           value={newSupervisorName}
//           onChange={(e) => setNewSupervisorName(e.target.value)}
//           placeholder="Enter supervisor name"
//           maxLength={150}
//           className="w-full border border-gray-300 rounded-lg px-3 py-2
//           focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />

//         <button
//           type="button"
//           onClick={handleAddSupervisor}
//           disabled={supervisorLoading || !newSupervisorName.trim()}
//           className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg
//           font-medium hover:bg-blue-700 disabled:bg-blue-300"
//         >
//           {supervisorLoading ? 'Adding...' : '+ Add Supervisor'}
//         </button>

//       </div>
//     )}

//     {/* Supervisor feedback */}
//     {supervisorMessage && (
//       <p className="mt-2 text-sm text-blue-700">
//         {supervisorMessage}
//       </p>
//     )}
//   </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
//             >
//               {loading ? 'Saving...' : 'Save'}
//             </button>
//           </form>

//           {message && (
//             <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
//               {message}
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   }

////////////////// new layout ////////////
// 'use client';

// import { useState, useEffect } from 'react';

// export default function Home() {
//   const [batches, setBatches] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [selectedBatch, setSelectedBatch] = useState('');
//   const [selectedIndex, setSelectedIndex] = useState('');
//   const [studentName, setStudentName] = useState('');
//   const [supervisorName, setSupervisorName] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [supervisors, setSupervisors] = useState([]);
//   const [selectedSupervisor, setSelectedSupervisor] = useState('');

//   const [showAddSupervisor, setShowAddSupervisor] = useState(false);
//   const [newSupervisorName, setNewSupervisorName] = useState('');

//   const [supervisorLoading, setSupervisorLoading] = useState(false);
//   const [supervisorMessage, setSupervisorMessage] = useState('');

//   useEffect(() => {
//     fetch('/api/batches')
//       .then(async (res) => {
//         const result = await res.json();

//         if (!res.ok || !result.success) {
//           throw new Error(result.error || 'Failed to load batches');
//         }

//         return result.data;
//       })
//       .then((data) => {
//         setBatches(data);
//         console.log('Batches loaded:', data);
//       })
//       .catch((err) => {
//         console.error('Batch loading error:', err);
//         setMessage(err.message);
//       });
//   }, []);

//   // When batch changes → load students of that batch
//   useEffect(() => {
//     if (!selectedBatch) {
//       setStudents([]);
//       setSelectedIndex('');
//       setStudentName('');
//       return;
//     }

//     fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`)
//       .then(async (res) => {
//         const result = await res.json();

//         if (!res.ok || !result.success) {
//           throw new Error(result.error || 'Failed to load students');
//         }

//         return result.data;
//       })
//       .then((data) => {
//         setStudents(data);
//         setSelectedIndex('');
//         setStudentName('');
//       })
//       .catch((err) => {
//         console.error('Student loading error:', err);
//       });
//   }, [selectedBatch]);

//   // When index changes → auto set student name
//   useEffect(() => {
//     if (!selectedIndex) {
//       setStudentName('');
//       return;
//     }

//     const found = students.find((s) => s.index_no === selectedIndex);
//     setStudentName(found ? found.student_name : '');
//   }, [selectedIndex, students]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setLoading(true);
//     setMessage('');

//     try {
//       const res = await fetch('/api/submit', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           batch: selectedBatch,
//           index_no: selectedIndex,
//           supervisor_id: selectedSupervisor
//         })
//       });

//       const data = await res.json();

//       if (!res.ok || !data.success) {
//         throw new Error(data.error || 'Something went wrong');
//       }

//       setMessage('Submission saved successfully!');

//       // Reset form
//       setSelectedBatch('');
//       setSelectedIndex('');
//       setStudentName('');
//       setSelectedSupervisor('');

//     } catch (error) {
//       console.error('Submission error:', error);
//       setMessage(error.message || 'Network error');

//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const loadSupervisors = async () => {
//       try {
//         const res = await fetch('/api/supervisors');
//         const result = await res.json();

//         if (!res.ok || !result.success) {
//           throw new Error(result.error || 'Failed to load supervisors');
//         }

//         setSupervisors(result.data);

//       } catch (error) {
//         console.error('Supervisor loading error:', error);
//         setMessage(error.message);
//       }
//     };

//     loadSupervisors();
//   }, []);

//   const handleAddSupervisor = async () => {
//     const name = newSupervisorName.trim();

//     if (!name) {
//       setSupervisorMessage('Please enter a supervisor name.');
//       return;
//     }

//     setSupervisorLoading(true);
//     setSupervisorMessage('');

//     try {
//       const res = await fetch('/api/supervisors', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           supervisor_name: name
//         })
//       });

//       const result = await res.json();

//       if (!res.ok || !result.success) {
//         throw new Error(result.error || 'Unable to add supervisor');
//       }

//       const supervisor = result.data;

//       // Refresh supervisor list
//       const updatedRes = await fetch('/api/supervisors');
//       const updatedResult = await updatedRes.json();

//       if (!updatedRes.ok || !updatedResult.success) {
//         throw new Error('Supervisor was saved, but the list could not refresh. Reload the page.');
//       }

//       setSupervisors(updatedResult.data);

//       // Automatically select the newly added supervisor
//       setSelectedSupervisor(String(supervisor.id));

//       setNewSupervisorName('');
//       setShowAddSupervisor(false);

//       setSupervisorMessage(
//         result.alreadyExists
//           ? 'This supervisor already exists. Existing record selected.'
//           : 'New supervisor added successfully!'
//       );

//     } catch (error) {
//       console.error('Add supervisor error:', error);
//       setSupervisorMessage(error.message);

//     } finally {
//       setSupervisorLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-[#111216] p-3 sm:p-5 lg:p-7 flex items-center justify-center">

//       {/* MAIN SPLIT SCREEN */}
//       <div className="w-full max-w-[1500px] min-h-[850px] lg:min-h-[900px] grid grid-cols-1 lg:grid-cols-[45%_55%] overflow-hidden rounded-2xl shadow-2xl">

//         {/* =========================================
//             LEFT PANEL - STUDENT FORM
//         ========================================= */}
//         <section className="relative bg-[#1C1D22] text-white flex items-center justify-center px-6 py-14 sm:px-12 lg:px-14 xl:px-20">

//           {/* Subtle background decoration */}
//           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9B65E8] to-transparent opacity-70" />

//           <div className="w-full max-w-[440px]">

//             {/* FORM HEADING */}
//             <div className="mb-10">

//               <div className="flex items-center gap-3 mb-9">
//                 <div className="w-10 h-10 rounded-xl bg-[#9860E8]/15 border border-[#9860E8]/30 flex items-center justify-center">
//                   <svg
//                     className="w-5 h-5 text-[#B48AF5]"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1.7"
//                   >
//                     <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
//                     <circle cx="9" cy="7" r="4" />
//                     <path d="M20 8v6M23 11h-6" />
//                   </svg>
//                 </div>

//                 <span className="text-sm tracking-[0.2em] uppercase text-gray-400 font-medium">
//                   Research Portal
//                 </span>
//               </div>

//               <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
//                 Research Submission Form
//                 <span className="text-[#A878EF]">.</span>
//               </h1>

//               <p className="text-gray-400 text-sm sm:text-base leading-7">
//                 Enter the researchers details below to complete the submission.
//               </p>

//             </div>

//             {/* FORM */}
//             <form onSubmit={handleSubmit} className="space-y-7">

//               {/* BATCH */}
//               <div className="group">
//                 <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
//                   Batch
//                 </label>

//                 <div className="relative">
//                   <select
//                     value={selectedBatch}
//                     onChange={(e) => setSelectedBatch(e.target.value)}
//                     required
//                     className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] cursor-pointer"
//                   >
//                     <option value="" className="bg-[#25262C]">
//                       Select Batch
//                     </option>

//                     {batches.map((b) => (
//                       <option
//                         key={b.batch}
//                         value={b.batch}
//                         className="bg-[#25262C]"
//                       >
//                         {b.batch}
//                       </option>
//                     ))}
//                   </select>

//                   <svg
//                     className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </div>
//               </div>

//               {/* INDEX NUMBER */}
//               <div>
//                 <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
//                   Index No
//                 </label>

//                 <div className="relative">
//                   <select
//                     value={selectedIndex}
//                     onChange={(e) => setSelectedIndex(e.target.value)}
//                     required
//                     disabled={!selectedBatch}
//                     className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
//                   >
//                     <option value="" className="bg-[#25262C]">
//                       Select Index No
//                     </option>

//                     {students.map((s) => (
//                       <option
//                         key={s.index_no}
//                         value={s.index_no}
//                         className="bg-[#25262C]"
//                       >
//                         {s.index_no}
//                       </option>
//                     ))}
//                   </select>

//                   <svg
//                     className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </div>
//               </div>

//               {/* STUDENT NAME */}
//               <div>
//                 <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
//                   Student Name
//                 </label>

//                 <div className="relative">
//                   <select
//                     value={studentName}
//                     onChange={(e) => setStudentName(e.target.value)}
//                     required
//                     disabled={!selectedIndex}
//                     className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
//                   >
//                     <option value="" className="bg-[#25262C]">
//                       Select Student Name
//                     </option>

//                     {students
//                       .filter((s) => s.index_no === selectedIndex)
//                       .map((s) => (
//                         <option
//                           key={s.index_no}
//                           value={s.student_name}
//                           className="bg-[#25262C]"
//                         >
//                           {s.student_name}
//                         </option>
//                       ))}
//                   </select>

//                   <svg
//                     className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </div>
//               </div>

//               {/* SUPERVISOR */}
//               <div>
//                 <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
//                   Supervisor Name
//                 </label>

//                 <div className="relative">
//                   <select
//                     value={selectedSupervisor}
//                     onChange={(e) => setSelectedSupervisor(e.target.value)}
//                     required
//                     className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] cursor-pointer"
//                   >
//                     <option value="" className="bg-[#25262C]">
//                       Select Supervisor
//                     </option>

//                     {supervisors.map((supervisor) => (
//                       <option
//                         key={supervisor.id}
//                         value={supervisor.id}
//                         className="bg-[#25262C]"
//                       >
//                         {supervisor.supervisor_name}
//                       </option>
//                     ))}
//                   </select>

//                   <svg
//                     className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </div>

//                 {/* ADD SUPERVISOR BUTTON */}
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowAddSupervisor(!showAddSupervisor);
//                     setSupervisorMessage('');
//                   }}
//                   className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B68AF4] hover:text-white transition-colors duration-200"
//                 >
//                   <span className="text-lg leading-none">
//                     {showAddSupervisor ? '−' : '+'}
//                   </span>

//                   {showAddSupervisor
//                     ? 'Cancel'
//                     : 'Add New Supervisor'}
//                 </button>

//                 {/* NEW SUPERVISOR INPUT */}
//                 {showAddSupervisor && (
//                   <div className="mt-5 p-5 rounded-xl bg-[#25242D] border border-[#7953AD]/40 animate-in fade-in slide-in-from-top-2 duration-300">

//                     <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-400 mb-3">
//                       New Supervisor Name
//                     </label>

//                     <input
//                       type="text"
//                       value={newSupervisorName}
//                       onChange={(e) => setNewSupervisorName(e.target.value)}
//                       placeholder="Enter supervisor name"
//                       maxLength={150}
//                       className="w-full bg-transparent border-b border-[#55515F] text-white py-3 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600 transition-colors"
//                     />

//                     <button
//                       type="button"
//                       onClick={handleAddSupervisor}
//                       disabled={supervisorLoading || !newSupervisorName.trim()}
//                       className="mt-5 w-full bg-[#8050C8] hover:bg-[#9563DC] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
//                     >
//                       {supervisorLoading
//                         ? 'Adding...'
//                         : '+ Add Supervisor'}
//                     </button>

//                   </div>
//                 )}

//                 {/* SUPERVISOR FEEDBACK */}
//                 {supervisorMessage && (
//                   <p className="mt-3 text-xs text-[#C4A4F5] leading-5">
//                     {supervisorMessage}
//                   </p>
//                 )}

//               </div>

//               {/* SAVE BUTTON */}
//               <div className="pt-3">
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="group relative overflow-hidden w-full bg-[#9860E8] hover:bg-[#A878EF] text-white py-4 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-950/20"
//                 >
//                   <span className="relative z-10 flex items-center justify-center gap-3">
//                     {loading ? 'Saving...' : 'Save'}

//                     {!loading && (
//                       <svg
//                         className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                       >
//                         <path d="M5 12h14M13 6l6 6-6 6" />
//                       </svg>
//                     )}
//                   </span>
//                 </button>
//               </div>

//             </form>

//             {/* MAIN FEEDBACK */}
//             {message && (
//               <div className={`mt-6 p-4 rounded-lg text-sm text-center border ${
//                 message.toLowerCase().includes('success')
//                   ? 'bg-green-500/10 border-green-500/20 text-green-400'
//                   : 'bg-red-500/10 border-red-500/20 text-red-400'
//               }`}>
//                 {message}
//               </div>
//             )}

//             {/* FOOTER */}
//             <div className="mt-14 pt-6 border-t border-white/10 flex items-center justify-between gap-3">
//               <p className="text-xs text-gray-500">
//                 Research Management
//               </p>

//               <span className="text-[10px] tracking-[0.18em] text-gray-600 uppercase">
//                 Secure Portal
//               </span>
//             </div>

//           </div>
//         </section>


//         {/* =========================================
//             RIGHT PANEL - WELCOME / VISUAL SECTION
//         ========================================= */}
//         <section className="relative bg-[#925BE0] overflow-hidden min-h-[650px] lg:min-h-full flex flex-col justify-between px-7 py-10 sm:px-12 sm:py-14 lg:px-14 xl:px-20">

//           {/* ABSTRACT BACKGROUND SHAPES */}
//           <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#B58AF0] opacity-30 blur-[2px]" />

//           <div className="absolute top-[25%] -left-36 w-[450px] h-[450px] rounded-full bg-[#B18BEF] opacity-20" />

//           <div className="absolute -bottom-40 right-[-100px] w-[600px] h-[600px] rounded-full bg-[#713DBF] opacity-20" />

//           <div className="absolute top-[55%] left-[35%] w-72 h-72 rounded-full bg-[#C7A4FF] opacity-10 blur-3xl" />

//           {/* SUBTLE GRID */}
//           <div
//             className="absolute inset-0 opacity-[0.08]"
//             style={{
//               backgroundImage:
//                 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
//               backgroundSize: '55px 55px'
//             }}
//           />

//           {/* CONTENT */}
//           <div className="relative z-10 flex flex-col h-full min-h-[600px] lg:min-h-[760px]">

//             {/* TOP BRAND LABEL */}
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-xl border border-white/30 bg-white/10 flex items-center justify-center backdrop-blur-sm">
//                   <svg
//                     className="w-5 h-5 text-white"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                   >
//                     <path d="M4 19V5l8 7 8-7v14" />
//                   </svg>
//                 </div>

//                 <span className="text-white/90 text-xs tracking-[0.2em] uppercase font-semibold">
//                   Research Information
//                 </span>
//               </div>

//               <span className="hidden sm:block text-white/60 text-xs tracking-widest">
//                 RESEACHER PORTAL
//               </span>
//             </div>

//             {/* WELCOME TYPOGRAPHY */}
//             <div className="mt-20 lg:mt-24 mb-8">
//               <p className="text-white/75 text-sm font-medium tracking-[0.22em] uppercase mb-5">
//                 Your research journey starts here
//               </p>

//               <h2 className="text-5xl sm:text-6xl lg:text-6xl xl:text-[76px] leading-[0.98] tracking-[-0.045em] text-white">
//                 <span className="font-bold block">
//                   Welcome to
//                 </span>

//                 <span className="font-light block mt-2">
//                   Research portal
//                 </span>
//               </h2>

//               <p className="mt-6 text-white/80 text-sm sm:text-base max-w-md leading-7">
//                 A simple and seamless way to manage student information and supervisor details.
//               </p>
//             </div>

//             {/* DECORATIVE EDUCATION ILLUSTRATION */}
//             <div className="relative flex-1 flex items-center justify-center min-h-[320px] sm:min-h-[390px]">

//               {/* Floating background card */}
//               <div className="absolute inset-x-0 top-8 bottom-4 rounded-[32px] bg-white/[0.09] border border-white/10 backdrop-blur-[2px] shadow-2xl shadow-purple-950/10" />

//               {/* Illustration */}
//               <svg
//                 viewBox="0 0 600 460"
//                 className="relative z-10 w-full max-w-[590px] h-auto drop-shadow-2xl"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >

//                 {/* DOCUMENT SHADOW */}
//                 <rect
//                   x="174"
//                   y="126"
//                   width="268"
//                   height="292"
//                   rx="13"
//                   fill="#40266F"
//                   opacity=".28"
//                 />

//                 {/* DOCUMENT */}
//                 <rect
//                   x="160"
//                   y="112"
//                   width="268"
//                   height="292"
//                   rx="12"
//                   fill="#FAFAFC"
//                 />

//                 <rect
//                   x="187"
//                   y="143"
//                   width="75"
//                   height="12"
//                   rx="4"
//                   fill="#B58BEF"
//                 />

//                 <rect
//                   x="187"
//                   y="177"
//                   width="208"
//                   height="6"
//                   rx="3"
//                   fill="#D9D5E1"
//                 />

//                 <rect
//                   x="187"
//                   y="193"
//                   width="180"
//                   height="6"
//                   rx="3"
//                   fill="#E5E1EA"
//                 />

//                 {/* INFORMATION ROWS */}
//                 {[0, 1, 2, 3].map((i) => (
//                   <g key={i}>
//                     <rect
//                       x="187"
//                       y={231 + i * 36}
//                       width="200"
//                       height="7"
//                       rx="3.5"
//                       fill="#DAD5E3"
//                     />
//                     <rect
//                       x="187"
//                       y={246 + i * 36}
//                       width="115"
//                       height="6"
//                       rx="3"
//                       fill="#E9E5ED"
//                     />
//                   </g>
//                 ))}

//                 {/* CIRCLE GRAPH */}
//                 <circle
//                   cx="460"
//                   cy="119"
//                   r="49"
//                   fill="#AD83E9"
//                   stroke="white"
//                   strokeOpacity=".8"
//                   strokeWidth="2"
//                 />

//                 <circle
//                   cx="460"
//                   cy="119"
//                   r="29"
//                   stroke="white"
//                   strokeWidth="9"
//                   strokeOpacity=".9"
//                 />

//                 <path
//                   d="M460 90 A29 29 0 0 1 484 136"
//                   stroke="#6840A9"
//                   strokeWidth="9"
//                   strokeLinecap="round"
//                 />

//                 {/* PLANT */}
//                 <path
//                   d="M444 400 Q458 339 482 292"
//                   stroke="#24212B"
//                   strokeWidth="6"
//                   strokeLinecap="round"
//                 />

//                 <path
//                   d="M460 359 Q405 332 411 294 Q453 295 460 359Z"
//                   fill="#2B2634"
//                 />

//                 <path
//                   d="M468 337 Q486 270 530 275 Q528 319 468 337Z"
//                   fill="#342C40"
//                 />

//                 <path
//                   d="M455 379 Q473 322 518 329 Q506 371 455 379Z"
//                   fill="#26212E"
//                 />

//                 <path
//                   d="M425 400 H500 L490 432 H437Z"
//                   fill="#28232F"
//                 />

//                 {/* PERSON ON LEFT */}
//                 <g stroke="#24212D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">

//                   {/* Head */}
//                   <ellipse cx="111" cy="131" rx="24" ry="29" fill="#FFF" />

//                   <path
//                     d="M87 130 Q83 92 114 95 Q141 99 133 130 L124 114 Q110 126 88 116Z"
//                     fill="#26232C"
//                   />

//                   {/* Body */}
//                   <path
//                     d="M91 160 Q107 148 128 163 L141 269 L82 269Z"
//                     fill="#FFF"
//                   />

//                   {/* Arms */}
//                   <path
//                     d="M91 173 L63 229 L96 249"
//                     fill="#FFF"
//                   />

//                   <path
//                     d="M128 174 L149 229 L133 251"
//                     fill="#FFF"
//                   />

//                   {/* Laptop */}
//                   <path
//                     d="M49 221 L94 221 L108 246 L63 246Z"
//                     fill="#292530"
//                   />

//                   <path
//                     d="M63 246 L108 246"
//                     stroke="#FFF"
//                     strokeWidth="2"
//                   />

//                   {/* Legs */}
//                   <path
//                     d="M91 267 L86 346 L68 400 L91 400 L119 349 L129 269"
//                     fill="#FFF"
//                   />

//                   <path
//                     d="M126 267 L145 340 L177 394 L154 402 L117 355 L105 269"
//                     fill="#FFF"
//                   />

//                   {/* Shoes */}
//                   <path
//                     d="M68 397 L93 397 L94 410 L53 410 Q52 401 68 397Z"
//                     fill="#25212B"
//                   />

//                   <path
//                     d="M154 394 L178 388 L194 410 L165 414 L150 406Z"
//                     fill="#25212B"
//                   />

//                 </g>

//                 {/* PERSON ON RIGHT */}
//                 <g stroke="#24212D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">

//                   {/* Head */}
//                   <ellipse cx="475" cy="183" rx="25" ry="30" fill="white" />

//                   {/* Hair */}
//                   <path
//                     d="M450 183 Q438 146 468 142 Q504 139 501 174 L488 165 Q470 177 450 183Z"
//                     fill="#27232E"
//                   />

//                   {/* Body */}
//                   <path
//                     d="M450 214 Q472 201 497 218 L516 290 L436 290Z"
//                     fill="#FFF"
//                   />

//                   {/* Arms */}
//                   <path
//                     d="M454 221 L422 263 L443 275"
//                     fill="#FFF"
//                   />

//                   <path
//                     d="M495 222 L516 253 L498 269"
//                     fill="#FFF"
//                   />

//                   {/* Laptop */}
//                   <path
//                     d="M483 233 L554 233 L565 179 L574 179 L558 243 L482 243Z"
//                     fill="#27232E"
//                   />

//                   {/* Legs */}
//                   <path
//                     d="M442 286 L430 334 L478 364 L500 345 L478 292"
//                     fill="#FFF"
//                   />

//                   <path
//                     d="M482 291 L503 340 L542 360 L527 380 L478 358 L458 307"
//                     fill="#FFF"
//                   />

//                   {/* Shoes */}
//                   <path
//                     d="M470 359 L494 345 L516 368 L490 381 L468 370Z"
//                     fill="#26222D"
//                   />

//                   <path
//                     d="M526 374 L549 358 L574 375 L548 390 L524 386Z"
//                     fill="#26222D"
//                   />

//                 </g>

//                 {/* FLOATING ELEMENTS */}
//                 <circle cx="82" cy="73" r="7" fill="white" opacity=".65" />
//                 <circle cx="526" cy="87" r="5" fill="white" opacity=".7" />

//                 <path
//                   d="M54 300 L64 290 L74 300 L64 310Z"
//                   fill="white"
//                   opacity=".6"
//                 />

//                 <path
//                   d="M534 218 L544 208 L554 218 L544 228Z"
//                   fill="white"
//                   opacity=".6"
//                 />

//               </svg>

//             </div>

//             {/* BOTTOM LABEL */}
//             <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-white text-xs font-semibold tracking-[0.17em] uppercase">
//                   Research Portal
//                 </p>

//                 <p className="text-white/55 text-[11px] mt-2">
//                   A researchers way to success
//                 </p>
//               </div>

//               <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center shrink-0">
//                 <svg
//                   className="w-5 h-5 text-white"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.7"
//                 >
//                   <path d="M5 12h14M13 6l6 6-6 6" />
//                 </svg>
//               </div>
//             </div>

//           </div>
//         </section>

//       </div>
//     </main>
//   );
// }



'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [studentName, setStudentName] = useState('');
  const [researchTitle, setResearchTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [supervisorLoading, setSupervisorLoading] = useState(false);
  const [supervisorMessage, setSupervisorMessage] = useState('');

  // LOAD BATCHES
  useEffect(() => {
    fetch('/api/batches')
      .then(async (res) => {
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load batches');
        }

        return result.data;
      })
      .then((data) => {
        setBatches(data);
        console.log('Batches loaded:', data);
      })
      .catch((err) => {
        console.error('Batch loading error:', err);
        setMessage(err.message);
      });
  }, []);

  // LOAD STUDENTS WHEN BATCH CHANGES
  useEffect(() => {
    if (!selectedBatch) {
      setStudents([]);
      setSelectedIndex('');
      setStudentName('');
      return;
    }

    fetch(`/api/students?batch=${encodeURIComponent(selectedBatch)}`)
      .then(async (res) => {
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load students');
        }

        return result.data;
      })
      .then((data) => {
        setStudents(data);
        setSelectedIndex('');
        setStudentName('');
      })
      .catch((err) => {
        console.error('Student loading error:', err);
      });
  }, [selectedBatch]);

  // AUTOMATICALLY SET STUDENT NAME
  useEffect(() => {
    if (!selectedIndex) {
      setStudentName('');
      return;
    }

    const found = students.find(
      (s) => s.index_no === selectedIndex
    );

    setStudentName(found ? found.student_name : '');
  }, [selectedIndex, students]);

  // LOAD SUPERVISORS
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const res = await fetch('/api/supervisors');
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(
            result.error || 'Failed to load supervisors'
          );
        }

        setSupervisors(result.data);
      } catch (error) {
        console.error('Supervisor loading error:', error);
        setMessage(error.message);
      }
    };

    loadSupervisors();
  }, []);

  // ADD NEW SUPERVISOR
  const handleAddSupervisor = async () => {
    const name = newSupervisorName.trim();

    if (!name) {
      setSupervisorMessage('Please enter a supervisor name.');
      return;
    }

    setSupervisorLoading(true);
    setSupervisorMessage('');

    try {
      const res = await fetch('/api/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supervisor_name: name
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.error || 'Unable to add supervisor'
        );
      }

      const supervisor = result.data;

      // REFRESH SUPERVISOR LIST
      const updatedRes = await fetch('/api/supervisors');
      const updatedResult = await updatedRes.json();

      if (!updatedRes.ok || !updatedResult.success) {
        throw new Error(
          'Supervisor was saved, but the list could not refresh. Reload the page.'
        );
      }

      setSupervisors(updatedResult.data);

      // AUTOMATICALLY SELECT NEW SUPERVISOR
      setSelectedSupervisor(String(supervisor.id));

      setNewSupervisorName('');
      setShowAddSupervisor(false);

      setSupervisorMessage(
        result.alreadyExists
          ? 'This supervisor already exists. Existing record selected.'
          : 'New supervisor added successfully!'
      );

    } catch (error) {
      console.error('Add supervisor error:', error);
      setSupervisorMessage(error.message);

    } finally {
      setSupervisorLoading(false);
    }
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch: selectedBatch,
          index_no: selectedIndex,
          supervisor_id: selectedSupervisor,
          research_title: researchTitle.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || 'Something went wrong'
        );
      }

      setMessage('Submission saved successfully!');

      // RESET FORM
      setSelectedBatch('');
      setSelectedIndex('');
      setStudentName('');
      setResearchTitle('');
      setSelectedSupervisor('');

    } catch (error) {
      console.error('Submission error:', error);
      setMessage(error.message || 'Network error');

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111216] p-3 sm:p-5 lg:p-7 flex items-center justify-center">

      {/* MAIN SPLIT SCREEN */}
      <div className="w-full max-w-[1500px] min-h-[850px] lg:min-h-[900px] grid grid-cols-1 lg:grid-cols-[45%_55%] overflow-hidden rounded-2xl shadow-2xl">

        {/* =========================================
            LEFT PANEL - STUDENT FORM
        ========================================= */}
        <section className="relative bg-[#1C1D22] text-white flex items-center justify-center px-6 py-14 sm:px-12 lg:px-14 xl:px-20">

          {/* TOP ACCENT */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9B65E8] to-transparent opacity-70" />

          <div className="w-full max-w-[440px]">

            {/* FORM HEADING */}
            <div className="mb-10">

              <div className="flex items-center gap-3 mb-9">
                <div className="w-10 h-10 rounded-xl bg-[#9860E8]/15 border border-[#9860E8]/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#B48AF5]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" />
                  </svg>
                </div>

                <span className="text-sm tracking-[0.2em] uppercase text-gray-400 font-medium">
                  Research Portal
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Research Submission Form
                <span className="text-[#A878EF]">.</span>
              </h1>

              <p className="text-gray-400 text-sm sm:text-base leading-7">
                Enter the researchers details below to complete the submission.
              </p>

            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-7">

              {/* BATCH */}
              <div className="group">
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Batch
                </label>

                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    required
                    className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] cursor-pointer"
                  >
                    <option value="" className="bg-[#25262C]">
                      Select Batch
                    </option>

                    {batches.map((b) => (
                      <option
                        key={b.batch}
                        value={b.batch}
                        className="bg-[#25262C]"
                      >
                        {b.batch}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6-6 6" />
                  </svg>
                </div>
              </div>

              {/* INDEX NUMBER */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Index No
                </label>

                <div className="relative">
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    required
                    disabled={!selectedBatch}
                    className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-[#25262C]">
                      Select Index No
                    </option>

                    {students.map((s) => (
                      <option
                        key={s.index_no}
                        value={s.index_no}
                        className="bg-[#25262C]"
                      >
                        {s.index_no}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6-6 6" />
                  </svg>
                </div>
              </div>

              {/* STUDENT NAME */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Student Name
                </label>

                <div className="relative">
                  <select
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    disabled={!selectedIndex}
                    className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-[#25262C]">
                      Select Student Name
                    </option>

                    {students
                      .filter((s) => s.index_no === selectedIndex)
                      .map((s) => (
                        <option
                          key={s.index_no}
                          value={s.student_name}
                          className="bg-[#25262C]"
                        >
                          {s.student_name}
                        </option>
                      ))}
                  </select>

                  <svg
                    className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6-6 6" />
                  </svg>
                </div>
              </div>

              {/* RESEARCH TITLE - OPTIONAL */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400">
                    Research Title
                  </label>

                  
                </div>

                <input
                  type="text"
                  value={researchTitle}
                  onChange={(e) => setResearchTitle(e.target.value)}
                  placeholder="Enter research title"
                  maxLength={250}
                  className="w-full bg-transparent border-b border-[#50515A] text-white py-3.5 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] placeholder:text-gray-600"
                />

                <p className="mt-2 text-[11px] text-gray-500">
                  You can leave this field blank and add the title later if needed.
                </p>
              </div>

              {/* SUPERVISOR */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400 mb-3">
                  Supervisor Name
                </label>

                <div className="relative">
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    required
                    className="appearance-none w-full bg-transparent border-b border-[#50515A] text-white py-3.5 pr-10 text-sm outline-none transition-all duration-300 focus:border-[#A878EF] cursor-pointer"
                  >
                    <option value="" className="bg-[#25262C]">
                      Select Supervisor
                    </option>

                    {supervisors.map((supervisor) => (
                      <option
                        key={supervisor.id}
                        value={supervisor.id}
                        className="bg-[#25262C]"
                      >
                        {supervisor.supervisor_name}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="absolute right-2 top-4 w-4 h-4 text-gray-500 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6-6 6" />
                  </svg>
                </div>

                {/* ADD SUPERVISOR BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupervisor(!showAddSupervisor);
                    setSupervisorMessage('');
                  }}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B68AF4] hover:text-white transition-colors duration-200"
                >
                  <span className="text-lg leading-none">
                    {showAddSupervisor ? '−' : '+'}
                  </span>

                  {showAddSupervisor
                    ? 'Cancel'
                    : 'Add New Supervisor'}
                </button>

                {/* NEW SUPERVISOR INPUT */}
                {showAddSupervisor && (
                  <div className="mt-5 p-5 rounded-xl bg-[#25242D] border border-[#7953AD]/40 animate-in fade-in slide-in-from-top-2 duration-300">

                    <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-400 mb-3">
                      New Supervisor Name
                    </label>

                    <input
                      type="text"
                      value={newSupervisorName}
                      onChange={(e) => setNewSupervisorName(e.target.value)}
                      placeholder="Enter supervisor name"
                      maxLength={150}
                      className="w-full bg-transparent border-b border-[#55515F] text-white py-3 text-sm outline-none focus:border-[#A878EF] placeholder:text-gray-600 transition-colors"
                    />

                    <button
                      type="button"
                      onClick={handleAddSupervisor}
                      disabled={
                        supervisorLoading ||
                        !newSupervisorName.trim()
                      }
                      className="mt-5 w-full bg-[#8050C8] hover:bg-[#9563DC] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {supervisorLoading
                        ? 'Adding...'
                        : '+ Add Supervisor'}
                    </button>

                  </div>
                )}

                {/* SUPERVISOR FEEDBACK */}
                {supervisorMessage && (
                  <p className="mt-3 text-xs text-[#C4A4F5] leading-5">
                    {supervisorMessage}
                  </p>
                )}

              </div>

              {/* SAVE BUTTON */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden w-full bg-[#9860E8] hover:bg-[#A878EF] text-white py-4 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-950/20"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? 'Saving...' : 'Save'}

                    {!loading && (
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>

            </form>

            {/* MAIN FEEDBACK */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg text-sm text-center border ${
                  message.toLowerCase().includes('success')
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {message}
              </div>
            )}

            {/* FOOTER */}
            <div className="mt-14 pt-6 border-t border-white/10 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Research Management
              </p>

              <span className="text-[10px] tracking-[0.18em] text-gray-600 uppercase">
                Secure Portal
              </span>
            </div>

          </div>
        </section>

        {/* =========================================
            RIGHT PANEL - WELCOME / VISUAL SECTION
        ========================================= */}
        <section className="relative bg-[#925BE0] overflow-hidden min-h-[650px] lg:min-h-full flex flex-col justify-between px-7 py-10 sm:px-12 sm:py-14 lg:px-14 xl:px-20">

          {/* ABSTRACT BACKGROUND SHAPES */}
          <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#B58AF0] opacity-30 blur-[2px]" />

          <div className="absolute top-[25%] -left-36 w-[450px] h-[450px] rounded-full bg-[#B18BEF] opacity-20" />

          <div className="absolute -bottom-40 right-[-100px] w-[600px] h-[600px] rounded-full bg-[#713DBF] opacity-20" />

          <div className="absolute top-[55%] left-[35%] w-72 h-72 rounded-full bg-[#C7A4FF] opacity-10 blur-3xl" />

          {/* SUBTLE GRID */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
              backgroundSize: '55px 55px'
            }}
          />

          {/* CONTENT */}
          <div className="relative z-10 flex flex-col h-full min-h-[600px] lg:min-h-[760px]">

            {/* TOP BRAND LABEL */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-white/30 bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M4 19V5l8 7 8-7v14" />
                  </svg>
                </div>

                <span className="text-white/90 text-xs tracking-[0.2em] uppercase font-semibold">
                  Research Information
                </span>
              </div>

              <span className="hidden sm:block text-white/60 text-xs tracking-widest">
                RESEACHER PORTAL
              </span>
            </div>

            {/* WELCOME TYPOGRAPHY */}
            <div className="mt-20 lg:mt-24 mb-8">
              <p className="text-white/75 text-sm font-medium tracking-[0.22em] uppercase mb-5">
                Your research journey starts here
              </p>

              <h2 className="text-5xl sm:text-6xl lg:text-6xl xl:text-[76px] leading-[0.98] tracking-[-0.045em] text-white">
                <span className="font-bold block">
                  Welcome to
                </span>

                <span className="font-light block mt-2">
                  Research portal
                </span>
              </h2>

              <p className="mt-6 text-white/80 text-sm sm:text-base max-w-md leading-7">
                A simple and seamless way to manage student information and supervisor details.
              </p>
            </div>

              
            {/* DECORATIVE EDUCATION ILLUSTRATION */}
            <div className="relative flex-1 flex items-center justify-center min-h-[320px] sm:min-h-[390px]">

              {/* FLOATING BACKGROUND CARD */}
              <div className="absolute inset-x-0 top-8 bottom-4 rounded-[32px] bg-white/[0.09] border border-white/10 backdrop-blur-[2px] shadow-2xl shadow-purple-950/10" />

              {/* NEW RESEARCH IMAGE */}
              <img
                src="/images/research.png"
                alt="Research and Data Analysis Illustration"
                className="relative z-10 w-full max-w-[590px] h-auto object-contain drop-shadow-2xl"
              />

            </div>


          

            {/* BOTTOM LABEL */}
            <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-xs font-semibold tracking-[0.17em] uppercase">
                  Research Portal
                </p>

                <p className="text-white/55 text-[11px] mt-2">
                  A researchers way to success
                </p>
              </div>

              <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
