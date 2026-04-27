import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import { getSmartTasks, sendTaskReminder } from "../apis/task.api";

function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const navigate = useNavigate();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSmartTasks();
      // Remove duplicates
      const uniqueTasks = Object.values(
        data.reduce((acc, task) => {
          const key = `${task.type}-${task.id}`;
          acc[key] = task;
          return acc;
        }, {})
      );
      setTasks(uniqueTasks);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (task) => {
    if (!task.assigned_to) {
      showToast("Task not assigned to anyone", "error");
      return;
    }
    setRemindingId(task.id);
    try {
      await sendTaskReminder(task.type, task.id);
      showToast(`Reminder sent for "${task.title}"`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to send reminder", "error");
    } finally {
      setRemindingId(null);
    }
  };

  // Filter counts
  const counts = {
    all: tasks.length,
    urgent: tasks.filter((t) => t.isUrgent).length,
    assigned: tasks.filter((t) => t.assigned_to !== null && t.assigned_to !== undefined).length,
    complaint: tasks.filter((t) => t.type === "complaint").length,
    violation: tasks.filter((t) => t.type === "violation").length,
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    if (filter === "urgent") return task.isUrgent === true;
    if (filter === "assigned") return task.assigned_to !== null && task.assigned_to !== undefined;
    if (filter === "complaint") return task.type === "complaint";
    if (filter === "violation") return task.type === "violation";
    return true;
  });

  const isVideo = (url) => url?.includes(".mp4") || url?.includes(".webm");

  const getStatusStyle = (status) => {
    if (status === "Resolved") return "bg-emerald-50 text-emerald-700";
    if (status === "In Progress") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };
  const getStatusIcon = (status) => {
    if (status === "Resolved") return "✓ Resolved";
    if (status === "In Progress") return "⏳ In Progress";
    return "🕒 Pending";
  };

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-green-50/90 border border-green-200 text-green-800"
                : "bg-red-50/90 border border-red-200 text-red-800"
            }`}
          >
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6 md:p-8 transition-all hover:shadow-indigo-200/20">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Admin Tasks
                  </h1>
                  <p className="text-slate-500 text-sm">Manage all reports, violations & assignments</p>
                </div>
              </div>
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="group flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <svg className={`h-4 w-4 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 rounded-2xl bg-white/50 backdrop-blur-sm p-3 shadow-sm border border-white/30">
            {[
              { id: "all", label: "📋 All", count: counts.all, gradient: "from-indigo-600 to-indigo-500" },
              { id: "urgent", label: "🔥 Urgent", count: counts.urgent, gradient: "from-rose-600 to-rose-500" },
              { id: "assigned", label: "📌 Assigned", count: counts.assigned, gradient: "from-blue-600 to-blue-500" },
              { id: "complaint", label: "📢 Complaints", count: counts.complaint, gradient: "from-emerald-600 to-emerald-500" },
              { id: "violation", label: "⚠️ Violations", count: counts.violation, gradient: "from-amber-600 to-amber-500" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filter === btn.id
                    ? `bg-gradient-to-r ${btn.gradient} text-white shadow-lg scale-105`
                    : "bg-white/70 text-slate-700 hover:bg-white hover:shadow-md"
                }`}
              >
                {btn.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${filter === btn.id ? "bg-white/20" : "bg-slate-100 text-slate-700"}`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-5 shadow-lg">
                  <div className="mb-3 h-40 w-full rounded-xl bg-slate-200/80" />
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 rounded bg-slate-200/80" />
                    <div className="h-4 w-1/2 rounded bg-slate-200/80" />
                    <div className="h-4 w-1/4 rounded bg-slate-200/80" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task Grid */}
          {!loading && (
            <>
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm py-16 text-center shadow-sm border border-white/30">
                  <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-inner">
                    <svg className="h-14 w-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-700">No tasks found</h3>
                  <p className="mt-2 text-slate-500">Try changing the filter or refresh the list.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={`${task.type}-${task.id}`}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/30"
                    >
                      {/* Media */}
                      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                        {task.image_url ? (
                          isVideo(task.image_url) ? (
                            <video src={task.image_url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <img src={task.image_url} alt={task.title || task.type} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex gap-2">
                          {task.isUrgent && <span className="rounded-full bg-rose-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm animate-pulse">🔥 Urgent</span>}
                          {task.assigned_to && <span className="rounded-full bg-blue-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">📌 Assigned</span>}
                        </div>
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {task.type === "complaint" ? "Complaint" : "Violation"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h2 className="text-xl font-bold text-slate-800 line-clamp-1">
                          {task.title || `${task.type.toUpperCase()} #${task.id}`}
                        </h2>

                        {task.assigned_name && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1 w-fit">
                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{task.assigned_name}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(task.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(task.status)}`}>
                            {getStatusIcon(task.status)}
                          </span>
                        </div>

                        {task.votes > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 w-fit">
                            👍 {task.votes} votes
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              task.status === "Resolved" ? "w-full bg-emerald-500" :
                              task.status === "In Progress" ? "w-1/2 bg-amber-500" : "w-1/4 bg-slate-400"
                            }`}
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(task);
                            }}
                            disabled={remindingId === task.id || !task.assigned_to}
                            className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            {remindingId === task.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              "📧 Reminder"
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin-task/${task.type}/${task.id}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Hover gradient border */}
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminTasks;