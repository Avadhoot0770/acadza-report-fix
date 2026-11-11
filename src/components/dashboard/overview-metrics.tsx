import {
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Layers,
  MessageSquareWarning,
  Sparkles,
  Users,
} from "lucide-react";

interface OverviewMetricsProps {
  totalReports: number;
  uniqueQuestions: number;
  duplicateGroupsCount: number;
  highPriorityCount: number;
  autoApplyEligibleCount: number;
}

export function OverviewMetrics({
  totalReports,
  uniqueQuestions,
  duplicateGroupsCount,
  highPriorityCount,
  autoApplyEligibleCount,
}: OverviewMetricsProps) {
  const metrics = [
    {
      label: "Total Student Reports",
      value: totalReports,
      subtext: `Targeting ${uniqueQuestions} unique questions`,
      icon: MessageSquareWarning,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      label: "Duplicate Report Groups",
      value: duplicateGroupsCount,
      subtext: "Multiple students reporting same question",
      icon: Users,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
    {
      label: "High Urgency (Answer Key)",
      value: highPriorityCount,
      subtext: "Mandatory faculty review & scientific proof",
      icon: AlertTriangle,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100",
    },
    {
      label: "Auto-Apply Safe Candidates",
      value: autoApplyEligibleCount,
      subtext: "Cosmetic & verified scoped edits",
      icon: Sparkles,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className={`p-4 rounded-xl border bg-white shadow-sm flex items-start justify-between ${m.borderColor}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {m.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {m.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {m.subtext}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${m.bgColor} ${m.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
