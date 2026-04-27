import { useEffect, useState, useRef } from "react";
import socket from "../socket";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../apis/notification.api";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState(null);
  const dropdownRef = useRef(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchNotifications();

    if (userId) socket.emit("join", userId);

    socket.on("notification", (data) => {
      setPopup(data);
      fetchNotifications();
      setTimeout(() => setPopup(null), 4000);
    });

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("notification");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="relative">
        {/* Bell Button – responsive size */}
        <button
          onClick={() => setOpen(!open)}
          className="relative group focus:outline-none"
          aria-label="Notifications"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center transition group-hover:scale-105 border border-slate-200">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1"
              />
            </svg>
          </div>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center shadow animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown – fully responsive */}
        {open && (
          <div
            ref={dropdownRef}
            className="
              fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2
              w-[calc(100%-2rem)] sm:w-80 md:w-96
              bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
              rounded-2xl shadow-2xl border border-white dark:border-slate-700
              overflow-hidden z-50 animate-slide-down
              sm:fixed sm:static
            "
          >
            {/* Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                🔔 Notifications
                {unread > 0 && (
                  <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </h3>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-red-500 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scroll">
              {notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="text-3xl sm:text-4xl mb-2 opacity-50">📭</div>
                  <p className="text-xs sm:text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`p-3 sm:p-4 cursor-pointer transition ${
                      !n.is_read
                        ? "bg-red-50 border-l-4 border-red-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm">🔔</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">
                          {n.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 break-words">
                          {n.message}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mt-2 animate-pulse flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Popup – responsive */}
      {popup && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-auto z-50 animate-slide-up">
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-3 sm:p-4 max-w-[calc(100vw-2rem)] sm:max-w-sm">
            <p className="font-semibold text-sm sm:text-base">{popup.title}</p>
            <p className="text-xs sm:text-sm">{popup.message}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}

export default NotificationBell;