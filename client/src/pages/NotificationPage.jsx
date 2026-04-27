import Layout from "../components/Layout";
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

  // Mark one as read
  const markOneRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark selected as read
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

  // Mark all as read
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

  // Delete one
  const deleteOne = async (id) => {
    try {
      await deleteNotification(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete selected
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
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-transparent">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header - Glass */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
                    Notifications
                  </h1>
                  <p className="text-white/60 text-sm mt-1">
                    Stay updated with your civic alerts
                  </p>
                </div>
              </div>
              <button
                onClick={markAllRead}
                disabled={actionLoading || notifications.length === 0}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" /> Mark all read
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400 text-red-200 p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Action bar (when items selected) */}
          {selected.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex flex-wrap gap-3 border border-white/20">
              <button
                onClick={markSelectedRead}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition"
              >
                <CheckCircle size={16} /> Mark read ({selected.length})
              </button>
              <button
                onClick={deleteSelected}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition"
              >
                <Trash2 size={16} /> Delete ({selected.length})
              </button>
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
              >
                {selected.length === notifications.length ? "Deselect all" : "Select all"}
              </button>
            </div>
          )}

          {/* Select all toggle (when no selection) */}
          {notifications.length > 0 && selected.length === 0 && (
            <div className="flex justify-end">
              <button
                onClick={selectAll}
                className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition"
              >
                <Square className="w-4 h-4" /> Select all
              </button>
            </div>
          )}

          {/* Notification list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-white/70" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20">
              <Bell className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white">No notifications</h3>
              <p className="text-white/50 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group backdrop-blur-md rounded-xl p-4 transition-all duration-200 border ${
                    n.is_read
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-indigo-500/20 border-indigo-400/30 hover:bg-indigo-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(n.id)}
                      className="mt-1 text-white/70 hover:text-white"
                    >
                      {selected.includes(n.id) ? (
                        <CheckSquare className="w-5 h-5 text-indigo-300" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    {/* Icon */}
                    <div className="mt-1">
                      {n.is_read ? (
                        <MailOpen className="w-5 h-5 text-white/40" />
                      ) : (
                        <Mail className="w-5 h-5 text-indigo-300 animate-pulse" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="font-semibold text-white">{n.title}</p>
                      <p className="text-white/70 text-sm mt-1">{n.message}</p>
                      <p className="text-white/40 text-xs mt-2 flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {formatDate(n.created_at)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 items-center">
                      {!n.is_read && (
                        <button
                          onClick={() => markOneRead(n.id)}
                          className="text-green-400 hover:text-green-300 transition"
                          title="Mark as read"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteOne(n.id)}
                        className="text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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