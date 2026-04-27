import { useEffect, useState } from "react";
import AdminLayout from "../admin_components/AdminLayout";
import {
  getAllUsers,
  createUser,
  toggleBlockUser,
  deleteUser,
} from "../apis/adminUser.api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "department",
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers(role);
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      showToast("Please fill all fields (name, email, phone, password)", "error");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      showToast("Phone number must be 10 digits", "error");
      return;
    }
    try {
      await createUser({ ...form, role });
      showToast(`${role} created successfully!`, "success");
      setForm({ name: "", email: "", phone: "", password: "", role: "department" });
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Error creating user", "error");
    }
  };

  const handleBlockToggle = async (id, currentBlockedStatus) => {
    const action = currentBlockedStatus ? "unblock" : "block";
    const confirmed = window.confirm(`Are you sure you want to ${action} this user?`);
    if (!confirmed) return;
    try {
      await toggleBlockUser(id);
      showToast(`User ${action}ed successfully`, "success");
      fetchUsers();
    } catch (err) {
      showToast(`Failed to ${action} user`, "error");
    }
  };

  const handleDeleteUser = async (id, name) => {
    const confirmed = window.confirm(`Delete user "${name}"? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteUser(id);
      showToast("User deleted successfully", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to delete user", "error");
    }
  };

  const roleTabs = [
    { id: "user", label: "👥 Users", gradient: "from-blue-500 to-indigo-500" },
    { id: "department", label: "🏢 Departments", gradient: "from-purple-500 to-pink-500" },
    { id: "admin", label: "👑 Admins", gradient: "from-indigo-500 to-purple-500" },
  ];

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-green-50/90 border border-green-200 text-green-800"
                : "bg-red-50/90 border border-red-200 text-red-800"
            }`}
          >
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-slate-500 text-sm">Manage users, departments, and administrators</p>
                </div>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="group flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap gap-3 rounded-2xl bg-white/50 backdrop-blur-sm p-2 shadow-sm border border-white/30">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRole(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  role === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md scale-105`
                    : "bg-white/70 text-slate-700 hover:bg-white hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  {role === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </span>
              </button>
            ))}
          </div>

          {/* Create User Form (Admin & Department only) */}
          {(role === "admin" || role === "department") && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 transition-all hover:shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg">➕</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Create New {role === "admin" ? "Admin" : "Department"}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g., John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCreateUser}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
                >
                  <span>✨</span> Create {role === "admin" ? "Admin" : "Department"}
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-slate-200 rounded flex-1"></div>
                    <div className="h-9 bg-slate-200 rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users Grid */}
          {!loading && (
            <>
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm py-16 text-center shadow-sm border border-white/30">
                  <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 shadow-inner">
                    <span className="text-5xl">📭</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-700">No {role}s found</h3>
                  {(role === "admin" || role === "department") && (
                    <p className="mt-2 text-slate-500">Use the form above to create one</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/30"
                    >
                      {/* Top accent bar */}
                      <div
                        className={`h-1.5 ${
                          user.is_blocked
                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                            : user.role === "admin"
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : user.role === "department"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        }`}
                      />

                      <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl shadow-inner">
                            {user.role === "admin" ? "👑" : user.role === "department" ? "🏢" : "👤"}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition">
                              {user.name}
                            </h3>
                            <p className="text-sm text-slate-500 break-all">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <span>📞</span> {user.phone}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              user.role === "admin"
                                ? "bg-indigo-50 text-indigo-700"
                                : user.role === "department"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              user.is_blocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${user.is_blocked ? "bg-rose-500" : "bg-emerald-500"}`}
                            />
                            {user.is_blocked ? "Blocked" : "Active"}
                          </span>
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleBlockToggle(user.id, user.is_blocked)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              user.is_blocked
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                            }`}
                          >
                            {user.is_blocked ? "🔓 Unblock" : "🔒 Block"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all duration-200"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminUsers;