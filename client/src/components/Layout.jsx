import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProfile } from "../apis";
import logo from "../assets/dashboard/logo.png";
import bg from "../assets/dashboard/background.jpeg";
import socket from "../socket";
import { jwtDecode } from "jwt-decode"; 
import NotificationBell from "../components/NotificationBell";
import Chatbot from "../components/Chatbot";


function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const isMapPage = location.pathname === "/map-view";
  const isChatPage = location.pathname === "/chat";   // ✅ detect chat page

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const user = jwtDecode(token);
    if (user?.id) {
      socket.emit("join", user.id.toString());
    }
  } catch {
    console.log("Socket join error");
  }
}, []);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const fetchUser = async () => {
    try {
      const data = await getProfile();
      console.log("PROFILE RESPONSE:", data);
      setUserName(data?.user?.name || "");
    } catch {
      console.log("Header user fetch error");
    }
  };

  fetchUser();
}, []);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠", activeIcon: "🏠" },
    { name: "My Profile", path: "/profile", icon: "👤", activeIcon: "👤" },
    { name: "Report Complaint", path: "/report-issue", icon: "📝", activeIcon: "📝" },
    { name: "Report Violation", path: "/report-violation", icon: "⚠️", activeIcon: "⚠️" },
    { name: "Track Issues", path: "/track-complaint", icon: "📍", activeIcon: "📍" },
    { name: "Map View", path: "/map-view", icon: "🗺️", activeIcon: "🗺️" },
    { name: "Resolved Issues", path: "/resolved", icon: "✅", activeIcon: "✅" },
    { name: "All Reports", path: "/complaint", icon: "📋", activeIcon: "📋" },
    { name: "AI Assistant", path: "/chat", icon: "🤖", activeIcon: "🤖" },
    { name: "Notifications", path: "/notifications/:id", icon: "🔔", activeIcon: "🔔" }   // ✅ fixed path
  ];

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="fixed inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        {/* Header (unchanged) */}
        <header className="
          fixed top-0 left-0 right-0 z-50
          h-[70px] md:h-[80px]
          bg-slate-900/80 backdrop-blur-md
          border-b border-white/10
          shadow-2xl
          px-4 sm:px-6 lg:px-8
          flex items-center justify-between
          text-white
        ">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-2xl p-2 rounded-xl hover:bg-white/10 transition-all duration-200 focus:outline-none active:scale-95"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div className="bg-gradient-to-br from-white/20 to-white/5 p-1.5 rounded-xl shadow-lg">
              <img src={logo} alt="Praja Setu" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg object-cover" />
            </div>
          </div>

          <h1 className="
            absolute left-1/2 -translate-x-1/2
            text-xl sm:text-2xl md:text-3xl font-bold
            bg-gradient-to-r from-white via-white/90 to-white/70
            bg-clip-text text-transparent
            drop-shadow-lg
            whitespace-nowrap
          ">
            Praja Setu
          </h1>

          <div className="flex items-center gap-3 sm:gap-5">
            <NotificationBell />
            <div
              onClick={() => navigate("/profile")}
              className="
                group relative
                w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11
                bg-white
                border border-slate-200
                rounded-full flex items-center justify-center
                shadow-md
                hover:scale-105 hover:shadow-xl
                transition-all duration-200
                active:scale-95
              "
            >
              <span className="text-slate-700 dark font-semibold text-sm md:text-base">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </header>

        {/* Main body */}
        <div className="flex flex-1 pt-[70px] md:pt-[80px] overflow-hidden">
          {/* Mobile overlay */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed top-[70px] md:top-[80px] left-0 z-50
            h-[calc(100vh-70px)] md:h-[calc(100vh-80px)]
            w-72
            bg-slate-900/90 backdrop-blur-xl
            border-r border-white/10
            text-white
            flex flex-col
            transform transition-transform duration-300 ease-out
            shadow-2xl
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            <div className="flex-1 overflow-y-auto py-6">
              <div className="px-4 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-2" />
              </div>
              <nav>
                <ul className="space-y-1 px-3">
                  {menu.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={index}>
                        <button
                          onClick={() => {
                            navigate(item.path);
                            if (isMobile) setSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3
                            rounded-xl transition-all duration-200
                            group
                            ${isActive
                              ? "bg-gradient-to-r from-indigo-600/80 to-indigo-700/80 shadow-lg border-l-4 border-indigo-400"
                              : "hover:bg-white/10"
                            }
                          `}
                        >
                          <span className={`text-xl transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}>
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium tracking-wide">{item.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            <div className="p-4 border-t border-white/10 mt-auto">
              <button
                onClick={handleLogout}
                className="
                  w-full group
                  bg-red-500/80 hover:bg-red-600
                  backdrop-blur-sm
                  py-2.5 rounded-xl
                  text-white font-semibold text-sm
                  transition-all duration-200
                  active:scale-95 shadow-lg
                  flex items-center justify-center gap-2
                "
              >
                <span className="text-lg transition-transform group-hover:rotate-12">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className={`
            flex-1
            transition-all duration-300
            ${sidebarOpen && !isMobile ? "md:ml-72" : "ml-0"}
            ${isMapPage ? "h-full overflow-hidden" : "overflow-y-auto"}
          `}>
            {isMapPage ? (
              <div className="w-full h-full">{children}</div>
            ) : (
              <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">{children}</div>
            )}
          </main>
        </div>

        {/* Footer (only for non-map pages) */}
        {!isMapPage && (
          <footer className="
            bg-slate-900/80 backdrop-blur-md
            border-t border-white/10
            text-center py-3 text-sm text-gray-400
          ">
            © 2026 Praja Setu — Empowering Citizens
          </footer>
        )}

        {/* ✅ CHATBOT – hidden on /chat page only */}
        {!isChatPage && <Chatbot />}
      </div>
    </div>
  );
}

export default Layout;