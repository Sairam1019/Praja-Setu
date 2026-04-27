import { forwardRef } from "react";

const ComplaintCard = forwardRef(
  ({ c, onSelect, vote, votingId, selected }, ref) => {
    const isSelected = selected?.id === c.id;

    // Determine type: complaint (default) or violation
    const isViolation = c.type === "violation" || c.is_violation === true;

    // Status config (unified)
    const getStatusConfig = (status) => {
      const configs = {
        Pending: { bg: "bg-amber-50", text: "text-amber-700", icon: "⏳", border: "border-amber-200" },
        "In Progress": { bg: "bg-blue-50", text: "text-blue-700", icon: "🔄", border: "border-blue-200" },
        Resolved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "✅", border: "border-emerald-200" },
        Rejected: { bg: "bg-rose-50", text: "text-rose-700", icon: "❌", border: "border-rose-200" },
      };
      return configs[status] || configs.Pending;
    };
    const statusConfig = getStatusConfig(c.status);

    // Priority config
    const getPriorityStyle = (priority) => {
      const styles = {
        High: { bg: "bg-rose-50", text: "text-rose-600", icon: "🔴" },
        Medium: { bg: "bg-orange-50", text: "text-orange-600", icon: "🟠" },
        Low: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "🟢" },
      };
      return styles[priority] || { bg: "bg-gray-100", text: "text-gray-600", icon: "⚪" };
    };
    const priorityStyle = getPriorityStyle(c.priority);

    return (
      <div
        ref={ref}
        onClick={() => onSelect(c)}
        className={`
          group relative
          p-4 sm:p-5
          mb-3
          cursor-pointer
          rounded-2xl
          border-2
          transition-all duration-300 ease-out
          ${isSelected
            ? `bg-gradient-to-br ${
                isViolation
                  ? "from-rose-50 to-rose-100/80 border-rose-400 shadow-lg scale-[1.02]"
                  : "from-indigo-50 to-indigo-100/80 border-indigo-400 shadow-lg scale-[1.02]"
              }`
            : `bg-white/90 backdrop-blur-sm ${
                isViolation
                  ? "border-rose-200 hover:border-rose-300 hover:shadow-xl hover:-translate-y-1"
                  : "border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1"
              }`
          }
          dark:bg-slate-800/90 dark:border-slate-700
          dark:hover:border-indigo-500
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isViolation ? "bg-rose-100 dark:bg-rose-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}
              `}
            >
              <span className="text-lg">{isViolation ? "⚠️" : "📋"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`
                  font-semibold text-base sm:text-lg
                  leading-tight line-clamp-1
                  ${isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-gray-800 dark:text-gray-200"}
                  group-hover:text-indigo-600 dark:group-hover:text-indigo-400
                `}
              >
                {c.title || c.category || "Untitled"}
              </p>
              {c.address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  📍 {c.address.split(",")[0]}
                </p>
              )}
            </div>
          </div>
          <div
            className={`${statusConfig.bg} ${statusConfig.text} px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap shadow-sm`}
          >
            <span>{statusConfig.icon}</span>
            <span className="hidden xs:inline">{c.status}</span>
          </div>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 ml-12">
          {c.category && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              <span>{c.category}</span>
            </div>
          )}
          {c.priority && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
            >
              <span>{priorityStyle.icon}</span>
              <span>{c.priority}</span>
            </div>
          )}
          {isViolation && (
            <div className="flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-xs text-rose-600 dark:text-rose-400 font-medium">
              <span>🚨</span>
              <span>Violation</span>
            </div>
          )}
        </div>

        {/* Footer – Vote + Details */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          {/* Vote Count (for both complaints AND violations) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {c.vote_count || 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">votes</span>
            </div>
          </div>

          {/* Vote Button – now for both complaints AND violations */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              vote(c.id);
            }}
            disabled={votingId === c.id}
            className={`
              px-4 py-1.5
              text-xs sm:text-sm font-medium
              rounded-xl text-white
              flex items-center gap-1.5
              transition-all duration-300
              transform active:scale-95
              shadow-sm
              ${votingId === c.id
                ? "bg-gray-400 cursor-not-allowed"
                : isViolation
                ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 hover:shadow-md"
                : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-md"
              }
            `}
          >
            {votingId === c.id ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Voting...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                Vote
              </>
            )}
          </button>
        </div>

        {/* Selected indicator badge */}
        {isSelected && (
          <div
            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
              isViolation ? "bg-rose-500" : "bg-indigo-500"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Hover glow effect */}
        <div
          className={`
            absolute inset-0 rounded-2xl
            opacity-0 group-hover:opacity-100
            transition duration-300
            pointer-events-none
            ${isViolation
              ? "shadow-[0_0_25px_rgba(244,63,94,0.2)]"
              : "shadow-[0_0_25px_rgba(99,102,241,0.15)]"
            }
          `}
        />
      </div>
    );
  }
);

export default ComplaintCard;