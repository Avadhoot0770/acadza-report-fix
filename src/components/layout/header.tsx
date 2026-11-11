"use client";

import { Bell, Search, ShieldAlert, Sparkles } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export function Header({
  title = "Faculty Triage Queue",
  subtitle = "Review, verify, and resolve incoming student-reported errors across JEE & NEET question sets.",
  onSearchChange,
  searchValue = "",
}: HeaderProps) {
  return (
    <header className="h-16 px-8 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">
          {title}
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64 md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by question ID, topic, or comment..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Live Safety Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Strict Safety Guard Mode</span>
        </div>
      </div>
    </header>
  );
}
