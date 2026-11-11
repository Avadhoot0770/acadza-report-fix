import { loadQuestions } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { History, ShieldCheck, User } from "lucide-react";

export default function AuditPage() {
  const questions = loadQuestions();

  // Extract all existing historical error logs
  const historicalLogs = questions.flatMap((q) =>
    q.errorHistory.map((h) => ({
      questionId: q._id,
      subject: q.subject,
      chapter: q.chapter,
      ...h,
    }))
  );

  return (
    <>
      <Header
        title="Faculty Audit Trail"
        subtitle="Immutable ledger of faculty reviews, manual edits, and historical question fixes."
      />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit Entries ({historicalLogs.length})
            </h2>
            <span className="text-xs text-slate-500">
              Full interactive audit logging activates in Stage 4.
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {historicalLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No previous faculty audit entries found.
              </div>
            ) : (
              historicalLogs.map((log, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.questionId}
                      </span>
                      <span className="text-slate-600 font-semibold">{log.type}</span>
                    </div>
                    <span className="text-slate-400">
                      {new Date(log.at).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                    <span className="font-semibold text-slate-900">Faculty Note:</span> {log.note}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span>Actor: <strong className="text-slate-600">{log.actor}</strong></span>
                    <span>•</span>
                    <span>{log.subject} ({log.chapter})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
