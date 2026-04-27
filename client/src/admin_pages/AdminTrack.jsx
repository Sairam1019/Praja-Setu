import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import { getTaskTracking } from "../apis/task.api";

function AdminTrack() {
  const { type, id } = useParams();

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrack();
    const interval = setInterval(fetchTrack, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrack = async () => {
    try {
      const data = await getTaskTracking(type, id);
      const timeline = data.timeline || [];
      const formatted = timeline.map((log) => ({
        label: formatLabel(log.action),
        user: log.user_name || "System",
        time: log.created_at,
        message: log.message,
      }));
      setSteps(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const formatLabel = (action) => {
    const map = {
      ASSIGNED: "Assigned",
      REASSIGNED: "Reassigned",
      IN_PROGRESS: "In Progress",
      VERIFIED: "Verified",
      RESOLVED: "Resolved",
      COMMENTED: "Comment",
      DEADLINE_UPDATED: "Deadline Updated",
      DELETED: "Deleted",
    };
    return map[action] || action;
  };

  const getIcon = (label) => {
    const icons = {
      Assigned: "📌",
      Reassigned: "🔁",
      "In Progress": "🔄",
      Verified: "✅",
      Resolved: "🎉",
      Comment: "💬",
      "Deadline Updated": "⏰",
      Deleted: "❌",
    };
    return icons[label] || "📍";
  };

  const getStatusColor = (label) => {
    if (label === "Resolved") return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (label === "In Progress") return "bg-amber-50 border-amber-200 text-amber-700";
    if (label === "Verified") return "bg-blue-50 border-blue-200 text-blue-700";
    if (label === "Assigned") return "bg-indigo-50 border-indigo-200 text-indigo-700";
    if (label === "Comment") return "bg-slate-50 border-slate-200 text-slate-700";
    return "bg-white border-slate-200 text-slate-700";
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6 md:p-8 transition-all hover:shadow-indigo-200/20">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Task Tracking
                  </h1>
                  <p className="text-slate-500 text-sm">
                    {type === "complaint" ? "Complaint" : "Violation"} #{id} — Activity Timeline
                  </p>
                </div>
              </div>
              <button
                onClick={fetchTrack}
                className="group flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-md transition-all hover:shadow-lg"
              >
                <svg className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm py-16 text-center shadow-sm border border-white/30">
                <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-inner">
                  <span className="text-5xl">📭</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-700">No activity yet</h3>
                <p className="mt-2 text-slate-500">Updates will appear here as the task progresses.</p>
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-white/30 ${getStatusColor(step.label)}`}
                >
                  <div className="p-5 flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-2xl shadow-md">
                        {getIcon(step.label)}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="font-bold text-slate-800 text-lg">{step.label}</p>
                        <p className="text-xs text-slate-500 bg-white/50 px-2 py-0.5 rounded-full w-fit">
                          {new Date(step.time).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        by <span className="font-medium">{step.user}</span>
                      </p>
                      {step.message && (
                        <p className="text-sm text-slate-700 mt-2 p-3 bg-white/30 rounded-lg border border-white/20">
                          💬 {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Timeline connector line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[2.1rem] top-[4.5rem] bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-transparent opacity-50 group-hover:opacity-100 transition" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminTrack;