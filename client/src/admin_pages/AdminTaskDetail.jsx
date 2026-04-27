import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import {
  getDeptUsers,
  getAdminTaskDetail,
  assignTask,
  reassignTask,
  toggleUrgent,
  deleteTask,
  sendTaskReminder        // ✅ import the reminder API
} from "../apis/task.api";

function AdminTaskDetail() {
  const { id, type } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingUrgent, setTogglingUrgent] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);  // ✅ new state
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedAssignUser, setSelectedAssignUser] = useState("");
  const [selectedReassignUser, setSelectedReassignUser] = useState("");

  useEffect(() => {
    fetchTask();
    fetchUsers();
  }, []);

  const fetchTask = async () => {
    try {
      const data = await getAdminTaskDetail(type, id);
      setTask(data);
      if (data.deadline) setDeadline(data.deadline.split("T")[0]);
    } catch (err) {
      console.error(err);
      alert(err.message || "❌ Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getDeptUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignUser) return;
    if (!window.confirm("Assign this task to selected user?")) return;
    setAssigning(true);
    try {
      await assignTask({
        id,
        type,
        userId: selectedAssignUser,
        deadline: deadline || null
      });
      alert("✅ Assigned successfully");
      setSelectedAssignUser("");
      await fetchTask();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedReassignUser) return;
    if (!window.confirm("Reassign this task?")) return;
    setReassigning(true);
    try {
      await reassignTask({
        id,
        type,
        userId: selectedReassignUser
      });
      alert("🔄 Reassigned successfully");
      setSelectedReassignUser("");
      await fetchTask();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setReassigning(false);
    }
  };

  const handleToggleUrgent = async () => {
    setTogglingUrgent(true);
    try {
      await toggleUrgent({
        id,
        type,
        urgent: !task.isUrgent
      });
      await fetchTask();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update urgent status");
    } finally {
      setTogglingUrgent(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Delete this task permanently?")) return;
    setDeleting(true);
    try {
      await deleteTask(type, id);
      alert("✅ Deleted");
      navigate("/admin_tasks");
    } catch (err) {
      console.error(err);
      alert("❌ Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Send reminder handler
  const handleSendReminder = async () => {
    if (!task.assigned_to) {
      alert("Task is not assigned to anyone. Cannot send reminder.");
      return;
    }
    if (!window.confirm(`Send reminder for "${task.title}" to the assigned user?`)) return;
    setSendingReminder(true);
    try {
      await sendTaskReminder(type, id);
      alert("✅ Reminder sent successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "❌ Failed to send reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  const goBack = () => {
    if (task?.assigned_to) {
      navigate(`/admin_dept_detail/${task.assigned_to}`);
    } else {
      navigate("/admin_tasks");
    }
  };

  const isVideo = (url) => url?.includes(".mp4") || url?.includes(".webm");

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-3 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600 mt-4 font-medium">Loading task details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!task) return null;

  const descText = task.description || "No description provided.";
  const shouldTruncate = descText.length > 200;
  const displayDesc = shouldTruncate && !descExpanded ? descText.slice(0, 200) + "..." : descText;

  const isResolved = task.status === "Resolved";

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Header (unchanged) */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-slate-700/50 p-6 md:p-8 transition-all duration-500 hover:shadow-indigo-200/20 group">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-5">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white/90 text-slate-700 dark:text-slate-200 transition-all backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg hover:scale-105 duration-200"
                >
                  ← Back
                </button>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{type === "complaint" ? "📋" : "⚠️"}</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {task.title || `${type.toUpperCase()} #${id}`}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {task.isUrgent && (
                      <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm animate-pulse">
                        🔥 Urgent
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      task.status === "Resolved"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : task.status === "In Progress"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                      ID: #{task.id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin_tasks")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white/90 text-slate-700 dark:text-slate-200 transition-all backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg hover:scale-105 duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                All Tasks
              </button>
            </div>
          </div>

          {/* Urgent Toggle */}
          <div className="flex justify-end">
            <button
              onClick={handleToggleUrgent}
              disabled={togglingUrgent}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl ${
                task.isUrgent
                  ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
              } disabled:opacity-60 transform hover:scale-105`}
            >
              {togglingUrgent ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : task.isUrgent ? (
                "🔥 Remove Urgent"
              ) : (
                "🔥 Mark Urgent"
              )}
            </button>
          </div>

          {/* Media Section (unchanged) */}
          {task.image_url && (
            <div className="rounded-2xl overflow-hidden shadow-xl bg-black/5 backdrop-blur-sm border border-white/20 transition-all hover:shadow-2xl">
              <div className="flex justify-center p-4 bg-gradient-to-br from-slate-100/50 to-white/30 dark:from-slate-800/30">
                {isVideo(task.image_url) ? (
                  <video src={task.image_url} controls className="max-h-[500px] w-full object-contain rounded-xl" />
                ) : (
                  <img src={task.image_url} alt="Task evidence" className="max-h-[500px] w-full object-contain rounded-xl transition-transform duration-500 hover:scale-105" />
                )}
              </div>
            </div>
          )}

          {/* Two‑Column Details (unchanged) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Information Card (unchanged) */}
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ... status, votes, category, priority, created, deadline – unchanged ... */}
                  <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full"><svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <div><p className="text-xs text-slate-400 uppercase">Status</p><p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{task.status}</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full"><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></div>
                    <div><p className="text-xs text-slate-400 uppercase">Votes</p><p className="font-medium text-slate-800 dark:text-slate-200">{task.votes || 0}</p></div>
                  </div>
                  {task.category && (
                    <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg></div>
                      <div><p className="text-xs text-slate-400 uppercase">Category</p><p className="font-medium text-slate-800 dark:text-slate-200">{task.category}</p></div>
                    </div>
                  )}
                  {task.priority && (
                    <div className="flex items-start gap-3 p-2 rounded-xl hover:shadow-md transition-all duration-200" style={{ backgroundColor: task.priority === "High" ? "#fee2e2" : task.priority === "Medium" ? "#fef3c7" : "#d1fae5" }}>
                      <div className={`p-2 rounded-full ${task.priority === "High" ? "bg-rose-200" : task.priority === "Medium" ? "bg-amber-200" : "bg-emerald-200"}`}>
                        <span className="text-sm">{task.priority === "High" ? "🔴" : task.priority === "Medium" ? "🟡" : "🟢"}</span>
                      </div>
                      <div><p className="text-xs text-slate-400 uppercase">Priority</p><p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{task.priority}</p></div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <div><p className="text-xs text-slate-400 uppercase">Created</p><p className="text-slate-800 dark:text-slate-200">{new Date(task.created_at).toLocaleString()}</p></div>
                  </div>
                  {task.deadline && (
                    <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full"><svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                      <div><p className="text-xs text-slate-400 uppercase">Deadline</p><p className="text-slate-800 dark:text-slate-200">{new Date(task.deadline).toLocaleDateString()}</p></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned To Card (unchanged) */}
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Assigned To</h2>
                </div>
                {task.assigned_name ? (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800/30 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {task.assigned_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-lg">{task.assigned_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">User ID: {task.assigned_to}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">Not assigned yet</p>
                )}
              </div>

              {/* Address & Location (unchanged) */}
              {task.address && (
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Location</h2>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{task.address}</p>
                  {task.lat && task.lng && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                      Lat: {parseFloat(task.lat).toFixed(6)}, Lng: {parseFloat(task.lng).toFixed(6)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Description (unchanged) */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Description</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                  {displayDesc}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-3 hover:underline focus:outline-none transition-all"
                  >
                    {descExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/50 p-6 md:p-8 transition-all duration-500 hover:shadow-indigo-200/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Management Actions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deadline Section (unchanged) */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Deadline</h3>
                </div>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-slate-800 dark:text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition"
                />
                <p className="text-xs text-slate-500 mt-2">Set a due date for this task</p>
              </div>

              {/* Assign Section (unchanged) */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Assign User</h3>
                </div>
                <select
                  value={selectedAssignUser}
                  onChange={(e) => setSelectedAssignUser(e.target.value)}
                  disabled={assigning || isResolved}
                  className={`w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-slate-800 dark:text-white disabled:opacity-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition ${isResolved ? 'cursor-not-allowed' : ''}`}
                >
                  <option value="">Select department user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Assigned: {u.assigned_tasks})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedAssignUser || assigning || isResolved}
                  className={`mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-95 shadow-md ${!isResolved ? 'hover:from-emerald-700 hover:to-emerald-800' : ''}`}
                >
                  {assigning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </div>
                  ) : (
                    "Assign Task"
                  )}
                </button>
                {isResolved && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                    ⚠️ Cannot assign – task is already resolved.
                  </p>
                )}
              </div>

              {/* Reassign Section (unchanged) */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Reassign User</h3>
                </div>
                <select
                  value={selectedReassignUser}
                  onChange={(e) => setSelectedReassignUser(e.target.value)}
                  disabled={reassigning}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-slate-800 dark:text-white disabled:opacity-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <option value="">Select new user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Assigned: {u.assigned_tasks})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleReassign}
                  disabled={!selectedReassignUser || reassigning}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  {reassigning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Reassigning...
                    </div>
                  ) : (
                    "Reassign Task"
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons Row – now with 3 buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => navigate(`/admin-track/${type}/${id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                📊 Track Progress
              </button>

              {/* ✅ New Send Reminder Button */}
              {task.assigned_to && (
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {sendingReminder ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    "📧 Send Reminder"
                  )}
                </button>
              )}

              <button
                onClick={handleDeleteTask}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {deleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  "❌ Delete Task"
                )}
              </button>
            </div>

            {/* If task not assigned, show a note why reminder button is missing */}
            {!task.assigned_to && (
              <div className="mt-4 text-center text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Reminder not available – task is not assigned to anyone.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminTaskDetail;