(function () {
    function money(value) {
        return "$" + Math.round(value).toLocaleString();
    }

    function setStatus(section, message) {
        var status = section.querySelector("[data-demo-status]");
        if (status) {
            status.value = message;
            status.textContent = message;
        }
    }

    function field(section, name) {
        var control = section.querySelector('[data-field="' + name + '"]');
        return control ? control.value : "";
    }

    function setRangeValues(section) {
        section.querySelectorAll('input[type="range"][data-field]').forEach(function (control) {
            var value = control.parentElement.querySelector(".range-value");
            if (!value) {
                value = document.createElement("span");
                value.className = "range-value";
                control.parentElement.insertBefore(value, control);
            }
            value.textContent = control.value;
        });
    }

    function output(section, name, value) {
        var target = section.querySelector('[data-output="' + name + '"]');
        if (target) {
            target.innerHTML = value;
        }
    }

    function renderRevenueDashboard(section) {
        var active = Number(field(section, "active"));
        var matchedControl = section.querySelector('[data-field="matched"]');
        if (matchedControl) {
            matchedControl.max = active;
            if (Number(matchedControl.value) > active) {
                matchedControl.value = active;
            }
        }

        setRangeValues(section);
        var matched = Number(field(section, "matched"));
        var charge = Number(field(section, "charge"));
        var exceptions = Math.max(active - matched, 0);
        var exposure = exceptions * charge;
        var priority = exposure > 900 ? "Store follow-up" : exposure > 400 ? "Finance review" : "Monitor";

        output(section, "exceptions", exceptions);
        output(section, "exposure", money(exposure));
        output(section, "priority", priority);
        setStatus(section, exceptions + " missing billables");
    }

    function renderSqlAudit(section) {
        setRangeValues(section);
        var check = field(section, "check");
        var minimum = Number(field(section, "minimum"));
        var rows = [
            { account: "AC-1042", issue: "Large credit", check: "credit", exposure: 1180, action: "Manager approval" },
            { account: "AC-1187", issue: "Large credit", check: "credit", exposure: 760, action: "Validate contract" },
            { account: "AC-1214", issue: "Missing tax", check: "tax", exposure: 520, action: "Tax code review" },
            { account: "AC-1329", issue: "Duplicate adjustment", check: "duplicate", exposure: 460, action: "Reverse duplicate" },
            { account: "AC-1406", issue: "Missing approval", check: "approval", exposure: 680, action: "Attach evidence" }
        ].filter(function (row) {
            return row.check === check && row.exposure >= minimum;
        });

        var html = "<table><thead><tr><th>Account</th><th>Issue</th><th>Exposure</th><th>Next action</th></tr></thead><tbody>";
        if (rows.length === 0) {
            html += '<tr><td colspan="4">No exceptions match this filter.</td></tr>';
        } else {
            rows.forEach(function (row) {
                html += "<tr><td>" + row.account + "</td><td>" + row.issue + "</td><td>" + money(row.exposure) + "</td><td>" + row.action + "</td></tr>";
            });
        }
        html += "</tbody></table>";

        output(section, "table", html);
        setStatus(section, rows.length + " SQL result" + (rows.length === 1 ? "" : "s"));
    }

    function setupStepper(section, steps) {
        var progress = 0;
        section.addEventListener("click", function (event) {
            var action = event.target.getAttribute("data-action");
            if (!action || !steps[action]) {
                return;
            }

            progress = steps[action].progress;
            output(section, "progress", '<span style="width: ' + progress + '%"></span>');
            output(section, "log", steps[action].message);
            setStatus(section, steps[action].status);
        });
        output(section, "progress", '<span style="width: 12%"></span>');
    }

    function setupCrud(section) {
        var records = [
            { caseId: "REV-218", owner: "M. Chen", issue: "Billing gap", priority: "High", status: "Open", next: "Recover invoice line" },
            { caseId: "OPS-144", owner: "J. Patel", issue: "Client follow-up", priority: "Medium", status: "Review", next: "Confirm account status" }
        ];
        var nextId = 302;

        function render() {
            var html = "<table><thead><tr><th>Case</th><th>Owner</th><th>Issue</th><th>Priority</th><th>Status</th><th>Next action</th><th></th></tr></thead><tbody>";
            records.forEach(function (record, index) {
                html += "<tr><td>" + record.caseId + "</td><td>" + record.owner + "</td><td>" + record.issue + "</td><td>" + record.priority + "</td><td>" + record.status + "</td><td>" + record.next + '</td><td><button type="button" data-resolve="' + index + '">Resolve</button></td></tr>';
            });
            html += "</tbody></table>";
            output(section, "records", html);
            setStatus(section, records.filter(function (record) { return record.status !== "Resolved"; }).length + " open cases");
        }

        section.addEventListener("submit", function (event) {
            event.preventDefault();
            var form = event.target;
            records.unshift({
                caseId: "OPS-" + nextId++,
                owner: form.owner.value.trim() || "New owner",
                issue: form.issue.value,
                priority: form.priority.value,
                status: "Open",
                next: form.issue.value === "Billing gap" ? "Research invoice feed" : form.issue.value === "Data correction" ? "Validate source record" : "Contact owner"
            });
            render();
        });

        section.addEventListener("click", function (event) {
            var index = event.target.getAttribute("data-resolve");
            if (index !== null) {
                records[Number(index)].status = "Resolved";
                records[Number(index)].next = "Audit trail saved";
                render();
            }
        });

        render();
    }

    function setupCloud(section) {
        var state = { response: "142 ms", region: "AZ-A", recovery: "15 min" };
        section.addEventListener("click", function (event) {
            var action = event.target.getAttribute("data-action");
            if (action === "traffic") {
                state.response = "188 ms";
                setStatus(section, "Load absorbed");
            } else if (action === "failover") {
                state.region = state.region === "AZ-A" ? "AZ-B" : "AZ-A";
                state.response = "231 ms";
                setStatus(section, "Failover complete");
            } else if (action === "restore") {
                state.recovery = "5 min";
                setStatus(section, "Restore verified");
            }
            output(section, "uptime", state.response);
            output(section, "region", state.region);
            output(section, "backup", state.recovery);
        });
    }

    function setupControlReview(section) {
        var currentView = "all";
        var adjustments = [
            {
                id: "ADJ-4421",
                account: "AC-1042",
                amount: 1180,
                reason: "Service credit",
                evidence: "Missing",
                owner: "Store manager",
                age: 9,
                status: "Needs approval"
            },
            {
                id: "ADJ-4478",
                account: "AC-1187",
                amount: 760,
                reason: "Billing correction",
                evidence: "Attached",
                owner: "Finance analyst",
                age: 2,
                status: "Ready for review"
            },
            {
                id: "ADJ-4510",
                account: "AC-1214",
                amount: 245,
                reason: "Tax correction",
                evidence: "Missing",
                owner: "Revenue assurance",
                age: 14,
                status: "Stale review"
            },
            {
                id: "ADJ-4552",
                account: "AC-1329",
                amount: 1380,
                reason: "Contract exception",
                evidence: "Attached",
                owner: "Controller",
                age: 5,
                status: "High-dollar review"
            }
        ];

        function visible(adjustment) {
            if (currentView === "missing") {
                return adjustment.evidence === "Missing";
            }
            if (currentView === "high") {
                return adjustment.amount >= 1000;
            }
            if (currentView === "stale") {
                return adjustment.age >= 7 || adjustment.status === "Stale review";
            }
            return true;
        }

        function render() {
            var rows = adjustments.filter(visible);
            var openGaps = adjustments.filter(function (adjustment) {
                return adjustment.evidence === "Missing" || adjustment.status.indexOf("review") !== -1 || adjustment.status === "Needs approval";
            }).length;
            var html = "";
            rows.forEach(function (adjustment) {
                html += '<article class="control-review-card">';
                html += '<div class="control-card-top"><strong>' + adjustment.id + '</strong><span>' + money(adjustment.amount) + '</span></div>';
                html += '<p>' + adjustment.account + ' · ' + adjustment.reason + '</p>';
                html += '<dl><div><dt>Evidence</dt><dd>' + adjustment.evidence + '</dd></div><div><dt>Owner</dt><dd>' + adjustment.owner + '</dd></div><div><dt>Status</dt><dd>' + adjustment.status + '</dd></div></dl>';
                html += '<div class="control-card-actions"><button type="button" data-attach-evidence="' + adjustment.id + '">Attach evidence</button><button type="button" data-escalate-adjustment="' + adjustment.id + '">Escalate</button></div>';
                html += '</article>';
            });
            if (!html) {
                html = '<div class="demo-log">No adjustments match this review filter.</div>';
            }

            output(section, "controlTable", html);
            setStatus(section, openGaps + " open control items");
        }

        section.addEventListener("click", function (event) {
            var view = event.target.getAttribute("data-control-view");
            var attachId = event.target.getAttribute("data-attach-evidence");
            var escalateId = event.target.getAttribute("data-escalate-adjustment");
            if (view) {
                currentView = view;
                render();
            } else if (attachId || escalateId) {
                adjustments.forEach(function (adjustment) {
                    if (adjustment.id === attachId) {
                        adjustment.evidence = "Attached";
                        adjustment.status = "Ready for review";
                    }
                    if (adjustment.id === escalateId) {
                        adjustment.owner = "Controller";
                        adjustment.status = "Escalated";
                    }
                });
                render();
            }
        });

        render();
    }

    function setupStakeholderTriage(section) {
        var currentView = "all";
        var findings = [
            {
                id: "DQ-104",
                finding: "Duplicate customer records",
                finance: "$3.2K attribution risk",
                operations: "Wrong account follow-up",
                it: "Same phone/email across 3 IDs",
                owner: "Operations",
                status: "Needs review",
                next: "Validate merge list"
            },
            {
                id: "DQ-118",
                finding: "Missing product mapping",
                finance: "$890 reporting variance",
                operations: "Store cannot classify plan",
                it: "SKU not mapped to billing code",
                owner: "IT",
                status: "In progress",
                next: "Update mapping table"
            },
            {
                id: "DQ-127",
                finding: "Stale cancellation date",
                finance: "$1.4K credit exposure",
                operations: "Manual correction pattern",
                it: "Feed delay after account close",
                owner: "Finance",
                status: "Needs evidence",
                next: "Attach approval note"
            }
        ];

        function render() {
            var visibleRows = findings.filter(function (finding) {
                return currentView === "all" || finding.owner.toLowerCase() === currentView;
            });

            var groups = currentView === "all" ? ["Finance", "Operations", "IT"] : [currentView.charAt(0).toUpperCase() + currentView.slice(1)];
            var html = "";
            groups.forEach(function (group) {
                var key = group.toLowerCase();
                html += '<section class="stakeholder-lane"><h4>' + group + '</h4>';
                visibleRows.forEach(function (finding) {
                    var detail = key === "finance" ? finding.finance : key === "operations" ? finding.operations : finding.it;
                    html += '<article class="stakeholder-ticket">';
                    html += '<strong>' + finding.id + '</strong><span>' + finding.finding + '</span>';
                    html += '<p>' + detail + '</p>';
                    html += '<small>Owner: ' + finding.owner + ' · ' + finding.status + '</small>';
                    html += '<button type="button" data-resolve-finding="' + finding.id + '">Resolve</button>';
                    html += '</article>';
                });
                html += '</section>';
            });

            output(section, "stakeholderTable", html);
            setStatus(section, visibleRows.length + " visible findings");
        }

        section.addEventListener("click", function (event) {
            var view = event.target.getAttribute("data-view");
            var resolveId = event.target.getAttribute("data-resolve-finding");
            if (view) {
                currentView = view;
                render();
            } else if (resolveId) {
                findings.forEach(function (finding) {
                    if (finding.id === resolveId) {
                        finding.status = "Resolved";
                        finding.next = "Follow-up logged";
                    }
                });
                render();
            }
        });

        render();
    }

    function renderReconciliation(section) {
        var source = Number(field(section, "source"));
        var billedControl = section.querySelector('[data-field="billed"]');
        if (billedControl) {
            billedControl.max = source;
            if (Number(billedControl.value) > source) {
                billedControl.value = source;
            }
        }

        setRangeValues(section);
        var billed = Number(field(section, "billed"));
        var price = Number(field(section, "price"));
        var gap = Math.max(source - billed, 0);
        var recovery = gap * price;
        var risk = gap > 20 ? "High" : gap > 8 ? "Review" : "Stable";

        output(section, "gap", gap);
        output(section, "recovery", money(recovery));
        output(section, "risk", risk);
        setStatus(section, gap + " account gap");
    }

    function setupAutomation(section) {
        var runs = [
            { step: "Extract", status: "Waiting", rows: "-" },
            { step: "Validate", status: "Waiting", rows: "-" },
            { step: "Send Report", status: "Waiting", rows: "-" }
        ];

        function render() {
            var html = "";
            runs.forEach(function (run) {
                var done = run.status !== "Waiting" ? " done" : "";
                html += '<div class="automation-step' + done + '"><span>' + run.step + '</span><strong>' + run.status + '</strong><em>' + run.rows + '</em></div>';
            });
            output(section, "runs", html);
        }

        section.addEventListener("click", function (event) {
            var action = event.target.getAttribute("data-action");
            if (action === "extract") {
                runs[0] = { step: "Extract", status: "Complete", rows: "4,812" };
                output(section, "runLog", "Extract completed from billing, product, and store source tables.");
            } else if (action === "validate") {
                runs[1] = { step: "Validate", status: "Clean", rows: "4,812" };
                output(section, "runLog", "Validation passed: row counts, totals, and null checks are within tolerance.");
            } else if (action === "send") {
                runs[2] = { step: "Send Report", status: "Logged", rows: "3 recipients" };
                output(section, "runLog", "Report sent to finance, operations, and the database owner with the run ID logged.");
            }
            render();
            setStatus(section, "Job log updated");
        });

        render();
    }

    document.querySelectorAll("[data-demo]").forEach(function (section) {
        var demo = section.getAttribute("data-demo");
        if (demo === "dashboard") {
            section.addEventListener("input", function () { renderRevenueDashboard(section); });
            renderRevenueDashboard(section);
        } else if (demo === "sql") {
            section.addEventListener("input", function () { renderSqlAudit(section); });
            section.addEventListener("change", function () { renderSqlAudit(section); });
            renderSqlAudit(section);
        } else if (demo === "migration") {
            setupStepper(section, {
                profile: { progress: 34, status: "Profiled", message: "Found duplicate customers, mixed phone formats, and free-text product names." },
                map: { progress: 68, status: "Mapped", message: "Mapped customer, subscription, invoice, and product fields into normalized target tables." },
                validate: { progress: 100, status: "Validated", message: "Customer counts, subscription totals, and revenue totals match the legacy report baseline." }
            });
        } else if (demo === "crud") {
            setupCrud(section);
        } else if (demo === "cloud") {
            setupCloud(section);
        }
    });

    document.querySelectorAll("[data-case-demo]").forEach(function (section) {
        var demo = section.getAttribute("data-case-demo");
        if (demo === "controls") {
            setupControlReview(section);
        } else if (demo === "stakeholder") {
            setupStakeholderTriage(section);
        } else if (demo === "reconciliation") {
            section.addEventListener("input", function () { renderReconciliation(section); });
            section.addEventListener("change", function () { renderReconciliation(section); });
            renderReconciliation(section);
        } else if (demo === "migration") {
            setupStepper(section, {
                legacy: { progress: 32, status: "Profiled", message: "Legacy scan found inconsistent product labels and duplicate account contacts." },
                clean: { progress: 72, status: "Cleaned", message: "Canonical categories are applied before loading the target schema." },
                compare: { progress: 100, status: "Matched", message: "Pre-migration and post-migration totals reconcile within the validation threshold." }
            });
        } else if (demo === "automation") {
            setupAutomation(section);
        }
    });
}());
