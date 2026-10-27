import {
  revenueSummary, filterSqlRows, createCaseQueue, rowsToCsv, copyRows,
  migrationStep, initialMigrationState, cloudTransition, initialCloudState,
  filterControls, controlAction, CONTROL_ROWS, stakeholderView, resolveFinding,
  FINDINGS, automationStep, initialAutomationState,
} from "./demo-model.mjs";

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
function status(section, message) { const node = section.querySelector("[data-demo-status]"); if (node) node.textContent = message; }
function write(section, name, text) { const node = section.querySelector(`[data-output="${name}"]`); if (node) node.textContent = String(text); }
function field(section, name) { return section.querySelector(`[data-field="${name}"]`)?.value ?? ""; }
function guard(section, action) { try { action(); } catch (error) { status(section, error instanceof Error ? error.message : "Check the sample inputs and try again."); } }
function button(text, data, value) { const node = element("button", text); node.type = "button"; node.setAttribute(data, value); return node; }
function clicked(event, attribute) { return event.target?.closest?.(`[${attribute}]`) ?? null; }

function ranges(section) {
  section.querySelectorAll('input[type="range"][data-field]').forEach(control => {
    let label = control.parentElement.querySelector(".range-value");
    if (!label) { label = element("span", "", "range-value"); control.parentElement.insertBefore(label, control); }
    label.textContent = control.value;
    control.setAttribute("aria-valuetext", control.value);
  });
}

function table(section, output, headers, rows, caption) {
  const target = section.querySelector(`[data-output="${output}"]`);
  if (!target) return;
  const grid = element("table");
  const title = element("caption", caption, "sr-only"); grid.append(title);
  const head = element("thead"), headRow = element("tr");
  headers.forEach(header => { const cell = element("th", header); cell.scope = "col"; headRow.append(cell); });
  head.append(headRow); grid.append(head);
  const body = element("tbody");
  rows.forEach(row => {
    const line = element("tr");
    row.forEach(value => { const cell = element("td"); if (value instanceof Node) cell.append(value); else cell.textContent = String(value ?? ""); line.append(cell); });
    body.append(line);
  });
  if (!rows.length) { const line = element("tr"), cell = element("td", "No sample records match this filter."); cell.colSpan = headers.length; line.append(cell); body.append(line); }
  grid.append(body); target.replaceChildren(grid);
}

function downloadCsv(content, filename) {
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob), link = element("a");
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function utilities(section, reset, exportData) {
  const tools = element("div", undefined, "demo-stepper demo-utilities");
  tools.append(button("Reset sample", "data-reset-demo", "true"));
  if (exportData) tools.append(button("Export sample CSV", "data-export-demo", "true"));
  section.append(tools);
  section.addEventListener("click", event => guard(section, () => {
    if (clicked(event, "data-reset-demo")) { reset(); status(section, "Sample reset. Changes stay in this page only."); }
    if (clicked(event, "data-export-demo")) { downloadCsv(exportData(), `${section.dataset.demo ?? section.dataset.caseDemo}-sample.csv`); status(section, "Sample CSV downloaded locally."); }
  }));
}

function dashboard(section) {
  const defaults = [...section.querySelectorAll("input[data-field]")].map(input => [input, input.value, input.max]);
  let result;
  const render = () => guard(section, () => {
    const active = Number(field(section, "active")), matched = section.querySelector('[data-field="matched"]');
    matched.max = String(active); if (Number(matched.value) > active) matched.value = String(active);
    result = revenueSummary({ active, matched: field(section, "matched"), charge: field(section, "charge") });
    ranges(section); write(section, "exceptions", result.exceptions); write(section, "exposure", money(result.exposure)); write(section, "priority", result.priority);
    status(section, `${result.exceptions} sample missing billables`);
  });
  section.addEventListener("input", render); render();
  utilities(section, () => { defaults.forEach(([input, value, max]) => { input.max = max; input.value = value; }); render(); }, () => rowsToCsv([result]));
}

function sql(section) {
  const defaults = [...section.querySelectorAll("[data-field]")].map(input => [input, input.value]);
  let rows = [];
  const render = () => guard(section, () => {
    rows = filterSqlRows(field(section, "check"), field(section, "minimum")); ranges(section);
    table(section, "table", ["Account", "Issue", "Exposure", "Next action"], rows.map(row => [row.account, row.issue, money(row.exposure), row.action]), "Sample billing audit results");
    status(section, `${rows.length} sample result${rows.length === 1 ? "" : "s"} · no SQL executed`);
  });
  section.addEventListener("input", render); section.addEventListener("change", render); render();
  utilities(section, () => { defaults.forEach(([input, value]) => { input.value = value; }); render(); }, () => rowsToCsv(rows));
}

function migration(section) {
  let state = initialMigrationState();
  const render = () => {
    const target = section.querySelector('[data-output="progress"]');
    if (target) { const progress = element("progress"); progress.max = 100; progress.value = state.progress; progress.setAttribute("aria-label", "Sample migration progress"); target.replaceChildren(progress); }
    write(section, "log", state.message); status(section, state.status);
  };
  section.addEventListener("click", event => { const control = clicked(event, "data-action"); if (control) guard(section, () => { state = migrationStep(state, control.dataset.action); render(); }); });
  render(); utilities(section, () => { state = initialMigrationState(); render(); }, () => rowsToCsv([state]));
}

function crud(section) {
  const queue = createCaseQueue(), form = section.querySelector("form");
  const owner = form?.elements.namedItem("owner"); if (owner) { owner.required = true; owner.maxLength = 80; }
  const render = () => {
    table(section, "records", ["Case", "Owner", "Issue", "Priority", "Status", "Next action", "Actions"], queue.list().map(row => {
      const actions = element("div", undefined, "control-card-actions");
      const resolve = button(row.status === "Resolved" ? "Resolved" : "Resolve", "data-resolve-case", row.caseId); resolve.disabled = row.status === "Resolved";
      actions.append(resolve, button("Delete", "data-delete-case", row.caseId));
      return [row.caseId, row.owner, row.issue, row.priority, row.status, row.next, actions];
    }), "Local sample operations cases");
    status(section, `${queue.list().filter(row => row.status !== "Resolved").length} open sample cases`);
  };
  section.addEventListener("submit", event => {
    event.preventDefault(); guard(section, () => { queue.add({ owner: form.elements.namedItem("owner").value, issue: form.elements.namedItem("issue").value, priority: form.elements.namedItem("priority").value }); render(); });
  });
  section.addEventListener("click", event => guard(section, () => {
    const resolve = clicked(event, "data-resolve-case"), remove = clicked(event, "data-delete-case");
    if (resolve) { queue.resolve(resolve.dataset.resolveCase); render(); }
    if (remove) {
      if (remove.dataset.confirmDelete === "true") { queue.remove(remove.dataset.deleteCase); render(); }
      else { remove.dataset.confirmDelete = "true"; remove.textContent = "Confirm delete"; status(section, "Press Confirm delete to remove this local sample case. Reset restores the starting data."); }
    }
  }));
  render(); utilities(section, () => { queue.reset(); form.reset(); render(); }, () => queue.export());
}

function cloud(section) {
  let state = initialCloudState();
  const render = () => { write(section, "uptime", state.response); write(section, "region", state.region); write(section, "backup", state.recovery); status(section, state.status); };
  section.addEventListener("click", event => { const control = clicked(event, "data-action"); if (control) guard(section, () => { state = cloudTransition(state, control.dataset.action); render(); }); });
  render(); utilities(section, () => { state = initialCloudState(); render(); }, () => rowsToCsv([state]));
}

function controls(section) {
  let rows = copyRows(CONTROL_ROWS), view = "all";
  const render = () => {
    const target = section.querySelector('[data-output="controlTable"]');
    const cards = filterControls(rows, view).map(row => {
      const card = element("article", undefined, "control-review-card"), top = element("div", undefined, "control-card-top");
      top.append(element("strong", row.id), element("span", money(row.amount))); card.append(top, element("p", `${row.account} · ${row.reason}`));
      const definitions = element("dl");
      [["Evidence", row.evidence], ["Owner", row.owner], ["Status", row.status], ["Age", `${row.age} days`]].forEach(([label, value]) => { const line = element("div"); line.append(element("dt", label), element("dd", value)); definitions.append(line); });
      card.append(definitions);
      const actions = element("div", undefined, "control-card-actions");
      for (const [label, action] of [["Attach evidence", "attach"], ["Escalate", "escalate"], ["Resolve", "resolve"]]) {
        const control = button(label, "data-control-action", action); control.dataset.controlId = row.id;
        control.disabled = row.status === "Resolved" || (action === "attach" && row.evidence === "Attached"); actions.append(control);
      }
      card.append(actions); return card;
    });
    target?.replaceChildren(...(cards.length ? cards : [element("p", "No sample adjustments match this filter.", "demo-log")]));
    status(section, `${rows.filter(row => row.status !== "Resolved").length} open sample control items`);
  };
  section.addEventListener("click", event => guard(section, () => {
    const filter = clicked(event, "data-control-view"), action = clicked(event, "data-control-action");
    if (filter) { view = filter.dataset.controlView; render(); }
    if (action) { rows = controlAction(rows, action.dataset.controlId, action.dataset.controlAction); render(); }
  }));
  render(); utilities(section, () => { rows = copyRows(CONTROL_ROWS); view = "all"; render(); }, () => rowsToCsv(filterControls(rows, view)));
}

function stakeholder(section) {
  let rows = copyRows(FINDINGS), view = "all";
  const render = () => {
    const visible = stakeholderView(rows, view), groups = view === "all" ? ["finance", "operations", "it"] : [view];
    const lanes = groups.map(group => {
      const lane = element("section", undefined, "stakeholder-lane"); lane.append(element("h4", group === "it" ? "IT" : group[0].toUpperCase() + group.slice(1)));
      visible.forEach(row => {
        const card = element("article", undefined, "stakeholder-ticket"); card.append(element("strong", row.id), element("span", row.finding), element("p", row[group]), element("small", `Owner: ${row.owner} · ${row.status}`));
        const resolve = button(row.status === "Resolved" ? "Resolved" : "Resolve", "data-resolve-finding", row.id); resolve.disabled = row.status === "Resolved"; card.append(resolve); lane.append(card);
      });
      if (!visible.length) lane.append(element("p", "No sample findings match this view."));
      return lane;
    });
    section.querySelector('[data-output="stakeholderTable"]')?.replaceChildren(...lanes); status(section, `${visible.length} visible sample findings`);
  };
  section.addEventListener("click", event => guard(section, () => {
    const filter = clicked(event, "data-view"), resolve = clicked(event, "data-resolve-finding");
    if (filter) { view = filter.dataset.view; render(); }
    if (resolve) { rows = resolveFinding(rows, resolve.dataset.resolveFinding); render(); }
  }));
  render(); utilities(section, () => { rows = copyRows(FINDINGS); view = "all"; render(); }, () => rowsToCsv(stakeholderView(rows, view)));
}

function automation(section) {
  let state = initialAutomationState();
  const send = section.querySelector('[data-action="send"]'); if (send) send.textContent = "Prepare report";
  const render = () => {
    const runs = state.runs.map(run => { const line = element("div", undefined, `automation-step${run.status === "Waiting" ? "" : " done"}`); line.append(element("span", run.step), element("strong", run.status), element("em", run.rows)); return line; });
    section.querySelector('[data-output="runs"]')?.replaceChildren(...runs); write(section, "runLog", state.log); status(section, state.stage === 3 ? "Sample report prepared locally · no email sent" : "Local sample pipeline");
  };
  section.addEventListener("click", event => { const control = clicked(event, "data-action"); if (control) guard(section, () => { state = automationStep(state, control.dataset.action); render(); }); });
  render(); utilities(section, () => { state = initialAutomationState(); render(); }, () => rowsToCsv(state.runs));
}

export function initDemos(root = document) {
  const setups = { dashboard, sql, migration, crud, cloud, controls, stakeholder, automation };
  root.querySelectorAll("[data-demo], [data-case-demo]").forEach(section => {
    if (section.dataset.demoInitialized) return;
    section.dataset.demoInitialized = "true";
    const note = element("p", "Sample data · browser-only simulation. Nothing connects to a live database, cloud account, or email service.", "demo-note");
    section.querySelector(".demo-header")?.after(note);
    const output = section.querySelector("[data-demo-status]"); if (output) { output.setAttribute("role", "status"); output.setAttribute("aria-live", "polite"); }
    const setup = setups[section.dataset.demo ?? section.dataset.caseDemo]; if (setup) setup(section);
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initDemos(), { once: true });
  else initDemos();
}
