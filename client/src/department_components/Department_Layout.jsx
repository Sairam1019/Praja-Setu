import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

/* 🔥 Existing imports – kept intact */
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import NotificationBell from "../components/NotificationBell";
import { getProfile } from "../apis/profile.api"; // ✅ centralized API

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Fetch user name for profile avatar using API utility
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const data = await getProfile(); // ✅ no raw fetch, no console.log
        setUserName(data?.user?.name || "");
      } catch (err) {
        // Silent fail – user name stays empty
        console.error("Profile fetch error:", err.message);
      }
    };
    fetchUser();
  }, []);

  /* Socket join – unchanged */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const user = jwtDecode(token);
        socket.emit("join", user.id.toString());
      } catch (err) {
        console.error("Socket join error:", err);
      }
    }
  }, []);

  // Responsive sidebar logic (unchanged)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile && sidebarOpen) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // ESC key closes sidebar on mobile
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen, isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, isMobile]);

  const menu = [
    { name: "Dashboard", path: "/dept_dash", icon: "📊" },
    { name: "My Tasks", path: "/dept_tasks", icon: "✅" },
    { name: "Work Log", path: "/dept_worklog/:id", icon: "⏱️" },
    { name: "Proof Submissions", path: "/dept_proofs/:id", icon: "📎" },
    { name: "Performance", path: "/dept_performance/:id", icon: "🎯" },
    { name: "Notifications", path: "/dept_notifications/:id", icon: "🔔" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      
      {/* Mobile backdrop overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-40
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        backdrop-blur-sm shadow-2xl
        flex flex-col justify-between
        transition-all duration-300 ease-in-out
        border-r border-white/10
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!isMobile && 'translate-x-0'}
      `}>
        <div>
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">PS</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Praja Setu
              </h1>
            </div>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <nav className="p-4 mt-4">
            <ul className="space-y-2">
              {menu.map((item, i) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={i}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 shadow-lg shadow-blue-500/20 text-white' 
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/90 to-rose-600/90 hover:from-red-600 hover:to-rose-700 py-3 transition-all duration-300 shadow-lg hover:shadow-red-500/20"
          >
            <span className="relative flex items-center justify-center gap-2 text-white font-semibold">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT AREA ========== */}
      <div className={`flex flex-col min-h-screen ${!isMobile ? 'md:ml-72' : ''}`}>

        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">

            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden md:flex text-sm text-gray-600">
              Department / {menu.find(item => item.path === location.pathname)?.name || "Dashboard"}
            </div>

            {/* Right side: notification bell + profile avatar */}
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div 
                className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md"
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            </div>

          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-500 py-4 border-t border-gray-200/50">
          © 2026 Praja Setu | Government Civic Portal
        </footer>

      </div>
    </div>
  );
}

export default Layout;