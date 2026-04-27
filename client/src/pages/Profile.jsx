import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../apis/profile.api"; // ✅ centralized API

import {
  User,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Flag
} from "lucide-react";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    complaints: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
    violations: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
    overall: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
    totalVotes: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(); // ✅ uses API utility
      setUser(data.user || {});
      setStats(data.stats || {
        complaints: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
        violations: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
        overall: { total: 0, pending: 0, resolved: 0, inProgress: 0 },
        totalVotes: 0
      });
      setComplaints(data.complaints || []);
      setViolations(data.violations || []);
    } catch (err) {
      console.error("Profile error:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-white/70 animate-pulse">Loading profile...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 text-red-400 bg-red-500/10 rounded-xl">❌ {error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white/90">Profile Overview</h2>
          <p className="text-white/70 mt-1 text-sm sm:text-base">
            Your account and activity summary
          </p>
        </div>

        {/* User Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-3">
              <User className="text-indigo-600" />
              <span className="font-medium text-gray-800">{user.name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-indigo-600" />
              <span className="text-gray-600 text-sm sm:text-base">{user.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-indigo-600" />
              <span className="text-gray-600 text-sm">
                Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
        </div>

        {/* Overall Summary */}
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            📊 Overall Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.overall.total} icon={<FileText />} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Resolved" value={stats.overall.resolved} icon={<CheckCircle />} color="bg-green-100 text-green-600" />
            <StatCard title="In Progress" value={stats.overall.inProgress} icon={<Clock />} color="bg-blue-100 text-blue-600" />
            <StatCard title="Pending" value={stats.overall.pending} icon={<AlertTriangle />} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        {/* Complaints Stats */}
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Complaints Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.complaints.total} icon={<FileText />} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Resolved" value={stats.complaints.resolved} icon={<CheckCircle />} color="bg-green-100 text-green-600" />
            <StatCard title="In Progress" value={stats.complaints.inProgress} icon={<Clock />} color="bg-blue-100 text-blue-600" />
            <StatCard title="Pending" value={stats.complaints.pending} icon={<AlertTriangle />} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        {/* Violations Stats */}
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Flag className="w-5 h-5" /> Violations Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.violations.total} icon={<Flag />} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Resolved" value={stats.violations.resolved} icon={<CheckCircle />} color="bg-green-100 text-green-600" />
            <StatCard title="In Progress" value={stats.violations.inProgress} icon={<Clock />} color="bg-blue-100 text-blue-600" />
            <StatCard title="Pending" value={stats.violations.pending} icon={<AlertTriangle />} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">📋 My Complaints</h3>
            <span className="text-gray-500 text-sm">Total: {complaints.length}</span>
          </div>
          {complaints.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No complaints found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-sm">
                <thead className="bg-gray-100 rounded-lg">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c, idx) => (
                    <tr key={c.id} className={`border-b border-gray-100 hover:bg-indigo-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                      <td className="px-4 py-3 text-gray-600">{c.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          c.status === "Resolved" ? "bg-green-100 text-green-700" :
                          c.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Violations Table */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">⚠️ My Violations</h3>
            <span className="text-gray-500 text-sm">Total: {violations.length}</span>
          </div>
          {violations.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No violations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-sm">
                <thead className="bg-gray-100 rounded-lg">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, idx) => (
                    <tr key={v.id} className={`border-b border-gray-100 hover:bg-indigo-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{v.title}</td>
                      <td className="px-4 py-3 text-gray-600">{v.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          v.status === "Resolved" ? "bg-green-100 text-green-700" :
                          v.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
    </div>
  </div>
);

export default Profile;