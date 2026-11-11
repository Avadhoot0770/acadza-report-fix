import fs from "fs";
import path from "path";
import { loadQuestions, loadReports, loadTaxonomy, getQuestionsMap } from "../src/lib/data";
import { triageAllReports } from "../src/lib/triage/engine";
import { TriageResultSchema } from "../src/types";

console.log("=== EXECUTING TRIAGE ENGINE ON ALL 44 REPORTS ===");

const taxonomy = loadTaxonomy();
const questions = loadQuestions();
const reports = loadReports();
const questionsMap = getQuestionsMap();

console.log(`Loaded ${reports.length} reports and ${questions.length} questions.`);

// Run engine
const results = triageAllReports(reports, { taxonomy, questionsMap });

// Validate every single result against Zod schema
console.log("\nValidating results with Zod TriageResultSchema...");
for (const r of results) {
  TriageResultSchema.parse(r);
}
console.log(`[PASS] All ${results.length} triage results strictly adhere to the schema.`);

// Check output path
const outputPath = path.join(process.cwd(), "results.json");
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
console.log(`\n[SUCCESS] Successfully written ${results.length} results to ${outputPath}`);

// Print summary metrics
const verdictsCount: Record<string, number> = {};
const repairsCount: Record<string, number> = {};
const routesCount: Record<string, number> = {};

for (const r of results) {
  verdictsCount[r.verdict] = (verdictsCount[r.verdict] || 0) + 1;
  if (r.repair) {
    repairsCount[r.repair] = (repairsCount[r.repair] || 0) + 1;
  }
  routesCount[r.route] = (routesCount[r.route] || 0) + 1;
}

console.log("\n--- VERDICT DISTRIBUTION ---");
for (const [k, v] of Object.entries(verdictsCount)) {
  console.log(`  ${k}: ${v}`);
}

console.log("\n--- REPAIR DISTRIBUTION ---");
for (const [k, v] of Object.entries(repairsCount)) {
  console.log(`  ${k}: ${v}`);
}

console.log("\n--- ROUTE DISTRIBUTION ---");
for (const [k, v] of Object.entries(routesCount)) {
  console.log(`  ${k}: ${v}`);
}
