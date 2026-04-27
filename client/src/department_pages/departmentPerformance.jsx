import Layout from "../department_components/Department_Layout";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";
import {
  Activity, CheckCircle, Clock, XCircle,
  TrendingUp, Zap, Award, AlertTriangle,
  Briefcase, Percent, Hourglass, Calendar, Target
} from "lucide-react";
import { getDepartmentPerformance } from "../apis/performance.api";

function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDepartmentPerformance();
        setData(response);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="relative">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl max-w-md">
            <p className="text-red-700">{error || "No performance data available"}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { stats, analytics, insights } = data;

  const gradeColor =
    stats.grade === "A"
      ? "text-emerald-600"
      : stats.grade === "B"
      ? "text-amber-600"
      : "text-rose-600";

  const gradeBg =
    stats.grade === "A"
      ? "bg-emerald-100"
      : stats.grade === "B"
      ? "bg-amber-100"
      : "bg-rose-100";

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
      <div className="p-4 md:p-6 space-y-8 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 min-h-screen">
        
        {/* HEADER */}
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
            Performance Dashboard
          </h2>
          <p className="text-gray-500 mt-1 flex items-center gap-1">
            <Activity className="w-4 h-4" /> Real‑time productivity & efficiency metrics
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard title="Total Tasks" value={stats.total} icon={<Briefcase />} color="indigo" />
          <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} color="emerald" />
          <StatCard title="Pending" value={stats.pending} icon={<Clock />} color="amber" />
          <StatCard title="Rejected" value={stats.rejected} icon={<XCircle />} color="rose" />
        </div>

        {/* SCORE + RATE + EXTRA METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Productivity Score</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.productivityScore}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.productivityScore}<span className="text-sm text-gray-500">/100</span></p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Percent className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Completion Rate</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.completionRate}%</p>
            <p className="text-xs text-gray-400 mt-1">of all tasks</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Hourglass className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Avg Resolution</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{stats.avgResolutionHours}<span className="text-sm"> hrs</span></p>
            <p className="text-xs text-gray-400 mt-1">per task</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">SLA Breaches</h3>
            </div>
            <p className="text-3xl font-bold text-rose-600">{stats.slaBreached}</p>
            <p className="text-xs text-gray-400 mt-1">missed deadlines</p>
          </div>
        </div>

        {/* GRADE + DELAYED + EFFICIENCY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 flex items-center justify-between hover:shadow-xl transition-all">
            <div>
              <p className="text-gray-500 text-sm">Performance Grade</p>
              <h3 className={`text-4xl font-bold ${gradeColor}`}>{stats.grade}</h3>
              <p className="text-xs text-gray-400 mt-1">based on productivity score</p>
            </div>
            <div className={`p-3 rounded-full ${gradeBg}`}>
              <Award className={`w-8 h-8 ${gradeColor}`} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Clock className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Delayed Tasks</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.delayedCompleted || 0}</p>
            <p className="text-xs text-gray-400 mt-1">completed after deadline</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Efficiency Ratio</h3>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{stats.efficiencyRatio || 0}%</p>
            <p className="text-xs text-gray-400 mt-1">resolved / (resolved+rejected)</p>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Daily Performance Trend" icon={<Calendar className="w-4 h-4" />}>
            <AreaChart data={analytics.daily}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#colorTotal)" name="Total Tasks" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" name="Resolved" strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Weekly Trend (Last 12 weeks)" icon={<TrendingUp className="w-4 h-4" />}>
            <LineChart data={analytics.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week_start" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Total Tasks" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ChartCard>

          <ChartCard title="Monthly Overview" icon={<Activity className="w-4 h-4" />}>
            <BarChart data={analytics.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="total" fill="#6366f1" radius={[4,4,0,0]} name="Total Tasks" />
              <Bar dataKey="resolved" fill="#10b981" radius={[4,4,0,0]} name="Resolved" />
            </BarChart>
          </ChartCard>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/30 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mb-3">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-800">Focus Area</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.slaBreached > 0 
                ? `Reduce SLA breaches (${stats.slaBreached} missed deadlines)`
                : stats.pending > 0
                ? `Clear ${stats.pending} pending tasks`
                : "Great job! All tasks on track"}
            </p>
          </div>
        </div>

        {/* INSIGHTS SECTION */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> 
              Smart Insights
            </h3>
          </div>
          <div className="p-6">
            {insights.length === 0 ? (
              <p className="text-gray-500 text-center">No insights available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, idx) => {
                  let Icon = AlertTriangle;
                  let iconColor = "text-indigo-600";
                  if (insight.type === "positive") {
                    Icon = CheckCircle;
                    iconColor = "text-emerald-600";
                  } else if (insight.type === "critical") {
                    Icon = AlertTriangle;
                    iconColor = "text-rose-600";
                  } else if (insight.type === "info") {
                    Icon = Activity;
                    iconColor = "text-blue-600";
                  }
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/30">
                      <Icon className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
                      <p className="text-sm text-gray-700">{insight.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pt-2">
          Data reflects tasks assigned to your department. Updated in real time.
        </div>
      </div>
    </Layout>
  );
}

/* Stat Card Component */
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600"
  };
  const gradient = colorClasses[color];
  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-white/30">
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

/* Chart Card Component */
function ChartCard({ title, icon, children }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-5 transition-all hover:shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export default Performance;