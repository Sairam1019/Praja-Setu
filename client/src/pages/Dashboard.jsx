import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FileText,
  AlertTriangle,
  MapPin,
  Map,
  CheckCircle,
  ThumbsUp,
  Clock,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
  User,
  CalendarDays,
  ClipboardList,
  Navigation,
  CheckSquare
} from "lucide-react";

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// ✅ Import your dashboard API functions
import {
  getComplaintStats,
  getViolationStats,
  getWeeklyTrend,
  getStatusDistribution
} from "../apis/dashboard.api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ================= ACTION CARD ================= */
const ActionCard = ({ title, path, icon: Icon, color, desc, navigate }) => (
  <div
    onClick={() => navigate(path)}
    className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-xl cursor-pointer transition"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  </div>
);

/* ================= CHART CARD ================= */
const ChartCard = ({ title, icon, children, loading }) => (
  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    {loading ? (
      <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    )}
  </div>
);

function Dashboard() {
  const navigate = useNavigate();

  const [complaintStats, setComplaintStats] = useState({});
  const [violationStats, setViolationStats] = useState({});
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USING API UTILITY ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run all requests in parallel
        const [cStats, vStats, trend, status] = await Promise.all([
          getComplaintStats(),
          getViolationStats(),
          getWeeklyTrend(),
          getStatusDistribution()
        ]);

        setComplaintStats(cStats);
        setViolationStats(vStats);
        setWeeklyTrend(trend.data || []);
        setStatusData(status.data || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= ACTION CARDS ================= */
  const actionCards = [
    {
      title: "Report Issue",
      path: "/report-issue",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
      desc: "Submit civic complaint"
    },
    {
      title: "Report Violation",
      path: "/report-violation",
      icon: AlertTriangle,
      color: "bg-yellow-100 text-yellow-600",
      desc: "Submit violation"
    },
    {
      title: "Track Complaints",
      path: "/track-complaint",
      icon: Navigation,
      color: "bg-pink-100 text-pink-600",
      desc: "Track progress"
    },
    {
      title: "Map View",
      path: "/map-view",
      icon: Map,
      color: "bg-blue-100 text-blue-600",
      desc: "View on map"
    },
    {
      title: "Resolved Tasks",
      path: "/resolved",
      icon: CheckSquare,
      color: "bg-green-100 text-green-600",
      desc: "View resolved"
    },
    {
      title: "All Complaints",
      path: "/complaint",
      icon: ClipboardList,
      color: "bg-orange-100 text-orange-600",
      desc: "Browse all"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500 text-white rounded-full">
              <User />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome, Citizen 👋
              </h2>
              <p className="text-white/70 flex items-center gap-1 text-sm">
                <CalendarDays className="w-4 h-4" />
                {new Date().toDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <Activity className="w-4 h-4" />
            System Active
          </div>
        </div>

        {/* COMPLAINT STATS */}
        <div>
          <h3 className="font-semibold text-white mb-3">Complaints</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total" value={complaintStats.total || 0}
              icon={<FileText />} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Resolved" value={complaintStats.resolved || 0}
              icon={<CheckCircle />} color="bg-green-100 text-green-600" />
            <StatCard title="In Progress" value={complaintStats.inProgress || 0}
              icon={<Clock />} color="bg-blue-100 text-blue-600" />
            <StatCard title="Pending" value={complaintStats.pending || 0}
              icon={<AlertTriangle />} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        {/* VIOLATION STATS */}
        <div>
          <h3 className="font-semibold text-white mb-3">Violations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total" value={violationStats.total || 0}
              icon={<AlertTriangle />} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Resolved" value={violationStats.resolved || 0}
              icon={<CheckCircle />} color="bg-green-100 text-green-600" />
            <StatCard title="In Progress" value={violationStats.inProgress || 0}
              icon={<Clock />} color="bg-blue-100 text-blue-600" />
            <StatCard title="Pending" value={violationStats.pending || 0}
              icon={<AlertTriangle />} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Weekly Activity" icon={<TrendingUp className="text-indigo-500" />} loading={loading}>
            <AreaChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="complaints" stroke="#6366f1" fill="#6366f133" />
              <Area type="monotone" dataKey="violations" stroke="#f59e0b" fill="#f59e0b33" />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Status Distribution" icon={<PieChartIcon className="text-indigo-500" />} loading={loading}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {actionCards.map((card, i) => (
              <ActionCard key={i} {...card} navigate={navigate} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;