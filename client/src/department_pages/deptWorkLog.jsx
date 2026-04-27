import Layout from "../department_components/Department_Layout";
import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Download,
  TrendingUp,
  Calendar
} from "lucide-react";
import { getWorkLogs } from "../apis/worklog.api";

function WorkLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkLogs(filter);
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch work logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (action) => {
    if (action === "STATUS_UPDATE") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (action === "REJECTED") return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (action === "REMARK") return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const stats = {
    total: logs.length,
    resolved: logs.filter(l => l.action === "STATUS_UPDATE").length,
    rejected: logs.filter(l => l.action === "REJECTED").length,
    remarks: logs.filter(l => l.action === "REMARK").length
  };

  const summary = `You handled ${stats.total} activities. 
Resolved: ${stats.resolved}, Rejected: ${stats.rejected}, Remarks: ${stats.remarks}.`;

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const exportCSV = () => {
    const rows = filteredLogs.map(l =>
      `${l.task_type},${l.task_id},${l.action},"${l.message}",${l.created_at}`
    );
    const csv = "Type,TaskID,Action,Message,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work_logs.csv";
    a.click();
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Work Log</h2>
            <p className="text-gray-500">Track all your activities</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={<Activity />} />
          <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} />
          <StatCard title="Rejected" value={stats.rejected} icon={<AlertTriangle />} />
          <StatCard title="Remarks" value={stats.remarks} icon={<MessageSquare />} />
        </div>

        {/* AI SUMMARY */}
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-700">
          🧠 {summary}
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 w-full md:w-1/2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "STATUS_UPDATE", "REJECTED", "REMARK"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm ${
                  filter === f ? "bg-indigo-600 text-white" : "bg-white border"
                }`}
              >
                {f === "all" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING / ERROR */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Clock className="animate-spin w-6 h-6 text-indigo-600" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No logs found</div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedLogs).map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{date}</span>
                </div>
                <div className="space-y-3">
                  {groupedLogs[date].map((log) => (
                    <div key={log.id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                      <div className="flex items-start gap-3">
                        {getIcon(log.action)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{log.message}</p>
                          <div className="text-xs text-gray-500 mt-1 flex gap-3">
                            <span>{log.task_type.toUpperCase()}</span>
                            <span>#{log.task_id}</span>
                            <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className="text-indigo-600">{icon}</div>
    </div>
  );
}

export default WorkLog;