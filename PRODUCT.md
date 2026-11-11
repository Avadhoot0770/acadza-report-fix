# Acadza – Report → Fix | Product Brief

## 1. Who Loses the Most When a Question is Broken?
The **student who prepared correctly** loses the most. When an answer key is inverted or a diagram is missing:
1. **Psychological Impact:** A 17-year-old aspirant scoring negative marks on a correctly solved problem doubts their conceptual foundation days before JEE/NEET.
2. **Scoring Inaccuracy:** Erroneous keys lead to grading discrepancies that distort student assessment results and create widespread doubt during revision.
3. **Institutional Erosion:** If faculty ignore reports or defend erroneous keys, trust in Acadza evaporates.

**Design Reflection:** The system prioritizes answer-key errors at the top of the queue with distinct visual alerts, provides a two-step faculty confirmation checklist, and delivers empathetic, reassuring feedback to students within seconds to preserve their confidence.

## 2. Core Workflow & Decisions
- **Intelligent Deduplication:** Groups 44 reports into 39 unique question items, eliminating redundant reviews for faculty.
- **First-Principles Solver:** Deterministic STEM solver calculates derivations algebraically before comparing with stored keys.
- **Closed-Taxonomy Routing:**
  - **`auto_apply` (10 questions / 11 reports):** Low-risk, high-confidence cosmetic fixes (typos, markup leaks, unit forms).
  - **`faculty_review` (12 questions / 16 reports):** High-stakes answer-key changes, `auto: false` repairs, and unrecoverable content.
  - **`no_change` (17 questions / 17 reports):** Non-defects, misconceptions, and client platform display issues.
- **Cognitive-Load Reduction for Late-Night Faculty:** High-density review drawer with native MathML rendering, surgical `diffWords` views, solver evidence, and 1-click approvals with zero decorative animations.

## 3. What We Would Never Let AI Auto-Apply, and Why
1. **Answer Key Changes:** Regardless of 100% solver confidence, shifting scoring keys retroactively alters grades for thousands of students. Only qualified faculty may authorize grading changes.
2. **Missing Content Synthesis:** The engine must **never** hallucinate missing distractors (Option D) or unrecoverable solution derivations. If original records lack proof, `edit` is set to `null` and escalated to human authors.
3. **Curriculum & Soundness Reclassifications:** Repairs with `fields: []` (`unsound`, `syllabus`, `wrong_chapter`) require pedagogical judgment and cannot be automated.

## 4. One Metric to Watch in Week 1
**Faculty Override Rate on Auto-Apply Queue:**  
$$\text{Override Rate} = \frac{\text{Proposals Edited or Rejected in Auto-Apply Queue}}{\text{Total Auto-Apply Proposals Reviewed}}$$  
If this exceeds **2%**, it signals that the confidence threshold ($\ge 0.90$) or taxonomy scoping is overly permissive, risking automated content corruption.

## 5. One Idea Beyond This Brief
**Proactive Pre-Emptive Solver Sweep:**  
Instead of waiting for students to suffer through broken questions, run the deterministic solver and MathML structural linter across Acadza's entire 800,000-question repository as an asynchronous background worker. Identify and patch key discrepancies, missing options, and duplicate choices **before** questions reach students in live mock tests.
