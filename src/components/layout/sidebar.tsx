"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  FileQuestion,
  History,
  Layers,
  LayoutDashboard,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  reportCount?: number;
  questionCount?: number;
}

export function Sidebar({ reportCount = 44, questionCount = 43 }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Triage Console",
      href: "/",
      icon: LayoutDashboard,
      badge: reportCount,
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      name: "Question Bank",
      href: "/questions",
      icon: FileQuestion,
      badge: questionCount,
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      name: "Taxonomy & Rules",
      href: "/taxonomy",
      icon: Layers,
    },
    {
      name: "Audit History",
      href: "/audit",
      icon: History,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30">
            A
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base">
                Acadza
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
                Fix
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Faculty Triage Console</p>
          </div>
        </Link>
      </div>

      {/* Safety Policy Status Banner */}
      <div className="mx-4 my-3 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/60">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-900">Safety Guardrails Active</p>
            <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
              Strict taxonomy whitelist & closed field scopes enforced.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Faculty Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-medium text-xs shadow-sm">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              Dr. Anand Sharma
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              Senior Physics Faculty
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
