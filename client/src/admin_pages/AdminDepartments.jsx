import { useEffect, useState } from "react";
import AdminLayout from "../admin_components/AdminLayout";
import { useNavigate } from "react-router-dom";
import { getDepartments } from "../apis/adminDepartment.api";

function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

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

  // Fetch departments using API
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
      showToast("Departments refreshed", "success");
    } catch (err) {
      console.error("Fetch error:", err);
      showToast(err.message || "Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Helpers for performance styling (unchanged)
  const getPerformanceGradient = (percent) => {
    if (percent > 70) return "from-emerald-500 to-green-600";
    if (percent > 40) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-red-600";
  };

  const getPerformanceBadge = (percent) => {
    if (percent > 70) return "bg-emerald-100 text-emerald-700";
    if (percent > 40) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  const getPerformanceEmoji = (percent) => {
    if (percent > 70) return "🚀";
    if (percent > 40) return "📈";
    return "⚠️";
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6 md:p-8 transition-all hover:shadow-indigo-200/20">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Department Management
                  </h1>
                  <p className="text-slate-500 text-sm">Monitor department performance and task completion</p>
                </div>
              </div>
              <button
                onClick={fetchDepartments}
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

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3 ml-auto"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && departments.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm py-16 text-center shadow-sm border border-white/30">
              <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-inner">
                <span className="text-5xl">🏢</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-700">No departments found</h3>
              <p className="mt-2 text-slate-500">Departments will appear here once created</p>
            </div>
          )}

          {/* Departments Grid */}
          {!loading && departments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dep) => {
                const perfGradient = getPerformanceGradient(dep.performance);
                const badgeColor = getPerformanceBadge(dep.performance);
                const perfEmoji = getPerformanceEmoji(dep.performance);
                return (
                  <div
                    key={dep.id}
                    onClick={() => navigate(`/admin_dept_detail/${dep.id}`)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/30"
                  >
                    {/* Top gradient performance bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${perfGradient}`} />
                    
                    <div className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition line-clamp-1">
                            {dep.name}
                          </h2>
                          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                            <span>📧</span>
                            <span className="truncate">{dep.email}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                          ID: {dep.id}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50/80 rounded-xl p-2 text-center transition-all group-hover:bg-slate-100">
                          <div className="text-xl font-bold text-slate-700">{dep.total_tasks}</div>
                          <div className="text-xs text-slate-500">Total</div>
                        </div>
                        <div className="bg-emerald-50/80 rounded-xl p-2 text-center transition-all group-hover:bg-emerald-100">
                          <div className="text-xl font-bold text-emerald-600">{dep.completed_tasks}</div>
                          <div className="text-xs text-emerald-600">Completed</div>
                        </div>
                        <div className="bg-amber-50/80 rounded-xl p-2 text-center transition-all group-hover:bg-amber-100">
                          <div className="text-xl font-bold text-amber-600">{dep.pending_tasks}</div>
                          <div className="text-xs text-amber-600">Pending</div>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            {perfEmoji} Performance
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                            {dep.performance}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${perfGradient} transition-all duration-700 ease-out`}
                            style={{ width: `${dep.performance}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Button (appears on hover) */}
                      <div className="flex justify-end pt-2">
                        <div className="text-sm text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Hover border glow */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminDepartments;