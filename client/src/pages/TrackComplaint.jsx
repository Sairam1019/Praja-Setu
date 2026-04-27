import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyComplaints, getMyViolations } from "../apis/track.api";

// ========== CONSTANTS ==========
const STEPS = ["Submitted", "Pending", "Verified", "In Progress", "Resolved"];

// ========== HELPER FUNCTIONS ==========
const getStatusStyle = (status) => {
  const styles = {
    Resolved: { bg: "bg-gradient-to-r from-emerald-500 to-green-600", icon: "✅" },
    "In Progress": { bg: "bg-gradient-to-r from-amber-500 to-orange-600", icon: "🔄" },
    Verified: { bg: "bg-gradient-to-r from-blue-500 to-indigo-600", icon: "✓" },
    Pending: { bg: "bg-gradient-to-r from-rose-500 to-pink-600", icon: "⏳" },
    Rejected: { bg: "bg-gradient-to-r from-gray-500 to-slate-600", icon: "❌" },
  };
  return styles[status] || { bg: "bg-gradient-to-r from-gray-500 to-slate-600", icon: "📌" };
};

const formatDate = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const isVideo = (url) => url?.includes(".mp4") || url?.includes("video");

// ========== PREMIUM LARGE CARD COMPONENT (no description) ==========
const PremiumCard = ({ item, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const statusStyle = getStatusStyle(item.status);
  const title = item.title || item.category || "Untitled";

  return (
    <div
      onClick={() => onClick(item.id, item.type === "violation" ? "violations" : "complaints")}
      className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-2 hover:shadow-indigo-200/20"
    >
      {/* Image Container */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
        {item.image_url && !imageError ? (
          <>
            {isVideo(item.image_url) ? (
              <video
                src={item.image_url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                muted
                loop
                autoPlay
                onError={() => setImageError(true)}
              />
            ) : (
              <img
                src={item.image_url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={title}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-400 text-sm sm:text-base mt-3">No Image</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 transition-transform duration-300 group-hover:scale-105">
          <span className={`${statusStyle.bg} text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
            <span className="text-sm sm:text-base">{statusStyle.icon}</span>
            <span className="hidden sm:inline font-medium">{item.status}</span>
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <h3 className="text-white font-bold text-base sm:text-lg md:text-xl drop-shadow-lg line-clamp-2">
            {title}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-5 flex justify-between items-center border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3 sm:gap-4">
          {item.vote_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors group-hover:text-amber-600">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {item.vote_count}
            </div>
          )}
          {item.created_at && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(item.created_at)}
            </div>
          )}
        </div>
        <div className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-1.5 font-medium">
          View Details
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN TRACK COMPONENT ==========
function TrackComplaint() {
  const [mode, setMode] = useState("complaints");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");

      const data = mode === "complaints" 
        ? await getMyComplaints() 
        : await getMyViolations();

      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const handleCardClick = (id, type) => {
    navigate(`/track-detail/${type}/${id}`);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Layout>
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
          
          {/* Header Section */}
          <div className="mb-10 sm:mb-12 animate-slideDown">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-1.5 h-10 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full"></div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                    Track {mode === "complaints" ? "Complaints" : "Violations"}
                  </h1>
                </div>
                <p className="text-slate-300 text-base mt-3">
                  Click on any card to view full details and status updates
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex gap-3 p-1.5 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <button
                  onClick={() => setMode("complaints")}
                  className={`px-5 sm:px-7 py-2.5 rounded-lg font-semibold transition-all duration-300 transform flex items-center gap-2 text-sm sm:text-base ${
                    mode === "complaints"
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md scale-105"
                      : "bg-transparent text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Complaints
                </button>
                <button
                  onClick={() => setMode("violations")}
                  className={`px-5 sm:px-7 py-2.5 rounded-lg font-semibold transition-all duration-300 transform flex items-center gap-2 text-sm sm:text-base ${
                    mode === "violations"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md scale-105"
                      : "bg-transparent text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Violations
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-5 bg-red-500/20 backdrop-blur-sm border-l-4 border-red-500 rounded-xl animate-slideDown">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-200 text-sm sm:text-base">{error}</p>
                <button
                  onClick={fetchData}
                  className="text-red-200 hover:text-red-100 font-semibold text-sm sm:text-base"
                >
                  Retry →
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-indigo-400"></div>
            </div>
          )}

          {/* Content Grid */}
          {!loading && !error && (
            <>
              {items.length === 0 ? (
                <div className="text-center py-24 animate-fadeIn">
                  <div className="text-8xl mb-5 animate-bounce">📭</div>
                  <p className="text-slate-300 text-xl font-medium">No {mode} found</p>
                  <p className="text-slate-400 text-base mt-2">
                    Your submitted {mode} will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="animate-scaleIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <PremiumCard item={item} onClick={handleCardClick} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </Layout>
  );
}

export default TrackComplaint;