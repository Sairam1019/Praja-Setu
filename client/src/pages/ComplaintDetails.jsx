import { useEffect, useState, useMemo, useRef } from "react";
import Layout from "../components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { getComplaints } from "../apis/complaint.api";
import { getViolations } from "../apis/violation.api";
import { voteComplaint, voteViolation } from "../apis/vote.api";

function ComplaintDetails() {
  const [mode, setMode] = useState("complaints");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // ✅ Store prefixed keys (e.g., "complaint_5", "violation_5")
  const [votedItems, setVotedItems] = useState(() => {
    const stored = localStorage.getItem("votedItems");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const navigate = useNavigate();
  const location = useLocation();
  const targetRef = useRef(null);
  const hasSelectedRef = useRef(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!mode) return;
    fetchData();
  }, [mode]);

  const fetchData = async () => {
    setError(null);
    try {
      const data = mode === "violations" ? await getViolations() : await getComplaints();
      const itemsData = Array.isArray(data) ? data : data.data || [];
      setItems(itemsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load data");
      setItems([]);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const title = (c.title || c.type || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      return (
        (title.includes(search.toLowerCase()) || desc.includes(search.toLowerCase())) &&
        (filter === "All" || c.status === filter)
      );
    });
  }, [items, search, filter]);

  // Restore selected item from router state or localStorage (backward compat)
  useEffect(() => {
    let item = null;
    let newMode = mode;
    if (location.state) {
      item = location.state.item || location.state;
      newMode = location.state.mode || "complaints";
    }
    const storedItem = localStorage.getItem("selectedItem");
    const storedMode = localStorage.getItem("selectedMode");
    if (storedItem && storedMode) {
      item = JSON.parse(storedItem);
      newMode = storedMode;
      localStorage.removeItem("selectedItem");
      localStorage.removeItem("selectedMode");
    }
    if (item) {
      setSelectedItem(item);
      setSelectedId(item.id);
      targetRef.current = item;
      if (newMode !== mode) setMode(newMode);
      setExpandedDesc(false);
    }
  }, [location.state]);

  useEffect(() => {
    if (!targetRef.current || items.length === 0) return;
    const found = items.find((c) => String(c.id) === String(targetRef.current.id));
    if (found) {
      setSelectedId(found.id);
      setSelectedItem(found);
      hasSelectedRef.current = true;
      targetRef.current = null;
    }
  }, [items]);

  const handleVote = async (id) => {
    if (votingId === id) return;

    // ✅ Create prefixed key: "complaint_123" or "violation_123"
    const voteKey = `${mode === "violations" ? "violation" : "complaint"}_${id}`;
    
    // ✅ Frontend duplicate check using prefixed key
    if (votedItems.has(voteKey)) {
      showToast("⚠️ You already voted on this issue", "warning");
      return;
    }

    setVotingId(id);
    try {
      if (mode === "violations") {
        await voteViolation(id);
      } else {
        await voteComplaint(id);
      }
      // Mark as voted using prefixed key
      const newVotedSet = new Set(votedItems);
      newVotedSet.add(voteKey);
      setVotedItems(newVotedSet);
      localStorage.setItem("votedItems", JSON.stringify([...newVotedSet]));
      showToast("✅ Vote recorded! Thanks for your feedback.", "success");
      await fetchData(); // refresh vote counts from backend
    } catch (err) {
      console.error("Vote error:", err);
      const msg = err.message || "Something went wrong";
      if (msg.toLowerCase().includes("already")) {
        // Also mark as voted if backend confirms
        const newVotedSet = new Set(votedItems);
        newVotedSet.add(voteKey);
        setVotedItems(newVotedSet);
        localStorage.setItem("votedItems", JSON.stringify([...newVotedSet]));
        showToast("⚠️ You already voted on this issue", "warning");
      } else {
        showToast(`❌ ${msg}`, "error");
      }
    } finally {
      setVotingId(null);
    }
  };

  const getMedia = (c) => c.image_url || c.media_url || c.image || c.video || "";
  const isVideo = (url) => url?.includes(".mp4") || url?.includes("video");

  const selectedComplaint =
    selectedItem ||
    (selectedId !== null ? items.find((c) => String(c.id) === String(selectedId)) : null);

  const currentIndex = filtered.findIndex((c) => String(c.id) === String(selectedId));
  const next = () => {
    if (currentIndex < filtered.length - 1) {
      const nextItem = filtered[currentIndex + 1];
      setSelectedId(nextItem.id);
      setSelectedItem(nextItem);
      setExpandedDesc(false);
    }
  };
  const prev = () => {
    if (currentIndex > 0) {
      const prevItem = filtered[currentIndex - 1];
      setSelectedId(prevItem.id);
      setSelectedItem(prevItem);
      setExpandedDesc(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedItem(null);
        setExpandedDesc(false);
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, filtered]);

  const getStatusColor = (status) => {
    if (status === "Resolved") return "bg-emerald-500/80 text-white";
    if (status === "In Progress") return "bg-amber-500/80 text-white";
    return "bg-rose-500/80 text-white";
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // ✅ Check voted status using prefixed key
  const hasVoted = (id) => {
    const voteKey = `${mode === "violations" ? "violation" : "complaint"}_${id}`;
    return votedItems.has(voteKey);
  };

  // ✅ Share functionality
  const handleShare = async () => {
    if (!selectedComplaint) return;
    const shareUrl = `${window.location.origin}/track-detail/${mode === 'complaints' ? 'complaint' : 'violation'}/${selectedComplaint.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedComplaint.title || "Complaint / Violation",
          text: `Check out this ${mode === 'complaints' ? 'complaint' : 'violation'}: ${selectedComplaint.title || ''}`,
          url: shareUrl,
        });
        showToast("Shared successfully!", "success");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error("Share failed:", err);
      showToast("Could not share. Please try again.", "error");
    }
  };

  return (
    <Layout>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
          <div className={`
            px-5 py-2.5 rounded-full shadow-lg text-sm font-medium backdrop-blur-md
            ${toast.type === "success" 
              ? "bg-green-600 text-white" 
              : toast.type === "warning" 
              ? "bg-amber-600 text-white" 
              : "bg-red-600 text-white"}
          `}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-transparent px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                {mode === "violations" ? "⚠️ Violations Dashboard" : "📋 Complaints Dashboard"}
              </h1>
              <p className="text-slate-300 text-sm mt-1">Click on any card to view full details</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white focus:outline-none"
              >
                <option className="text-gray-900">All</option>
                <option className="text-gray-900">Pending</option>
                <option className="text-gray-900">Resolved</option>
                <option className="text-gray-900">In Progress</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("complaints")}
                  className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                    mode === "complaints"
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  Complaints
                </button>
                <button
                  onClick={() => setMode("violations")}
                  className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                    mode === "violations"
                      ? "bg-red-600 text-white shadow-md scale-105"
                      : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  Violations
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-400 text-white p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {filtered.map((c) => {
              const media = getMedia(c);
              const alreadyVoted = hasVoted(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id);
                    setSelectedItem(c);
                    setExpandedDesc(false);
                  }}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-white/90 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden">
                    {media ? (
                      isVideo(media) ? (
                        <video src={media} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" muted loop autoPlay />
                      ) : (
                        <img src={media} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={c.title || c.type} />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800">
                        <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                      <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{c.title || c.type || "Untitled"}</h3>
                      <p className="text-white/70 text-sm line-clamp-2 mt-1">{truncateText(c.description, 100)}</p>
                    </div>
                  </div>
                  <div className="p-5 flex justify-between items-center border-t border-gray-200 dark:border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(c.id);
                      }}
                      disabled={votingId === c.id || alreadyVoted}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition text-sm font-medium ${
                        alreadyVoted
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default"
                          : "bg-gray-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      }`}
                    >
                      {votingId === c.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : alreadyVoted ? (
                        "✅ Voted"
                      ) : (
                        "👍 Vote"
                      )}
                      <span>{c.vote_count || 0}</span>
                    </button>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal with Share button */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-7xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSelectedItem(null);
                  setExpandedDesc(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 text-white hover:bg-indigo-600 transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 text-white hover:bg-green-600 transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedId(null);
                setSelectedItem(null);
                setExpandedDesc(false);
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/30 text-white hover:bg-red-500 transition-all duration-200 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="lg:w-1/2 bg-black/40 flex items-center justify-center p-8">
              <div className="w-full h-full max-h-[60vh] lg:max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
                {isVideo(getMedia(selectedComplaint)) ? (
                  <video src={getMedia(selectedComplaint)} className="w-full h-full object-contain" controls autoPlay />
                ) : (
                  <img src={getMedia(selectedComplaint)} className="w-full h-full object-contain" alt="preview" />
                )}
              </div>
            </div>

            <div className="lg:w-1/2 p-8 lg:p-10 overflow-y-auto space-y-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                    {selectedComplaint.title || selectedComplaint.category || "Untitled"}
                  </h2>
                  <p className="text-gray-500 text-base mt-1">ID: #{selectedComplaint.id}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                  selectedComplaint.status === "Resolved"
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedComplaint.status === "In Progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}>
                  {selectedComplaint.status}
                </span>
              </div>

              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-gray-700 dark:text-gray-300 text-lg sm:text-xl leading-relaxed">
                  {expandedDesc
                    ? selectedComplaint.description
                    : truncateText(selectedComplaint.description, 300)}
                </p>
                {selectedComplaint.description && selectedComplaint.description.length > 300 && (
                  <button
                    onClick={() => setExpandedDesc(!expandedDesc)}
                    className="mt-3 text-indigo-600 dark:text-indigo-400 text-base font-medium hover:underline"
                  >
                    {expandedDesc ? "Read less" : "Read more"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl transition-all hover:scale-[1.02] col-span-2 sm:col-span-1">
                  <p className="text-blue-600 dark:text-blue-400 text-sm">👤 Reported by</p>
                  <p className="font-semibold text-gray-800 dark:text-white text-base">
                    {selectedComplaint.reportedBy?.name || `User #${selectedComplaint.user_id || "unknown"}`}
                  </p>
                  {selectedComplaint.reportedBy?.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedComplaint.reportedBy.email}</p>
                  )}
                </div>
                {selectedComplaint.category && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl transition-all hover:scale-[1.02]">
                    <p className="text-indigo-600 dark:text-indigo-400 text-sm">📂 Category</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-base">{selectedComplaint.category}</p>
                  </div>
                )}
                {selectedComplaint.priority && (
                  <div className={`p-4 rounded-xl transition-all hover:scale-[1.02] ${
                    selectedComplaint.priority === "High"
                      ? "bg-red-50 dark:bg-red-900/30"
                      : selectedComplaint.priority === "Medium"
                      ? "bg-amber-50 dark:bg-amber-900/30"
                      : "bg-emerald-50 dark:bg-emerald-900/30"
                  }`}>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">⚡ Priority</p>
                    <p className="font-semibold flex items-center gap-1 text-base">
                      {selectedComplaint.priority === "High" ? "🔴" : selectedComplaint.priority === "Medium" ? "🟡" : "🟢"} {selectedComplaint.priority}
                    </p>
                  </div>
                )}
                {selectedComplaint.vote_count !== undefined && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl transition-all hover:scale-[1.02]">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">👍 Votes</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-base">{selectedComplaint.vote_count}</p>
                  </div>
                )}
                {selectedComplaint.address && (
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl col-span-2 transition-all hover:scale-[1.01]">
                    <p className="text-purple-600 dark:text-purple-400 text-sm">📍 Location</p>
                    <p className="text-base text-gray-700 dark:text-gray-300">{selectedComplaint.address}</p>
                    {(selectedComplaint.lat || selectedComplaint.lng) && (
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {Number(selectedComplaint.lat).toFixed(6)}, {Number(selectedComplaint.lng).toFixed(6)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleVote(selectedComplaint.id)}
                  disabled={votingId === selectedComplaint.id || hasVoted(selectedComplaint.id)}
                  className={`w-full py-3 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                    hasVoted(selectedComplaint.id)
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default shadow-none"
                      : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg hover:scale-[1.02]"
                  }`}
                >
                  {votingId === selectedComplaint.id ? "⏳ Voting..." : hasVoted(selectedComplaint.id) ? "✅ Already Voted" : "👍 Vote"}
                </button>
              </div>

              <div className="flex justify-between gap-4 pt-2">
                <button onClick={prev} disabled={currentIndex <= 0} className="flex-1 py-2.5 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium text-base disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition">
                  ← Previous
                </button>
                <button onClick={next} disabled={currentIndex >= filtered.length - 1} className="flex-1 py-2.5 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium text-base disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </Layout>
  );
}

export default ComplaintDetails;