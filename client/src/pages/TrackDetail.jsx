import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMyComplaints,
  getMyViolations,
  getTrackingById,
} from "../apis/track.api";

// ========== CONSTANTS ==========
const STEPS = ["Submitted", "Pending", "Verified", "In Progress", "Resolved"];

const STEP_ICONS = {
  Submitted: "📝",
  Pending: "⏳",
  Verified: "✓",
  "In Progress": "🔄",
  Resolved: "✅",
};

// ========== HELPER FUNCTIONS ==========
const getStatusStyle = (status) => {
  const styles = {
    Resolved: { bg: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400", icon: "✅", circleBg: "bg-emerald-500/30" },
    "In Progress": { bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400", icon: "🔄", circleBg: "bg-amber-500/30" },
    Verified: { bg: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400", icon: "✓", circleBg: "bg-blue-500/30" },
    Pending: { bg: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-400", icon: "⏳", circleBg: "bg-rose-500/30" },
    Submitted: { bg: "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400", icon: "📝", circleBg: "bg-gray-500/30" },
  };
  return styles[status] || styles.Pending;
};

const getPriorityIcon = (priority) => {
  const icons = { High: "🔴", Medium: "🟡", Low: "🟢" };
  return icons[priority] || "📌";
};

const getPriorityBgColor = (priority) => {
  if (priority === "High") return "bg-red-50/80 dark:bg-red-900/20";
  if (priority === "Medium") return "bg-amber-50/80 dark:bg-amber-900/20";
  if (priority === "Low") return "bg-emerald-50/80 dark:bg-emerald-900/20";
  return "bg-gray-50/80 dark:bg-gray-800/20";
};

const formatDate = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return ""; }
};

const formatDateTime = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

const truncateText = (text, maxLength = 180) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const isVideo = (url) => url?.includes(".mp4") || url?.includes("video");

// ========== DESCRIPTION MODAL ==========
const DescriptionModal = ({ description, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-5 border-b border-indigo-100 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Full Description</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition hover:rotate-90">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6 overflow-y-auto max-h-[60vh] custom-scroll">
        <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap">{description}</p>
      </div>
      <div className="border-t border-indigo-100 dark:border-slate-700 p-4 bg-indigo-50/50 dark:bg-slate-800/50">
        <button onClick={onClose} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 hover:scale-[1.02]">
          Close
        </button>
      </div>
    </div>
  </div>
);

// ========== MAIN COMPONENT ==========
export default function TrackDetail() {
  const { mode, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Fetch list of all user items for the current mode (to enable Prev/Next)
  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const data = mode === "complaints" 
          ? await getMyComplaints()
          : await getMyViolations();
        const items = Array.isArray(data.data) ? data.data : [];
        setAllItems(items);
        const idx = items.findIndex(i => i.id?.toString() === id);
        setCurrentIndex(idx);
      } catch (err) {
        console.error("Failed to fetch list:", err);
      }
    };
    if (mode) fetchAllItems();
  }, [mode, id]);

  // Fetch current item details
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const data = await getTrackingById(mode, id);
        setItem(data.item);
        setTimeline(data.timeline || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch details");
      } finally {
        setLoading(false);
      }
    };
    if (id && mode) fetchDetail();
  }, [id, mode, navigate]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: item?.title || "Complaint Details",
          text: `Check out this ${mode}: ${item?.title || item?.category}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const prevItem = allItems[currentIndex - 1];
      navigate(`/track-detail/${mode}/${prevItem.id}`);
    }
  };
  const goNext = () => {
    if (currentIndex < allItems.length - 1) {
      const nextItem = allItems[currentIndex + 1];
      navigate(`/track-detail/${mode}/${nextItem.id}`);
    }
  };

  const statusStyle = item ? getStatusStyle(item.status) : {};
  const stepIndex = item ? STEPS.indexOf(item.status) : 0;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-3 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4">😕</div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "Item not found"}</p>
            <button onClick={() => navigate("/track-complaint")} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
              Back to List
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-transparent py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Premium Glass Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-indigo-200/20">
            
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row">
              {/* Left: Image */}
              <div className="md:w-[35%] relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 group">
                <div className="aspect-[4/3] sm:aspect-video md:aspect-auto md:h-full w-full">
                  {item.image_url ? (
                    isVideo(item.image_url) ? (
                      <video src={item.image_url} controls className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <img src={item.image_url} alt={item.title || item.category} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg transform transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Right: Content */}
              <div className="md:w-[65%] p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
                {/* Title & Back & Close */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => navigate("/track-complaint")}
                      className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all duration-300 hover:scale-110 hover:-translate-x-0.5"
                      aria-label="Back to list"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <span className="text-2xl sm:text-3xl">{mode === "complaints" ? "📋" : "⚠️"}</span>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      {item.title || item.category || "Untitled"}
                    </h1>
                  </div>
                  <button onClick={() => navigate("/track-complaint")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-300 hover:rotate-90 hover:scale-110">
                    ✕
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 ${statusStyle.bg} backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-all duration-300 hover:scale-105`}>
                  <span>{statusStyle.icon}</span>
                  <span>{item.status}</span>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-3 sm:border-l-4 border-indigo-400 transition-all duration-300 hover:bg-white/50 dark:hover:bg-slate-800/60 hover:translate-x-0.5 sm:hover:translate-x-1">
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Description
                      </p>
                      {item.description.length > 180 && (
                        <button onClick={() => setShowFullDesc(true)} className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-medium hover:underline flex items-center gap-0.5 sm:gap-1 transition-all hover:translate-x-0.5">
                          Read More
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">{truncateText(item.description, 180)}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {item.category && (
                    <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                        <span className="text-indigo-500">📂</span> Category
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base">{item.category}</p>
                    </div>
                  )}
                  {item.vote_count !== undefined && (
                    <div className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                        <span className="text-amber-500">👍</span> Votes
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base">{item.vote_count}</p>
                    </div>
                  )}
                  {item.priority && (
                    <div className={`${getPriorityBgColor(item.priority)} backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                        <span className="text-red-500">⚡</span> Priority
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base capitalize flex items-center gap-0.5 sm:gap-1">
                        {getPriorityIcon(item.priority)} {item.priority}
                      </p>
                    </div>
                  )}
                  {item.created_at && (
                    <div className="bg-cyan-50/80 dark:bg-cyan-900/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:-translate-y-0.5 hover:shadow-md">
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                        <span className="text-cyan-500">📅</span> Reported
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base">{formatDate(item.created_at)}</p>
                    </div>
                  )}
                  {item.address && (
                    <div className="bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:-translate-y-0.5 hover:shadow-md col-span-2">
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                        <span className="text-purple-500">📍</span> Location
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate">{item.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Status */}
            <div className="border-t border-white/20 dark:border-slate-700/50 p-5 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-lg sm:text-xl">📊</span> Progress Status
              </h3>
              <div className="flex flex-wrap justify-between gap-1 sm:gap-2">
                {STEPS.map((step, i) => {
                  const isCompleted = i <= stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={step} className="flex-1 text-center min-w-[50px] sm:min-w-[60px] group">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg" : "bg-white/40 dark:bg-slate-800/40 text-slate-400 backdrop-blur-sm"
                      } ${isCurrent ? "ring-3 sm:ring-4 ring-emerald-300 scale-105 sm:scale-110" : ""} group-hover:scale-105 sm:group-hover:scale-110`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-base sm:text-xl">{STEP_ICONS[step]}</span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 font-medium group-hover:text-slate-800 dark:group-hover:text-slate-200">
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Timeline */}
            {timeline.length > 0 && (
              <div className="border-t border-white/20 dark:border-slate-700/50 p-5 sm:p-6 md:p-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-lg sm:text-xl">⏱️</span> Activity Timeline
                </h3>
                <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto pr-1 sm:pr-2 custom-scroll">
                  {timeline.map((t, idx) => {
                    const stepStyle = getStatusStyle(t.status);
                    return (
                      <div key={idx} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-slate-800/60 hover:translate-x-0.5 sm:hover:translate-x-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${stepStyle.circleBg} backdrop-blur-sm flex items-center justify-center shadow-md flex-shrink-0`}>
                              <span className="text-white text-sm sm:text-lg">{stepStyle.icon}</span>
                            </div>
                            <div>
                              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base">{t.status}</p>
                              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{t.message || "No additional message"}</p>
                            </div>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm whitespace-nowrap">
                            {t.created_at ? formatDateTime(t.created_at) : formatDate(t.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-white/20 dark:border-slate-700/50 p-5 sm:p-6 md:p-8 flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={goPrev}
                disabled={currentIndex <= 0}
                className={`flex-1 min-w-[80px] sm:min-w-[100px] py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                  currentIndex <= 0
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex >= allItems.length - 1}
                className={`flex-1 min-w-[80px] sm:min-w-[100px] py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                  currentIndex >= allItems.length - 1
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                Next
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button onClick={() => navigate("/track-complaint")} className="flex-1 min-w-[80px] sm:min-w-[100px] py-2 sm:py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-semibold transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-700/70 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base group">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
              <button onClick={handleShare} className="flex-1 min-w-[80px] sm:min-w-[100px] py-2 sm:py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-semibold transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-700/70 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base group">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Toast */}
      {showFullDesc && item?.description && <DescriptionModal description={item.description} onClose={() => setShowFullDesc(false)} />}
      {shareSuccess && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-slideUp z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Link copied to clipboard!
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        @media (max-width: 768px) { .custom-scroll { max-height: 200px; } }
      `}</style>
    </Layout>
  );
}