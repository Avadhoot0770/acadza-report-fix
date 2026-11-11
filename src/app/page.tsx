import {
  getQuestionsMap,
  getReportsGroupedByQuestion,
  loadQuestions,
  loadReports,
  loadTaxonomy,
} from "@/lib/data";
import { getQuestionPayload } from "@/types";
import { QuestionGroupViewModel } from "@/components/queue/report-queue-table";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  const questions = loadQuestions();
  const reports = loadReports();
  const taxonomy = loadTaxonomy();
  const groupedReports = getReportsGroupedByQuestion();
  const questionsMap = getQuestionsMap();

  // Build View Models for each reported question
  const groups: QuestionGroupViewModel[] = [];
  let highPriorityCount = 0;
  let autoApplyEligibleCount = 0;

  for (const [qid, reps] of Array.from(groupedReports.entries())) {
    const q = questionsMap.get(qid);
    if (!q) continue;

    const payload = getQuestionPayload(q);
    const ansStr = Array.isArray(payload.answer)
      ? `[${payload.answer.join(", ")}]`
      : String(payload.answer ?? "");

    // Determine initial priority based on critical keywords
    const isAnswerKey = reps.some((r) =>
      /ans(?:wer)?|key|wrong ans/i.test(r.comment)
    );
    const isDuplicate = reps.length > 1;

    let priority: "critical" | "high" | "normal" | "low" = "normal";
    let priorityReason = "Standard review";

    if (isAnswerKey) {
      priority = "critical";
      priorityReason = "Possible answer key mismatch";
      highPriorityCount++;
    } else if (isDuplicate) {
      priority = "high";
      priorityReason = `${reps.length} students reported this item`;
    }

    // Check potential auto-apply count based on cosmetic defect keywords
    if (
      reps.some((r) =>
        /spelling|typo|frac|code|tag|bracket|neet 2019/i.test(r.comment)
      )
    ) {
      autoApplyEligibleCount++;
    }

    groups.push({
      questionId: qid,
      question: q,
      reports: reps,
      subject: q.subject,
      chapter: q.chapter,
      questionType: q.questionType,
      answerKey: ansStr,
      isDuplicate,
      priority,
      priorityReason,
    });
  }

  // Sort groups: Critical first, then Multi-report, then alphabetical by subject
  groups.sort((a, b) => {
    const priorityWeight = { critical: 3, high: 2, normal: 1, low: 0 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return b.reports.length - a.reports.length;
  });

  return (
    <DashboardClient
      groups={groups}
      totalReports={reports.length}
      uniqueQuestions={groups.length}
      duplicateGroupsCount={groups.filter((g) => g.isDuplicate).length}
      highPriorityCount={highPriorityCount}
      autoApplyEligibleCount={autoApplyEligibleCount}
    />
  );
}
