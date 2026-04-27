import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function PopupCard({
  selected,
  vote,
  onClose,
  topHotspot,
  votingId
}) {
  const navigate = useNavigate();

  // ✅ ALL HOOKS FIRST – unconditionally
  const [expanded, setExpanded] = useState(false);
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // ✅ Store IDs as strings to avoid type mismatch
  const [votedItemIds, setVotedItemIds] = useState(() => {
    const stored = localStorage.getItem("votedItems");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // ✅ useEffect BEFORE conditional return
  useEffect(() => {
    setOptimisticVoteCount(null);
    setVoteError(null);
  }, [selected?.id]);

  // ✅ Early return AFTER all hooks
  if (!selected || !selected.id) return null;

  const isTop = topHotspot?.id === selected?.id;
  const isViolation =
    selected?.type === "violation" ||
    selected?.is_violation === true ||
    selected?.category === "Violation";

  // Priority styles
  const getPriorityStyle = (priority) => {
    const styles = {
      High: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", icon: "🔴" },
      Medium: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", icon: "🟠" },
      Low: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", icon: "🟢" },
    };
    return styles[priority] || { bg: "bg-gray-100", text: "text-gray-600", icon: "⚪" };
  };
  const priorityStyle = getPriorityStyle(selected.priority);

  const statusStyle =
    selected?.status === "Resolved"
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
      : selected?.status === "Pending"
      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
      : selected?.status === "In Progress"
      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";

  const description = selected.description || "";
  const shouldTruncate = description.length > 100 && !expanded;
  const displayDescription = shouldTruncate
    ? description.slice(0, 100) + "..."
    : description;

  const displayVoteCount = optimisticVoteCount !== null 
    ? optimisticVoteCount 
    : (selected.vote_count || 0);

  const isVoting = votingId === selected.id;
  
  // ✅ Convert ID to string for consistent comparison
  const idStr = String(selected.id);
  const hasVoted = votedItemIds.has(idStr);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVote = async () => {
    if (isVoting) return;
    if (hasVoted) {
      showToast("You already voted on this issue", "warning");
      return;
    }
    
    const newCount = displayVoteCount + 1;
    setOptimisticVoteCount(newCount);
    setVoteError(null);
    
    try {
      await vote(selected.id);
      // ✅ Store ID as string
      const newVotedSet = new Set(votedItemIds);
      newVotedSet.add(idStr);
      setVotedItemIds(newVotedSet);
      localStorage.setItem("votedItems", JSON.stringify([...newVotedSet]));
      showToast("Vote recorded! Thanks for your feedback.", "success");
    } catch (err) {
      setOptimisticVoteCount(null);
      setVoteError("Vote failed. Please try again.");
      setTimeout(() => setVoteError(null), 3000);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
          <div className={`
            px-4 py-2 rounded-full shadow-lg text-sm font-medium
            ${toast.type === "success" ? "bg-green-500 text-white" :
              toast.type === "warning" ? "bg-amber-500 text-white" :
              "bg-blue-500 text-white"}
          `}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="
        absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[1000]
        w-[calc(100%-2rem)] sm:w-[90%] max-w-md
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
        rounded-2xl
        border border-white/20 dark:border-slate-700/50
        shadow-2xl
        overflow-hidden
        animate-slide-up
      ">
        <div className={`h-1 w-full ${isViolation ? "bg-gradient-to-r from-rose-500 to-red-600" : "bg-gradient-to-r from-indigo-500 to-purple-600"}`} />

        <div className="px-4 sm:px-5 py-4 flex flex-col gap-3">
          {/* HEADER */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isViolation ? "bg-rose-100 dark:bg-rose-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}`}>
                <span className="text-base">{isViolation ? "⚠️" : "📋"}</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-white leading-tight line-clamp-2">
                {selected.title || selected.category || "Untitled"}
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl leading-none transition transform hover:scale-110">
              ✕
            </button>
          </div>

          {/* BADGES */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${statusStyle}`}>
              {selected.status}
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${priorityStyle.bg} ${priorityStyle.text}`}>
              {priorityStyle.icon} {selected.priority}
            </span>
            {isTop && (
              <span className="text-red-500 text-xs font-semibold animate-pulse flex items-center gap-1">
                🔥 Trending Area
              </span>
            )}
          </div>

          {/* CATEGORY */}
          {selected.category && !isViolation && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              <span>{selected.category}</span>
            </div>
          )}

          {/* LOCATION */}
          {selected.address && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{selected.address.split(",")[0]}</span>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {displayDescription}
            </p>
            {description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mt-1 hover:underline"
              >
                {expanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="font-bold text-gray-800 dark:text-gray-200">{displayVoteCount}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">votes</span>
              </div>
              {voteError && (
                <span className="text-xs text-red-500 animate-pulse">⚠️ {voteError}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isVoting}
                onClick={handleVote}
                className={`
                  px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium
                  text-white shadow-md hover:shadow-lg
                  transition-all duration-200 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-1
                  ${isViolation
                    ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                  }
                `}
              >
                {isVoting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Voting...</span>
                  </>
                ) : hasVoted ? (
                  "✅ Voted"
                ) : (
                  "Vote"
                )}
              </button>

              <button
                onClick={() => {
                  navigate("/complaint", {
                    state: { item: selected, mode: isViolation ? "violations" : "complaints" }
                  });
                }}
                className="
                  px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium
                  bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-slate-700
                  shadow-sm hover:shadow-md
                  transition-all duration-200 active:scale-95
                "
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PopupCard;