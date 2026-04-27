import { useEffect, useState } from "react";
import AdminLayout from "../admin_components/AdminLayout";
import {
  getAdminActivity,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  clearLogs
} from "../apis/adminActivity.api";

function AdminActivity() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [tab, setTab] = useState("blocked");

  const limit = 10;

  // Fetch data (blocked users + logs) using API
  const fetchData = async (resetPage = true) => {
    setLoading(true);
    try {
      const data = await getAdminActivity(resetPage ? 1 : page, limit);
      setBlockedUsers(data.blockedUsers || []);
      setLogs(data.logs || []);
      if (data.totalPages) setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // Generic action handler using API functions
  const handleAction = async (action, userId) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setActionLoading(userId);
    try {
      if (action === "block") await blockUser(userId);
      else if (action === "unblock") await unblockUser(userId);
      else if (action === "delete") await deleteUserByAdmin(userId);
      // Refresh data after action
      await fetchData();
    } catch (err) {
      console.error(`${action} error:`, err);
      alert(`Failed to ${action} user: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Delete all activity logs? This action cannot be undone.")) return;
    try {
      await clearLogs();
      await fetchData();
    } catch (err) {
      console.error("Clear logs error:", err);
      alert("Failed to clear logs");
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/70 p-5 backdrop-blur-sm shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-2.5 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">Admin Activity</h1>
                <p className="text-sm text-slate-500">Manage blocked users & activity logs</p>
              </div>
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white/50 p-2 backdrop-blur-sm">
            <button
              onClick={() => setTab("blocked")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === "blocked"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md"
                  : "bg-white/80 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              🚫 Blocked Users
            </button>
            <button
              onClick={() => setTab("logs")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === "logs"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md"
                  : "bg-white/80 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              📜 Activity Logs
            </button>
          </div>

          {/* Blocked Users Tab */}
          {tab === "blocked" && (
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/30">
              {loading && <div className="text-center py-10">Loading...</div>}
              {!loading && blockedUsers.length === 0 && (
                <div className="text-center py-10 text-slate-500">No blocked users found</div>
              )}
              {!loading && blockedUsers.length > 0 && (
                <div className="space-y-4">
                  {blockedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-100 p-2">
                          <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name || "No Name"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-600">Blocked</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction("unblock", user.id)}
                          disabled={actionLoading === user.id}
                          className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:from-emerald-500 hover:to-emerald-400"
                        >
                          {actionLoading === user.id ? "..." : "Unblock"}
                        </button>
                        <button
                          onClick={() => handleAction("delete", user.id)}
                          disabled={actionLoading === user.id}
                          className="rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:from-red-500 hover:to-red-400"
                        >
                          {actionLoading === user.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {tab === "logs" && (
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-white/30">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleClearLogs}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
                >
                  🧹 Clear Logs
                </button>
              </div>
              {loading && <div className="text-center py-10">Loading logs...</div>}
              {!loading && logs.length === 0 && (
                <div className="text-center py-10 text-slate-500">No activity logs found</div>
              )}
              {!loading && logs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-semibold text-slate-600">Action</th>
                        <th className="p-3 text-left font-semibold text-slate-600">Message</th>
                        <th className="p-3 text-left font-semibold text-slate-600">Admin</th>
                        <th className="p-3 text-left font-semibold text-slate-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              log.action.includes("BLOCK") ? "bg-rose-100 text-rose-700" :
                              log.action.includes("UNBLOCK") ? "bg-emerald-100 text-emerald-700" :
                              log.action.includes("DELETE") ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{log.message}</td>
                          <td className="p-3 text-slate-600">{log.admin_name}</td>
                          <td className="p-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminActivity;