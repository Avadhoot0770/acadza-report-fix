import { loadQuestions, loadReports } from "@/lib/data";
import { getQuestionPayload } from "@/types";
import { Header } from "@/components/layout/header";
import { FileQuestion, AlertCircle, CheckCircle } from "lucide-react";

export default function QuestionsBankPage() {
  const questions = loadQuestions();
  const reports = loadReports();
  const reportedQids = new Set(reports.map((r) => r.questionId));

  return (
    <>
      <Header
        title="Question Bank Ingestion"
        subtitle={`All ${questions.length} production questions loaded from questions.json, including unreported bonus questions.`}
      />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Database Records ({questions.length} Questions)
            </h2>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-900">{reportedQids.size}</span> Reported •{" "}
              <span className="font-bold text-blue-600">{questions.length - reportedQids.size}</span> Unreported (Bonus Candidates)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Question ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Subject & Chapter</th>
                  <th className="py-3 px-4">Keyed Answer</th>
                  <th className="py-3 px-4">Report Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => {
                  const payload = getQuestionPayload(q);
                  const isReported = reportedQids.has(q._id);
                  const ansStr = Array.isArray(payload.answer)
                    ? `[${payload.answer.join(", ")}]`
                    : String(payload.answer ?? "");

                  return (
                    <tr key={q._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {q._id}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-slate-600">
                        {q.questionType}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{q.subject}</div>
                        <div className="text-slate-500 text-[11px]">{q.chapter}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {ansStr}
                      </td>
                      <td className="py-3 px-4">
                        {isReported ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Reported
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unreported (Bonus)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
