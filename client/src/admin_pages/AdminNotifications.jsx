import Layout from "../admin_components/AdminLayout";
import { useEffect, useState } from "react";
import {
  Bell,
  Trash2,
  CheckCircle,
  Loader2,
  MailOpen,
  Mail,
  CheckSquare,
  Square
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markSelectedNotificationsAsRead,
  deleteNotification,
  deleteSelectedNotifications
} from "../apis/notification.api";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications using API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Selection helpers
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === notifications.length) {
      setSelected([]);
    } else {
      setSelected(notifications.map((n) => n.id));
    }
  };

  // Mark as read
  const markOneRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markSelectedRead = async () => {
    if (selected.length === 0) return;
    setActionLoading(true);
    try {
      await markSelectedNotificationsAsRead(selected);
      setSelected([]);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const markAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const deleteOne = async (id) => {
    try {
      await deleteNotification(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    setActionLoading(true);
    try {
      await deleteSelectedNotifications(selected);
      setSelected([]);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Layout>
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow">
                <Bell />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            </div>
            <button
              onClick={markAllRead}
              disabled={actionLoading || notifications.length === 0}
              className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ACTION BAR */}
          {selected.length > 0 && (
            <div className="flex gap-3 bg-white p-4 rounded-xl shadow border">
              <button
                onClick={markSelectedRead}
                disabled={actionLoading}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg"
              >
                <CheckCircle size={16} /> Mark Read ({selected.length})
              </button>
              <button
                onClick={deleteSelected}
                disabled={actionLoading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg"
              >
                <Trash2 size={16} /> Delete ({selected.length})
              </button>
            </div>
          )}

          {/* SELECT ALL */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button onClick={selectAll} disabled={actionLoading}>
                {selected.length === notifications.length ? <CheckSquare /> : <Square />}
              </button>
              Select All
            </div>
          )}

          {/* LIST */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No notifications</div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm transition ${
                    n.is_read ? "bg-white" : "bg-indigo-50 border-indigo-200"
                  }`}
                >
                  {/* CHECKBOX */}
                  <button onClick={() => toggleSelect(n.id)} disabled={actionLoading}>
                    {selected.includes(n.id) ? <CheckSquare /> : <Square />}
                  </button>

                  {/* ICON */}
                  <div>
                    {n.is_read ? (
                      <MailOpen className="text-gray-400" />
                    ) : (
                      <Mail className="text-indigo-600" />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    {!n.is_read && (
                      <button
                        onClick={() => markOneRead(n.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteOne(n.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default NotificationPage;