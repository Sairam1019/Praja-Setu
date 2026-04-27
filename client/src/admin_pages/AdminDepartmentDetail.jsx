import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import { getDepartmentDetails } from "../apis/adminDepartment.api";
import { getAllUsers } from "../apis/adminUser.api";

function AdminDepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    urgent: 0,
    resolved: 0,
    pending: 0,
    overdue: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [compareId, setCompareId] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [reassignTaskData, setReassignTaskData] = useState(null);
  const [reassignUser, setReassignUser] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Fetch tasks & summary for this department
  useEffect(() => {
    fetchTasks();
    fetchDepartments();
  }, [id]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentDetails(id);
      setTasks(data.tasks || []);
      setSummary(data.summary || { total: 0, urgent: 0, resolved: 0, pending: 0, overdue: 0 });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users, filter to departments only (excluding current)
  const fetchDepartments = async () => {
    try {
      const data = await getAllUsers();
      const filtered = data.filter(u => u.role === "department" && u.id != id);
      setDepartments(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // Navigate to performance page
  const goToPerformance = () => {
    navigate(`/admin_performance/${id}`);
  };

  // Compare departments
  const handleCompare = () => {
    if (!compareId) {
      showToast("Select a department to compare", "error");
      return;
    }
    navigate(`/admin_performance/${id}?compare=${compareId}`);
  };

  // Navigate back to departments list
  const goBack = () => {
    navigate("/admin_dept");
  };

  // Toggle description expand
  const toggleExpand = (taskId) => {
    setExpandedDesc(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Send reminder (toast only)
  const sendReminder = async (task) => {
    showToast(`📧 Reminder sent for "${task.title}"`, "success");
  };

  // Open reassign modal
  const openReassignModal = (task) => {
    setReassignTaskData(task);
    setReassignUser("");
    setReassignReason("");
    setShowReassignModal(true);
  };

  // Handle reassign submission (placeholder – integrate with real API if needed)
  const handleReassign = async () => {
    if (!reassignUser) {
      showToast("Please select a user", "error");
      return;
    }
    showToast(`🔄 Task "${reassignTaskData.title}" reassigned successfully`, "success");
    setShowReassignModal(false);
    fetchTasks(); // refresh list
  };

  const closeModal = () => {
    setShowReassignModal(false);
  };

  // Helper: truncate text
  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Check if deadline is overdue
  const isOverdue = (task) => task.isOverdue === true;

  // Status helpers
  const getStatusStyle = (status) => {
    if (status === "Resolved") return "bg-emerald-100 text-emerald-700";
    if (status === "In Progress") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };
  const getStatusIcon = (status) => {
    if (status === "Resolved") return "✓";
    if (status === "In Progress") return "🔄";
    return "⏳";
  };

  // Priority badge
  const getPriorityBadge = (task) => {
    if (task.priority === "High") return "bg-rose-100 text-rose-700";
    if (task.priority === "Medium") return "bg-orange-100 text-orange-700";
    if (task.priority === "Low") return "bg-emerald-100 text-emerald-700";
    if (task.isUrgent) return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };
  const getPriorityIcon = (task) => {
    if (task.priority === "High" || task.isUrgent) return "🔴";
    if (task.priority === "Medium") return "🟡";
    if (task.priority === "Low") return "🟢";
    return "📌";
  };

  // Type badge
  const getTypeBadge = (type) => {
    if (type === "complaint") return "bg-indigo-100 text-indigo-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 backdrop-blur-sm ${
            toast.type === "success" 
              ? "bg-green-50/90 border border-green-200 text-green-800" 
              : "bg-red-50/90 border border-red-200 text-red-800"
          }`}>
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
      )}

      {/* Reassign Modal with Back Button */}
      {showReassignModal && reassignTaskData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={closeModal}
                  className="text-slate-500 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-100"
                  aria-label="Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Reassign Task</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Task: <span className="font-medium">{reassignTaskData.title}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
                <select
                  value={reassignUser}
                  onChange={(e) => setReassignUser(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Select department user</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-400"
                  placeholder="Why reassign?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleReassign} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">Confirm Reassign</button>
              </div>
            </div>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Department Tasks
                  </h1>
                  <p className="text-slate-500 text-sm">Manage and track all assigned tasks</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 px-5 py-2.5 text-sm font-medium shadow-md transition-all hover:shadow-lg"
                >
                  ← Back
                </button>
                <button
                  onClick={goToPerformance}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium shadow-md transition-all hover:shadow-lg"
                >
                  📊 Performance
                </button>
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
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30 shadow-md">
              <div className="text-3xl font-bold text-slate-800">{summary.total}</div>
              <div className="text-xs text-slate-500 mt-1">Total Tasks</div>
            </div>
            <div className="bg-rose-50/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-rose-200/30 shadow-md">
              <div className="text-3xl font-bold text-rose-600">{summary.urgent}</div>
              <div className="text-xs text-rose-500 mt-1">🔥 Urgent</div>
            </div>
            <div className="bg-emerald-50/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-emerald-200/30 shadow-md">
              <div className="text-3xl font-bold text-emerald-600">{summary.resolved}</div>
              <div className="text-xs text-emerald-500 mt-1">✓ Resolved</div>
            </div>
            <div className="bg-amber-50/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-amber-200/30 shadow-md">
              <div className="text-3xl font-bold text-amber-600">{summary.pending}</div>
              <div className="text-xs text-amber-500 mt-1">⏳ Pending</div>
            </div>
            <div className="bg-red-50/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-red-200/30 shadow-md">
              <div className="text-3xl font-bold text-red-600">{summary.overdue}</div>
              <div className="text-xs text-red-500 mt-1">⚠️ Overdue</div>
            </div>
          </div>

          {/* 🆕 Improved Comparison UI */}
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-md border border-white/30 p-5 transition-all hover:shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 text-xl">⚖️</span>
                <h3 className="text-md font-semibold text-slate-700">Compare with another department</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-indigo-400 transition w-full sm:w-64"
                >
                  <option value="">Select department</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCompare}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>⚖️</span> Compare
                </button>
              </div>
            </div>
            {compareId && (
              <div className="mt-3 text-xs text-slate-500 bg-white/40 p-2 rounded-lg">
                You selected <strong>{departments.find(d => d.id == compareId)?.name || "department"}</strong>. Click "Compare" to see side‑by‑side performance.
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-slate-100 rounded w-16"></div>
                    <div className="h-8 bg-slate-100 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tasks Grid */}
          {!loading && (
            <>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm py-16 text-center shadow-sm border border-white/30">
                  <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-inner">
                    <span className="text-5xl">📭</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-700">No tasks assigned</h3>
                  <p className="mt-2 text-slate-500">This department has no tasks yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tasks.map((task) => {
                    const isExpanded = expandedDesc[task.id];
                    const descText = task.description || "No description";
                    const displayDesc = isExpanded ? descText : truncateText(descText, 120);
                    const overdue = isOverdue(task);
                    const statusStyle = getStatusStyle(task.status);
                    const priorityBadge = getPriorityBadge(task);
                    const priorityIcon = getPriorityIcon(task);
                    const typeBadge = getTypeBadge(task.type);

                    return (
                      <div
                        key={task.id}
                        className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-white/30"
                      >
                        {/* Top gradient bar */}
                        <div className={`h-1.5 ${
                          task.isUrgent ? "bg-gradient-to-r from-rose-500 to-red-600" :
                          overdue ? "bg-gradient-to-r from-orange-500 to-amber-600" :
                          "bg-gradient-to-r from-indigo-500 to-indigo-400"
                        }`} />
                        
                        <div className="p-5 space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold text-slate-800 line-clamp-1">
                              {task.title}
                            </h2>
                            <div className="flex gap-1">
                              {task.isUrgent && (
                                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">🔥 Urgent</span>
                              )}
                              {overdue && !task.isUrgent && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠️ Overdue</span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge}`}>
                                {task.type}
                              </span>
                            </div>
                          </div>

                          {/* Description with Read More */}
                          <div>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                              {displayDesc}
                            </p>
                            {descText.length > 120 && (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="text-indigo-600 text-xs font-medium mt-1 hover:underline focus:outline-none"
                              >
                                {isExpanded ? "Show less" : "Read more"}
                              </button>
                            )}
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">📅</span>
                              <span className="text-slate-600">{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                            {task.deadline && (
                              <div className={`flex items-center gap-1 ${overdue ? "text-red-600 font-semibold" : "text-slate-500"}`}>
                                <span>⏰</span>
                                <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                                {overdue && <span className="ml-1 text-red-500">⚠️</span>}
                              </div>
                            )}
                            {task.votes > 0 && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <span>👍</span> {task.votes} votes
                              </div>
                            )}
                          </div>

                          {/* Status & Priority badges */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
                              {getStatusIcon(task.status)} {task.status}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityBadge}`}>
                              {priorityIcon} {task.priority || (task.isUrgent ? "Urgent" : "Normal")}
                            </span>
                          </div>

                          {/* Progress indicator */}
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                task.status === "Resolved" ? "w-full bg-emerald-500" :
                                task.status === "In Progress" ? "w-1/2 bg-amber-500" : "w-1/4 bg-slate-400"
                              }`}
                            />
                          </div>

                          {/* Action buttons */}
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => sendReminder(task)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                            >
                              📧 Reminder
                            </button>
                            <button
                              onClick={() => openReassignModal(task)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            >
                              🔄 Reassign
                            </button>
                          </div>
                        </div>

                        {/* Hover glow */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                    );
                  })}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminDepartmentDetail;