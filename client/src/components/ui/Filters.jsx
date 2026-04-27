import { useState, useEffect } from "react";

function Filters({ search, setSearch, filter, setFilter, mode }) {
  // Unified status options for both complaints and violations
  const statusOptions = ["All", "Pending", "In Progress", "Resolved", "Rejected"];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Mode Indicator */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          Showing:
        </p>
        <span
          className={`
            text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full font-semibold
            transition-all duration-300 whitespace-nowrap
            ${mode === "complaints"
              ? "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/30 dark:to-indigo-800/30 dark:text-indigo-300"
              : "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300"
            }
          `}
        >
          {mode === "complaints" ? "📋 Complaints" : "⚠️ Violations"}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base group-focus-within:text-indigo-500 transition">
          🔍
        </span>
        <input
          type="text"
          placeholder={`Search ${mode === "complaints" ? "complaints" : "violations"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full pl-9 pr-9 py-2 sm:py-2.5
            rounded-xl
            bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700
            text-sm sm:text-base
            shadow-sm
            focus:outline-none
            focus:ring-2 focus:ring-indigo-500
            focus:border-indigo-400
            hover:border-indigo-300
            transition-all duration-200
            dark:text-white dark:placeholder-gray-400
          "
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition text-sm sm:text-base"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Filter with Chips */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Status
        </p>
        
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {statusOptions.map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
                  px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium
                  transition-all duration-200
                  ${isActive
                    ? mode === "complaints"
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : "bg-red-600 text-white shadow-md scale-105"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }
                `}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Filters
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              setSearch("");
              setFilter("All");
            }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Reset All
          </button>
          <button
            onClick={() => setFilter("Pending")}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => setFilter("Resolved")}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
          >
            ✅ Resolved
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-center pt-2 border-t border-gray-100 dark:border-gray-800">
        💡 Tip: Click on status chips to filter quickly
      </p>
    </div>
  );
}

export default Filters;