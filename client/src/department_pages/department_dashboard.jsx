import Layout from "../department_components/Department_Layout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  TrendingUp,
  Briefcase,
  Zap,
  Inbox,
  BarChart3,
  PieChart as PieChartIcon,
  ListTodo,
  AlertOctagon,
  Percent,
  Trash2
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { getDepartmentDashboard, clearDepartmentActivity } from "../apis/dashboard.api";

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    totalViolations: 0,
    totalResolved: 0,
    urgentTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  });
  const [pieData, setPieData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [assignTasks, setAssignTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const quickActions = [
    { name: "Assigned Tasks", path: "/dept_tasks", icon: "📋" },
    { name: "Work Log", path: "/dept_worklog/:id", icon: "📓" },
    { name: "Performance", path: "/dept_performance/:id", icon: "📈" },
    { name: "Priority Tasks", path: "/priority_task", icon: "⚡" },
    { name: "Notes", path: "/notes", icon: "📝" },
    { name: "Proof History", path: "/dept_proofs/:id", icon: "📸" }
  ];

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      const data = await getDepartmentDashboard();
      setStats({
        totalComplaints: data.stats?.totalComplaints || 0,
        totalViolations: data.stats?.totalViolations || 0,
        totalResolved: data.stats?.totalResolved || 0,
        urgentTasks: data.stats?.urgentTasks || 0,
        overdueTasks: data.stats?.overdueTasks || 0,
        completionRate: data.stats?.completionRate || 0
      });
      setPieData(Array.isArray(data.pieData) ? data.pieData : []);
      setPerformanceData(
        (data.performanceData || []).map(d => ({
          day: d.day,
          tasks: Number(d.tasks),
          resolved: Number(d.resolved)
        }))
      );
      setAssignTasks(
        (data.assignTasks || []).map(t => ({
          id: t.id,
          title: t.title,
          due: t.deadline ? new Date(t.deadline).toLocaleDateString() : null,
          priority: t.isUrgent ? "urgent" : t.status === "In Progress" ? "high" : "normal",
          status: t.status,
          isOverdue: t.isOverdue || false
        }))
      );
      setRecentActivities(
        (data.recentActivities || []).map((a, idx) => ({
          id: idx,
          action: a.message,
          user: "You",
          time: new Date(a.created_at).toLocaleString(),
          type: a.action || "task"
        }))
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivity = async () => {
    if (!window.confirm("Clear all recent activity? This action cannot be undone.")) return;
    setClearing(true);
    try {
      await clearDepartmentActivity();
      showToast("Activity cleared successfully", "success");
      await fetchDashboardData(); // refresh
    } catch (err) {
      console.error(err);
      showToast("Failed to clear activity", "error");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
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
    <Layout>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className={`px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative mb-8 text-center sm:text-left">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Department Dashboard
        </h2>
        <p className="text-gray-500 mt-2">Monitor complaints, violations, and team performance</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard title="Total Complaints" value={stats.totalComplaints} icon={<FileText />} color="indigo" />
            <StatCard title="Total Violations" value={stats.totalViolations} icon={<AlertTriangle />} color="amber" />
            <StatCard title="Resolved" value={stats.totalResolved} icon={<CheckCircle />} color="emerald" />
            <StatCard title="Urgent" value={stats.urgentTasks} icon={<Clock />} color="rose" />
            <StatCard title="Overdue" value={stats.overdueTasks} icon={<AlertOctagon />} color="orange" />
            <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={<Percent />} color="purple" />
          </div>

          {/* Main two‑column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-8">
            {/* Left Column */}
            <div className="flex flex-col gap-8 h-full">
              {/* Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/30">
                <div className="px-5 py-3 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-500" />
                    Issue Distribution
                  </h3>
                </div>
                <div className="p-4 h-96">
                  {pieData.length === 0 ? (
                    <EmptyState icon={<PieChartIcon className="w-10 h-10 text-indigo-300" />} title="No data" message="" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={true}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* My Tasks */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/30 h-[340px] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    My Tasks
                  </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  {assignTasks.length === 0 ? (
                    <EmptyState
                      icon={<ListTodo className="w-12 h-12 text-indigo-300" />}
                      title="No tasks assigned"
                      message="Tasks assigned to you will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {assignTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-indigo-50/30 transition-all group"
                        >
                          <div>
                            <p className="font-medium text-gray-800 group-hover:text-indigo-700">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {task.due && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {task.due}
                                </span>
                              )}
                              {task.isOverdue && (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
                              )}
                              {task.priority === "urgent" && !task.isOverdue && (
                                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Urgent</span>
                              )}
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${task.priority === "urgent" ? "bg-rose-500" : task.priority === "high" ? "bg-amber-500" : "bg-emerald-500"}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-8 h-full">
              {/* Area Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/30">
                <div className="px-5 py-3 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Last 7 Days Performance
                  </h3>
                </div>
                <div className="p-4 h-96">
                  {performanceData.length === 0 ? (
                    <EmptyState icon={<BarChart3 className="w-10 h-10 text-indigo-300" />} title="No data" message="" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="tasks" stroke="#6366f1" fill="url(#colorTasks)" name="Total Tasks" />
                        <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" name="Resolved" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 h-[340px] flex flex-col">
                <div className="px-5 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    Quick Actions
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                    {quickActions.map((action) => (
                      <button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        className="group flex flex-col items-center justify-center p-4 bg-white/50 rounded-2xl hover:bg-indigo-50 transition-all duration-200 border border-gray-200/50 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                          {action.icon}
                        </span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 text-center">
                          {action.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities with Clear button */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/30">
            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </h3>
              <button
                onClick={handleClearActivity}
                disabled={clearing || recentActivities.length === 0}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-all"
              >
                {clearing ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Clear all
              </button>
            </div>
            <div className="p-6">
              {recentActivities.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="w-12 h-12 text-indigo-300" />}
                  title="No recent activity"
                  message="Your actions will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((a) => (
                    <div key={a.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50/50 transition-all">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{a.action}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {a.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };
  const gradient = colorMap[color] || 'from-gray-500 to-gray-600';

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/30">
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <span className="text-2xl font-bold text-gray-800">{value}</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
      </div>
      <div className={`h-1 w-full bg-gradient-to-r ${gradient} transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100`} />
    </div>
  );
}

// Empty State Component
function EmptyState({ icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="bg-indigo-50/50 rounded-full p-3 mb-2">{icon}</div>
      <h4 className="text-md font-semibold text-gray-700">{title}</h4>
      {message && <p className="text-xs text-gray-500 mt-1">{message}</p>}
    </div>
  );
}

export default Dashboard;