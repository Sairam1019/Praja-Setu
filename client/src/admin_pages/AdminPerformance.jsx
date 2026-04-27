import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
  AreaChart, Area,
  Legend
} from "recharts";
import {
  getAdminPerformance,
  getDepartmentPerformanceByAdmin
} from "../apis/performance.api";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

function AdminPerformance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    summaryCards: {},
    departments: [],
    pieChart: [],
    trend: [],
    insights: {}
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    fetchData(id);
  }, [id]);

  const fetchData = async (deptId = null) => {
    setLoading(true);
    try {
      const result = deptId 
        ? await getDepartmentPerformanceByAdmin(deptId)
        : await getAdminPerformance();
      
      setData({
        summaryCards: result.summaryCards || {},
        departments: result.departments || [],
        pieChart: result.pieChart || [],
        trend: result.trend || [],
        insights: result.insights || {}
      });
      showToast("Performance data updated", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (id) {
      navigate(`/admin_dept_detail/${id}`);
    } else {
      navigate("/admin_dept");
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/30">
          <p className="font-semibold text-slate-700">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 backdrop-blur-sm ${
            toast.type === "success" ? "bg-green-50/90 border border-green-200 text-green-800" : "bg-red-50/90 border border-red-200 text-red-800"
          }`}>
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/30 p-6 md:p-8 transition-all hover:shadow-indigo-200/20">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 px-4 py-2 text-sm font-medium shadow-md transition-all hover:shadow-lg"
                >
                  ← Back
                </button>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {id ? "Department Analytics" : "Performance Dashboard"}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Real‑time metrics • Task trends • Department insights
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchData(id)}
                disabled={loading}
                className="group flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <svg className={`h-4 w-4 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <KpiCard title="Total Tasks" value={data.summaryCards?.total_tasks || 0} change="+12%" icon="📋" gradient="from-blue-500 to-indigo-600" />
                <KpiCard title="Resolved" value={data.summaryCards?.resolved_tasks || 0} change="+8%" icon="✅" gradient="from-emerald-500 to-green-600" />
                <KpiCard title="Pending" value={data.summaryCards?.pending_tasks || 0} change="-3%" icon="⏳" gradient="from-amber-500 to-orange-600" trendDown />
                <KpiCard title="Overdue" value={data.summaryCards?.overdue_tasks || 0} change="+5%" icon="🚨" gradient="from-red-500 to-rose-600" trendUp />
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Completion Trend (7 days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.trend}>
                      <defs>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={CustomTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#colorResolved)" name="Resolved" />
                      <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="url(#colorPending)" name="Pending" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Task Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.pieChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.pieChart.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Rankings Table - Fixed whitespace */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Department Rankings
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="p-4 text-left font-semibold text-slate-600">Rank</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Department</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Lead</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Total Tasks</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Completed</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Completion Rate</th>
                        <th className="p-4 text-left font-semibold text-slate-600">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.departments.map((dep) => {
                        const rate = dep.total_tasks > 0 ? ((dep.completed_tasks / dep.total_tasks) * 100).toFixed(1) : 0;
                        return (
                          <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="p-4 font-medium">
                              {dep.rank === 1 ? "🥇" : dep.rank === 2 ? "🥈" : dep.rank === 3 ? "🥉" : `#${dep.rank}`}
                            </td>
                            <td className="p-4 font-medium text-slate-800">{dep.name}</td>
                            <td className="p-4 text-slate-600">{dep.lead_name || "—"}</td>
                            <td className="p-4 text-slate-600">{dep.total_tasks}</td>
                            <td className="p-4 text-slate-600">{dep.completed_tasks}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{rate}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                dep.performance > 70 ? "bg-emerald-100 text-emerald-700" :
                                dep.performance > 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              }`}>
                                {dep.performance}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <InsightCard
                  title="Completion Rate"
                  value={`${data.summaryCards?.total_tasks ? ((data.summaryCards.resolved_tasks / data.summaryCards.total_tasks) * 100).toFixed(1) : 0}%`}
                  description="Overall task completion"
                  icon="🎯"
                  color="emerald"
                />
                <InsightCard
                  title="Urgent Tasks"
                  value={data.summaryCards?.urgent_tasks || 0}
                  description="Require immediate attention"
                  icon="🔥"
                  color="rose"
                />
                <InsightCard
                  title="Avg Response Time"
                  value={data.insights?.avg_response_time || "2.4d"}
                  description="Time to first action"
                  icon="⏱️"
                  color="blue"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>
    </AdminLayout>
  );
}

function KpiCard({ title, value, change, icon, gradient, trendUp, trendDown }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10 p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
            {change && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-red-500' : trendDown ? 'text-red-500' : 'text-emerald-500'}`}>
                {change} from last month
              </p>
            )}
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full w-0 bg-gradient-to-r ${gradient} transition-all duration-1000 group-hover:w-full`} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, description, icon, color }) {
  const colorClasses = {
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    blue: "from-blue-500 to-indigo-500"
  };
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/30 transition-all hover:shadow-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-lg shadow-md`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminPerformance;