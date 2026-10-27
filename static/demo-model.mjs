/** Illustrative sample records and browser-only transformations. No live systems. */
export const SQL_ROWS = Object.freeze([
  { account: "AC-1042", issue: "Large credit", check: "credit", exposure: 1180, action: "Manager approval" },
  { account: "AC-1187", issue: "Large credit", check: "credit", exposure: 760, action: "Validate contract" },
  { account: "AC-1214", issue: "Missing tax", check: "tax", exposure: 520, action: "Tax code review" },
  { account: "AC-1329", issue: "Duplicate adjustment", check: "duplicate", exposure: 460, action: "Reverse duplicate" },
  { account: "AC-1406", issue: "Missing approval", check: "approval", exposure: 680, action: "Attach evidence" },
].map(Object.freeze));
export const INITIAL_CASES = Object.freeze([
  { caseId: "REV-218", owner: "M. Chen", issue: "Billing gap", priority: "High", status: "Open", next: "Recover invoice line" },
  { caseId: "OPS-144", owner: "J. Patel", issue: "Client follow-up", priority: "Medium", status: "Review", next: "Confirm account status" },
].map(Object.freeze));
export const CONTROL_ROWS = Object.freeze([
  { id: "ADJ-4421", account: "AC-1042", amount: 1180, reason: "Service credit", evidence: "Missing", owner: "Store manager", age: 9, status: "Needs approval" },
  { id: "ADJ-4478", account: "AC-1187", amount: 760, reason: "Billing correction", evidence: "Attached", owner: "Finance analyst", age: 2, status: "Ready for review" },
  { id: "ADJ-4510", account: "AC-1214", amount: 245, reason: "Tax correction", evidence: "Missing", owner: "Revenue assurance", age: 14, status: "Stale review" },
  { id: "ADJ-4552", account: "AC-1329", amount: 1380, reason: "Contract exception", evidence: "Attached", owner: "Controller", age: 5, status: "High-dollar review" },
].map(Object.freeze));
export const FINDINGS = Object.freeze([
  { id: "DQ-104", finding: "Duplicate customer records", finance: "$3.2K attribution risk", operations: "Wrong account follow-up", it: "Same phone/email across 3 IDs", owner: "Operations", status: "Needs review", next: "Validate merge list" },
  { id: "DQ-118", finding: "Missing product mapping", finance: "$890 reporting variance", operations: "Store cannot classify plan", it: "SKU not mapped to billing code", owner: "IT", status: "In progress", next: "Update mapping table" },
  { id: "DQ-127", finding: "Stale cancellation date", finance: "$1.4K credit exposure", operations: "Manual correction pattern", it: "Feed delay after account close", owner: "Finance", status: "Needs evidence", next: "Attach approval note" },
].map(Object.freeze));
export const copyRows = rows => rows.map(row => ({ ...row }));

function number(value, label, maximum = 1000000) {
  if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > maximum) throw new RangeError(`${label} must be a number between 0 and ${maximum.toLocaleString("en-US")}.`);
  return Number(value);
}
function choice(value, choices, label) { if (!choices.includes(value)) throw new RangeError(`Choose a valid ${label}.`); return value; }

export function revenueSummary({ active, matched, charge }) {
  active = number(active, "Activated services", 100000);
  matched = number(matched, "Invoice matches", 100000);
  charge = number(charge, "Monthly charge");
  if (!Number.isInteger(active) || !Number.isInteger(matched)) throw new RangeError("Service and invoice counts must be whole numbers.");
  if (matched > active) throw new RangeError("Invoice matches cannot exceed activated services.");
  const exceptions = active - matched, exposure = exceptions * charge;
  return { exceptions, exposure, priority: exposure > 900 ? "Store follow-up" : exposure > 400 ? "Finance review" : "Monitor" };
}

export function filterSqlRows(check, minimum) {
  choice(check, ["credit", "tax", "duplicate", "approval"], "audit check");
  minimum = number(minimum, "Minimum exposure");
  return copyRows(SQL_ROWS.filter(row => row.check === check && row.exposure >= minimum));
}

export function rowsToCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const cell = value => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return [columns.map(cell).join(","), ...rows.map(row => columns.map(column => cell(row[column])).join(","))].join("\r\n") + "\r\n";
}

export function createCaseQueue() {
  let records = copyRows(INITIAL_CASES), nextId = 302;
  return {
    list: () => copyRows(records),
    add({ owner, issue, priority }) {
      if (typeof owner !== "string" || !owner.trim() || owner.trim().length > 80) throw new RangeError("Enter an owner name between 1 and 80 characters.");
      choice(issue, ["Billing gap", "Client follow-up", "Data correction"], "issue type");
      choice(priority, ["High", "Medium", "Low"], "priority");
      if (records.length >= 100) throw new RangeError("This local sample is limited to 100 cases. Remove a case or reset the sample.");
      const record = { caseId: `OPS-${nextId++}`, owner: owner.trim(), issue, priority, status: "Open", next: issue === "Billing gap" ? "Research invoice feed" : issue === "Data correction" ? "Validate source record" : "Contact owner" };
      records.unshift(record); return { ...record };
    },
    resolve(id) {
      const record = records.find(row => row.caseId === id);
      if (!record) return null;
      record.status = "Resolved"; record.next = "Sample follow-up logged";
      return { ...record };
    },
    remove(id) { const previous = records.length; records = records.filter(row => row.caseId !== id); return records.length !== previous; },
    reset() { records = copyRows(INITIAL_CASES); nextId = 302; return copyRows(records); },
    export: () => rowsToCsv(records),
  };
}

const MIGRATION_STEPS = {
  profile: { stage: 1, progress: 34, status: "Sample profiled", message: "Sample profile: duplicate customers, mixed phone formats, and free-text product names identified." },
  map: { stage: 2, progress: 68, status: "Sample mapped", message: "Sample mapping: customer, subscription, invoice, and product fields assigned to normalized target tables." },
  validate: { stage: 3, progress: 100, status: "Sample compared", message: "Illustrative comparison: customer counts, subscription totals, and revenue totals match the sample baseline. No database was queried." },
};
export const initialMigrationState = () => ({ stage: 0, progress: 0, status: "Ready", message: "Start with Profile to explore the sample migration sequence." });
export function migrationStep(state, action) {
  if (action === "reset") return initialMigrationState();
  if (!Object.hasOwn(MIGRATION_STEPS, action)) throw new RangeError("Choose a valid migration step.");
  const step = MIGRATION_STEPS[action];
  if (state.stage < step.stage - 1) throw new RangeError("Complete Profile, Map, and Validate in order.");
  return { ...step };
}

export const initialCloudState = () => ({ response: "142 ms", region: "AZ-A", recovery: "15 min", status: "Sample baseline" });
export function cloudTransition(state, action) {
  if (action === "reset") return initialCloudState();
  if (action === "traffic") return { ...state, response: "188 ms", status: "Illustrative peak-load scenario" };
  if (action === "failover") return { ...state, region: state.region === "AZ-A" ? "AZ-B" : "AZ-A", response: "231 ms", status: "Simulated AZ switch · no AWS connection" };
  if (action === "restore") return { ...state, recovery: "5 min", status: "Illustrative restore scenario · no data restored" };
  throw new RangeError("Choose a valid cloud scenario.");
}

export function filterControls(rows, view) {
  choice(view, ["all", "missing", "high", "stale"], "control view");
  return copyRows(rows.filter(row => view === "all" || (view === "missing" && row.evidence === "Missing") || (view === "high" && row.amount >= 1000) || (view === "stale" && (row.age >= 7 || row.status === "Stale review"))));
}
export function controlAction(rows, id, action) {
  choice(action, ["attach", "escalate", "resolve"], "control action");
  return rows.map(row => {
    if (row.id !== id) return { ...row };
    if (action === "attach") return { ...row, evidence: "Attached", status: "Ready for review" };
    if (action === "escalate") return { ...row, owner: "Controller", status: "Escalated" };
    if (row.evidence !== "Attached") throw new RangeError("Attach the sample evidence before resolving this item.");
    return { ...row, status: "Resolved" };
  });
}

export function stakeholderView(rows, view) {
  choice(view, ["all", "finance", "operations", "it"], "stakeholder view");
  return copyRows(rows.filter(row => view === "all" || row.owner.toLowerCase() === view));
}
export function resolveFinding(rows, id) { return rows.map(row => row.id === id ? { ...row, status: "Resolved", next: "Sample follow-up logged" } : { ...row }); }

export const initialAutomationState = () => ({ stage: 0, runs: [{ step: "Extract", status: "Waiting", rows: "—" }, { step: "Validate", status: "Waiting", rows: "—" }, { step: "Prepare report", status: "Waiting", rows: "—" }], log: "Start Extract to explore the local sample report pipeline." });
export function automationStep(state, action) {
  if (action === "reset") return initialAutomationState();
  const steps = { extract: 1, validate: 2, send: 3 };
  if (!Object.hasOwn(steps, action)) throw new RangeError("Choose a valid report step.");
  const stage = steps[action];
  if (state.stage < stage - 1) throw new RangeError("Extract and validate the sample before preparing its report.");
  const next = initialAutomationState();
  next.stage = stage;
  next.runs[0] = { step: "Extract", status: "Sample loaded", rows: "4,812" };
  if (stage >= 2) next.runs[1] = { step: "Validate", status: "Sample checks passed", rows: "4,812" };
  if (stage >= 3) next.runs[2] = { step: "Prepare report", status: "Prepared locally", rows: "3 sample recipients" };
  next.log = stage === 1 ? "Illustrative billing, product, and store sample records loaded in this page." : stage === 2 ? "Sample row counts, totals, and null-check results compared. No database query ran." : "A local sample report is ready to export. No email was sent and no scheduled service was contacted.";
  return next;
}
