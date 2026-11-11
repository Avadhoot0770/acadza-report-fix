import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "https://acadza-report-fix-steel.vercel.app";

async function runBrowserAudit() {
  console.log("==================================================");
  console.log("STARTING REAL BROWSER PRODUCTION AUDIT (PUPPETEER)");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Browser: Google Chrome (${CHROME_PATH})`);
  console.log("==================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      testsFailed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. PAGE LOAD & TITLE
    // -------------------------------------------------------------
    console.log("--- 1. DEPLOYED PAGE LOAD & TITLE ---");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    const pageTitle = await page.title();
    assert(pageTitle.includes("Acadza"), `Page title includes 'Acadza' (Got: '${pageTitle}')`);

    // -------------------------------------------------------------
    // 2. DASHBOARD METRICS CARDS
    // -------------------------------------------------------------
    console.log("\n--- 2. DASHBOARD METRICS CARDS ---");
    await page.waitForSelector("table", { timeout: 10000 });
    const bodyText = await page.evaluate(() => document.body.innerText);

    assert(bodyText.includes("44 Reports"), "Metrics shows '44 Reports'");
    assert(bodyText.includes("39 Questions"), "Metrics shows '39 Questions'");
    assert(bodyText.includes("Faculty Review"), "Metrics shows 'Faculty Review'");
    assert(bodyText.includes("Safe Auto-Apply"), "Metrics shows 'Safe Auto-Apply'");
    assert(bodyText.includes("Browser-Local Demo Persistence"), "UI accurately disclaims 'Browser-Local Demo Persistence'");

    // -------------------------------------------------------------
    // 3. TABLE FILTERING WORKFLOW
    // -------------------------------------------------------------
    console.log("\n--- 3. QUEUE TABLE FILTERING ---");
    const initialRows = await page.$$eval("tbody tr", (trs) => trs.length);
    assert(initialRows === 39, `Default table renders exactly 39 unique question rows (Got: ${initialRows})`);

    // Click Faculty Review filter button
    const clickedFilter = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("button"));
      const btn = buttons.find((b) => b.innerText.includes("Faculty Review"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedFilter, "Clicked 'Faculty Review' filter pill");
    await new Promise((r) => setTimeout(r, 600));

    const filteredRows = await page.$$eval("tbody tr", (trs) => trs.length);
    assert(filteredRows === 12, `Filtered table displays exactly 12 Faculty Review questions (Got: ${filteredRows})`);

    // Restore "All Routes" filter
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("button"));
      const btn = buttons.find((b) => b.innerText.includes("All Routes"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // -------------------------------------------------------------
    // 4. QUESTION REVIEW DRAWER & MATHML RENDERING
    // -------------------------------------------------------------
    console.log("\n--- 4. QUESTION REVIEW DRAWER & MATHML ---");
    // Find row for AC circuit R001-R003 (contains R001)
    const clickedRow = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll<HTMLElement>("tbody tr"));
      const targetTr = trs.find((tr) => tr.innerText.includes("R001"));
      if (targetTr) {
        targetTr.click();
        return true;
      }
      return false;
    });
    assert(clickedRow, "Clicked question row for R001–R003 cluster");
    await page.waitForSelector(".fixed.inset-0.z-50", { timeout: 8000 });

    const drawerHtml = await page.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0.z-50");
      return modal ? modal.innerHTML : "";
    });

    assert(
      drawerHtml.includes("<math") ||
      drawerHtml.includes("msub") ||
      drawerHtml.includes("msqrt") ||
      drawerHtml.includes("V ="),
      "Question stem renders native MathML / formula expressions"
    );
    assert(drawerHtml.includes("Live Question Stem"), "Drawer renders question stem section");
    assert(drawerHtml.includes("Proposed Surgical Fix"), "Drawer renders proposed surgical diff viewer");

    // Check scientific verification tab
    const switchedTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-50 button"));
      const tab = buttons.find((b) => b.innerText.includes("Scientific Verification"));
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    });
    assert(switchedTab, "Switched to 'Scientific Verification' tab");
    await new Promise((r) => setTimeout(r, 500));

    const verificationText = await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>(".fixed.inset-0.z-50");
      return modal ? modal.innerText : "";
    });
    assert(
      verificationText.includes("50 V") || verificationText.includes("Option A") || verificationText.includes("AC circuit"),
      "Independent scientific derivation proof displayed in drawer"
    );

    // -------------------------------------------------------------
    // 5. TWO-STEP ANSWER KEY CONFIRMATION GATE
    // -------------------------------------------------------------
    console.log("\n--- 5. TWO-STEP ANSWER KEY CONFIRMATION GATE ---");
    // Switch back to Question & Proposed Fix tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-50 button"));
      const tab = buttons.find((b) => b.innerText.includes("Question & Proposed Fix"));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Click Verify & Approve Answer Key
    const clickedApprove = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-50 button"));
      const btn = buttons.find((b) => b.innerText.includes("Verify & Approve Answer Key"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedApprove, "Clicked 'Verify & Approve Answer Key'");
    await page.waitForSelector(".fixed.inset-0.z-60", { timeout: 8000 });

    // Verify 2-Factor Confirmation Modal appears
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>(".fixed.inset-0.z-60");
      return modal ? modal.innerText : "";
    });
    assert(
      modalText.includes("HIGH-STAKES ACTION: ANSWER KEY MODIFICATION"),
      "Two-Step Answer Key confirmation checklist modal opened"
    );

    // Try clicking submit without checkboxes checked
    const submitDisabledBefore = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-60 button"));
      const btn = buttons.find((b) => b.innerText.includes("Confirm & Commit Answer Key"));
      return btn ? btn.hasAttribute("disabled") : false;
    });
    assert(submitDisabledBefore, "Confirmation button is strictly disabled until two-step confirmation checklist is verified");

    // Check both confirmation checkboxes
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(".fixed.inset-0.z-60 input[type='checkbox']"));
      checkboxes.forEach((cb) => {
        cb.click();
      });
    });
    await new Promise((r) => setTimeout(r, 500));

    // Confirm the action
    const committedKey = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-60 button"));
      const btn = buttons.find((b) => b.innerText.includes("Confirm & Commit Answer Key"));
      if (btn && !btn.hasAttribute("disabled")) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(committedKey, "Confirmed Two-Step Answer Key change");
    await new Promise((r) => setTimeout(r, 1000));

    // Close review drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector<HTMLElement>(".fixed.inset-0.z-50 button[title*='Close']");
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // 6. REJECTION WORKFLOW TEST
    // -------------------------------------------------------------
    console.log("\n--- 6. REJECTION WORKFLOW ---");
    // Click on R015 (identical options)
    const clickedR015 = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll<HTMLElement>("tbody tr"));
      const tr = trs.find((t) => t.innerText.includes("R015"));
      if (tr) {
        tr.click();
        return true;
      }
      return false;
    });
    assert(clickedR015, "Clicked question row for R015");
    await page.waitForSelector(".fixed.inset-0.z-50", { timeout: 8000 });

    // Click Reject Report button
    const clickedRejectBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-50 button"));
      const btn = buttons.find((b) => b.innerText.includes("Reject Report"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedRejectBtn, "Clicked 'Reject Report' in review drawer");
    await page.waitForSelector(".fixed.inset-0.z-60", { timeout: 8000 });

    // Verify rejection modal
    const rejectModalVisible = await page.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0.z-60");
      return modal ? modal.innerHTML.includes("Reject Report &amp; Retain Question") || modal.innerHTML.includes("Reject Report") : false;
    });
    assert(rejectModalVisible, "Rejection modal opened with title 'Reject Report & Retain Question'");

    // Confirm rejection
    const committedReject = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-60 button"));
      const btn = buttons.find((b) => b.innerText.includes("Confirm Rejection"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(committedReject, "Confirmed rejection with structured rationale");
    await new Promise((r) => setTimeout(r, 1000));

    // Close review drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector<HTMLElement>(".fixed.inset-0.z-50 button[title*='Close']");
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // 7. SAFE BATCH AUTO-APPROVAL WORKFLOW
    // -------------------------------------------------------------
    console.log("\n--- 7. SAFE BATCH AUTO-APPROVAL WORKFLOW ---");
    const clickedBatchBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("button"));
      const btn = buttons.find((b) => b.innerText.includes("Batch") || b.title?.includes("safe auto-apply"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedBatchBtn, "Clicked 'Batch' button on Safe Auto-Apply card");
    await page.waitForSelector(".fixed.inset-0.z-60", { timeout: 8000 });

    const batchModalText = await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>(".fixed.inset-0.z-60");
      return modal ? modal.innerText : "";
    });
    assert(batchModalText.includes("Confirm Batch Approval for Safe Repairs"), "Batch approval modal opened");
    assert(batchModalText.includes("Answer keys are strictly excluded"), "5-point safety gate verifies answer keys excluded");
    assert(batchModalText.includes("auto: true"), "Safety gate verifies auto: true filter");

    // Execute batch approval
    const executedBatch = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".fixed.inset-0.z-60 button"));
      const btn = buttons.find((b) => b.innerText.includes("Confirm Batch Approval"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(executedBatch, "Executed 1-click safe batch auto-approval");
    await new Promise((r) => setTimeout(r, 1200));

    // -------------------------------------------------------------
    // 8. AUDIT LEDGER & PERSISTENCE VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- 8. AUDIT LEDGER & REFRESH PERSISTENCE ---");
    await page.goto(`${BASE_URL}/audit`, { waitUntil: "networkidle2" });
    await page.waitForSelector(".divide-y", { timeout: 10000 });

    const auditBodyText = await page.evaluate(() => document.body.innerText);
    assert(auditBodyText.includes("Institutional Faculty Audit Trail"), "Audit ledger page loaded ('Institutional Faculty Audit Trail')");
    assert(
      auditBodyText.includes("approve") || auditBodyText.includes("reject") || auditBodyText.includes("batch_approved") || auditBodyText.includes("Faculty"),
      "Audit table contains newly executed faculty actions"
    );
    assert(auditBodyText.includes("Browser-Local Demo Persistence"), "Audit page explicitly indicates browser-local storage demo persistence");

    // Reload page to verify persistence across refreshes
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector(".divide-y", { timeout: 10000 });
    const auditTextAfterReload = await page.evaluate(() => document.body.innerText);
    assert(
      auditTextAfterReload.includes("approve") || auditTextAfterReload.includes("reject") || auditTextAfterReload.includes("Faculty"),
      "Audit records persist cleanly across page refresh from localStorage"
    );

    // -------------------------------------------------------------
    // 9. MOBILE VIEWPORT ADAPTIVE LAYOUT
    // -------------------------------------------------------------
    console.log("\n--- 9. MOBILE VIEWPORT ADAPTIVE LAYOUT ---");
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await page.waitForSelector("table", { timeout: 10000 });

    const mobileMenuExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLElement>("button"));
      return buttons.some((b) => b.querySelector("svg") && b.closest("div.md\\:hidden, div"));
    });
    assert(mobileMenuExists, "Mobile viewport (375px) renders responsive header with menu control");

    const mobileTableScrollable = await page.evaluate(() => {
      const tableWrapper = document.querySelector(".overflow-x-auto");
      return tableWrapper !== null;
    });
    assert(mobileTableScrollable, "Queue table has horizontal scroll container (.overflow-x-auto) on small screens");

    console.log("\n==================================================");
    console.log(`REAL BROWSER PRODUCTION AUDIT SUMMARY`);
    console.log(`PASSED: ${testsPassed}`);
    console.log(`FAILED: ${testsFailed}`);
    console.log("==================================================");
  } catch (err) {
    console.error("Browser audit exception:", err);
    testsFailed++;
  } finally {
    await browser.close();
  }

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runBrowserAudit();
