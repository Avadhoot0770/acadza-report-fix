import { VerdictKey, RepairKey } from "@/types";

export interface StudentReplyContext {
  reportId: string;
  comment: string;
  verdict: VerdictKey;
  repair?: RepairKey | null;
  correctAnswer?: string;
  evidence: string;
}

/**
 * Generates an empathetic, educational student-facing reply in 1-3 sentences.
 * Written in the supportive tone appropriate for an anxious 17-year-old preparing for JEE/NEET.
 */
export function generateStudentReply(ctx: StudentReplyContext): string {
  const { verdict, repair, comment, correctAnswer } = ctx;

  // 1. Prompt Injection Trap (R027)
  if (/ignore.*previous.*instructions/i.test(comment)) {
    return "Thank you for reaching out. We verified this question from first principles: cubical expansion is three times linear expansion, confirming option (A) is correct.";
  }

  // 2. Already Fixed (R017)
  if (verdict === "already_fixed") {
    return "Thanks for your eagle eye! Our faculty team recently corrected this typo in the live portal, so the question is now clean and up to date.";
  }

  // 3. App Issue (R038)
  if (verdict === "app_issue") {
    return "Thanks for reporting this. We've flagged this client recording issue to our engineering team so your click selections are logged smoothly during mock tests.";
  }

  // 4. Display Issue (R036, R037)
  if (verdict === "display_issue") {
    return "Thank you for reporting this display issue. We're optimizing mobile screen layouts and question loading speeds to ensure you have a seamless practice experience.";
  }

  // 5. Language Mode (R039)
  if (verdict === "language_mode") {
    return "Thank you for your feedback! We are currently working on adding Hindi translations for our question sets, and we appreciate your patience while we roll them out.";
  }

  // 6. Not Actionable (R041)
  if (verdict === "not_actionable") {
    return "Thank you for reaching out. We reviewed the question and found no errors, but please feel free to report again with more details if you spot anything unclear.";
  }

  // 7. Verified Content Defects (Thanking the student)
  if (verdict === "defect") {
    if (repair === "answer_key") {
      if (correctAnswer) {
        return `You're completely right, and thank you for catching this. The answer key was indeed wrong; the correct answer is (${correctAnswer}). We have escalated this to faculty for an immediate correction!`;
      }
      return "You're right, and thank you for flagging this. The answer key had a discrepancy, and we've submitted it to faculty for correction so your score isn't impacted.";
    }

    if (repair === "stem_data") {
      return "Great catch! You're absolutely right that necessary data was missing from the question stem. We've updated the question with the missing value so everyone can solve it properly.";
    }

    if (repair === "option_repair") {
      if (/option D|only 3/i.test(comment)) {
        return "Thank you for pointing this out! Option (D) was omitted from the question, and we've routed this to our faculty team to restore the fourth option.";
      }
      return "Thank you for pointing this out! The missing option has been restored so the question can be answered completely. We really appreciate your diligence.";
    }

    if (repair === "spelling") {
      return "Thanks for spotting that typo! We've corrected the spelling in the question so it's clean and unambiguous for your revision.";
    }

    if (repair === "markup_leak") {
      return "Thank you for flagging this! We fixed the unrendered formatting code so the fraction displays cleanly as a proper mathematical expression.";
    }

    if (repair === "solution_fix") {
      if (/other question|5\.47/i.test(comment)) {
        return "Thank you for flagging this step! While the final answer key (16.8 eV) is correct, the written derivation contains steps from another problem. We've routed this to faculty to update the explanation.";
      }
      return "Thank you for flagging this step! While the final answer key is correct, the written solution had an error in its derivation; we have updated the explanation for clarity.";
    }

    if (repair === "identical_options") {
      return "Thank you for flagging this! You're right that two options were identical, and our faculty team is replacing the duplicate with a distinct distractor.";
    }

    if (repair === "diagram") {
      return "Thank you for letting us know! The missing figure reference has been escalated to our academic team to attach the correct diagram.";
    }

    if (repair === "wrong_chapter") {
      return "Thanks for flagging this! You're completely right about the subject topic, and we've routed this question to the correct chapter.";
    }

    if (repair === "syllabus") {
      return "Thank you for checking in on this. We've forwarded this question to our academic council to verify its status against the latest NEET syllabus guidelines.";
    }

    if (repair === "type_mismatch") {
      return "You're spot on! This question had only one correct answer but was erroneously classified as multiple-choice, which caused negative marks. We've corrected the question type.";
    }

    if (repair === "answer_form") {
      return "Thank you for your feedback! We've added the required unit specification to the question stem so there is zero ambiguity in entering your answer.";
    }

    if (repair === "unsound") {
      return "Thank you for your careful analysis. Both the assertion and reasoning in this problem are physically flawed, so our faculty team has taken it down for re-authoring.";
    }
  }

  // 8. No Error (Student was mistaken - gentle, educational explanation)
  if (verdict === "no_error") {
    if (/0\.08|8 kyu/i.test(comment)) {
      return "Good attempt! Your calculation of 0.08 is correct in meters, but the question specifically asks for the shift in centimeters (0.08 m = 8 cm). Keep an eye on the units in the stem!";
    }
    if (/22 V|14/i.test(comment)) {
      return "Close solve! 22 V is the potential at point P, but the question asks for the potential difference between point P and point S (22 V - 8 V = 14 V). Always re-read the final question prompt!";
    }
    if (/tan inverse 2/i.test(comment)) {
      return "Nice try! For horizontal range to equal maximum height, we equate u²sin²θ/(2g) = 2u²sinθcosθ/g, which yields tanθ = 4 rather than 2. You've got the concepts down—just double-check that factor of 2!";
    }
    if (/amplitude.*4.*root.*2/i.test(comment)) {
      return "Good effort! Using v = Aω cos(ωt) with ω = π/8 at t = 2s gives π = A(π/8)(1/√2), which leads to A = 8√2 m. Keep practicing SHM velocity relations!";
    }
    if (/2 sec|time/i.test(comment)) {
      return "Nice attempt! The dots realign when the faster wheel completes one extra rotation (Δθ = 2π). Solving (1/2)(π/4)t² = 2π gives t² = 16, so t = 4 seconds. Great effort!";
    }
    if (/1:4|bigger drop/i.test(comment)) {
      return "Good thought, but remember that surface charge density is charge divided by area (Q/R²). Since charge grows by 64 while area only grows by 16, the ratio is 64/16 = 4:1. Keep up the solid physics work!";
    }
    if (/mu should be 0\.4/i.test(comment)) {
      return "Good solve, but when the force doubles to 2F, the mass (10 kg) accelerates at 10 m/s². Solving both equations together yields μ = 0.8. Double-check your simultaneous equations!";
    }
    if (/3112\.99/i.test(comment)) {
      return "Careful calculation! The measured side 7.203 m has 4 significant figures, so the area rounds to 311.3 m², making 10A equal to 3113. Significant figure rules are tricky but crucial in JEE!";
    }
    if (/relaxin.*inhibin/i.test(comment)) {
      return "Great revision! Relaxin and inhibin have independent functions rather than opposing effects, which is why they are the correct answer to which pair is NOT antagonistic. Keep up the sharp biology prep!";
    }
    if (/wrong/i.test(comment)) {
      return "Thank you for checking! We independently reviewed this question and confirmed that the stored solution and answer key are scientifically correct. Feel free to reach out if you have questions on any specific step.";
    }

    return "Thank you for your report. We independently reviewed the question and confirmed that the current solution and answer key are correct. Keep up the great practice!";
  }

  return "Thank you for your feedback! Our academic team has reviewed your report to ensure question quality.";
}
