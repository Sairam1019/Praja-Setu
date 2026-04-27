import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../admin_components/AdminLayout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart
} from "recharts";
import {
  getAdminStats,
  getComplaintTrends,
  getViolationTrends,
  getActivitySummary
} from "../apis/dashboard.api";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    complaints: 0,
    violations: 0,
    pending: 0,
    resolved: 0,
    unassigned: 0,
  });

  const [complaintTrend, setComplaintTrend] = useState([]);
  const [violationTrend, setViolationTrend] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartRange, setChartRange] = useState(7);

  useEffect(() => {
    fetchDashboardData();
  }, [chartRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Call all endpoints in parallel
      const [statsData, compTrend, violTrend, summary] = await Promise.all([
        getAdminStats(),
        getComplaintTrends(chartRange),
        getViolationTrends(chartRange),
        getActivitySummary(),
      ]);

      setStats({
        users: statsData.users || 0,
        departments: statsData.departments || 0,
        complaints: statsData.complaints || 0,
        violations: statsData.violations || 0,
        pending: statsData.pending || 0,
        resolved: statsData.resolved || 0,
        unassigned: statsData.unassigned || 0,
      });

      setComplaintTrend(Array.isArray(compTrend) ? compTrend : []);
      setViolationTrend(Array.isArray(violTrend) ? violTrend : []);
      setPieData(Array.isArray(summary) ? summary : []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || "Something went wrong");
      // If unauthorized, clear token and redirect
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const navCards = [
    { title: "User Management", path: "/admin_users", icon: "👥", color: "from-blue-500 to-indigo-600" },
    { title: "Department Tasks", path: "/admin_tasks", icon: "📋", color: "from-indigo-500 to-purple-600" },
    { title: "Departments", path: "/admin_dept", icon: "🏢", color: "from-emerald-500 to-teal-600" },
    { title: "Activity Logs", path: "/admin-Activity/:id", icon: "📜", color: "from-rose-500 to-pink-600" },
  ];

  const kpiCards = [
    { label: "Total Users", value: stats.users, icon: "👥", gradient: "from-blue-500 to-indigo-600" },
    { label: "Departments", value: stats.departments, icon: "🏢", gradient: "from-emerald-500 to-teal-600" },
    { label: "Complaints", value: stats.complaints, icon: "📋", gradient: "from-purple-500 to-pink-600" },
    { label: "Violations", value: stats.violations, icon: "⚠️", gradient: "from-rose-500 to-red-600" },
    { label: "Pending", value: stats.pending, icon: "⏳", gradient: "from-amber-500 to-orange-600" },
    { label: "Resolved", value: stats.resolved, icon: "✅", gradient: "from-green-500 to-emerald-600" },
    { label: "Unassigned", value: stats.unassigned, icon: "📌", gradient: "from-slate-500 to-gray-600" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/30">
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-sm text-indigo-600">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Header (unchanged) */}
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
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-500 text-sm">Real‑time overview of platform metrics</p>
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={chartRange}
                  onChange={(e) => setChartRange(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 text-sm focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
                <button
                  onClick={fetchDashboardData}
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

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/80 backdrop-blur-sm rounded-2xl h-28"></div>
              ))}
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {kpiCards.map((card, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient}`} />
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                      </div>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  </div>
                ))}
              </div>

              {/* Trends Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complaint Trends */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 transition-all hover:shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">📈 Complaint Trends</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Last {chartRange} days</span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={complaintTrend}>
                      <defs>
                        <linearGradient id="colorComplaint" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorComplaint)" name="Complaints" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Violation Trends */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 transition-all hover:shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">⚠️ Violation Trends</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Last {chartRange} days</span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={violationTrend}>
                      <defs>
                        <linearGradient id="colorViolation" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#colorViolation)" name="Violations" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart + Navigation Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 transition-all hover:shadow-xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Activity Summary</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {navCards.map((card) => (
                    <div
                      key={card.path}
                      onClick={() => navigate(card.path)}
                      className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                        {card.icon}
                      </div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition">{card.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Click to manage</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;