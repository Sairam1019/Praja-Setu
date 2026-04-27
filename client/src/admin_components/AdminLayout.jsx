import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

/* 🔥 ADDED */
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import NotificationBell from "../components/NotificationBell";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ================= SOCKET JOIN (ADDED) ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const user = jwtDecode(token);
        socket.emit("join", user.id.toString());
      } catch (err) {
        console.log("Socket join error");
      }
    }
  }, []);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen, isMobile]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const menu = [
    { name: "Dashboard", path: "/admin_dash", icon: "📊" },
    { name: "Users", path: "/admin_users", icon: "👥" },
    { name: "Assign Tasks", path: "/admin_tasks", icon: "📋" },
    { name: "Departments", path: "/admin_dept", icon: "🏢" },
    { name: "Resolved", path: "/admin_resolved", icon: "✅", activeIcon: "✅" },
    { name: "Admin-Activity", path: "/admin-Activity/:id", icon: "🏢" },
    { name: "Notifications", path: "/admin_notifications/:id", icon: "🔔" }  // Alerts & updates
   
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">

      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
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
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AdminHub
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

      {/* MAIN */}
      <div className={`flex flex-col min-h-screen ${!isMobile ? 'md:ml-72' : ''}`}>

        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">

            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100"
            >
              ☰
            </button>

            <div className="hidden md:flex text-sm">
              Admin / {menu.find(item => item.path === location.pathname)?.name}
            </div>

            {/* 🔥 ADDED NOTIFICATION */}
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>

          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <footer className="text-center text-xs text-gray-500 py-4">
          © AdminHub
        </footer>

      </div>
    </div>
  );
}

export default AdminLayout;