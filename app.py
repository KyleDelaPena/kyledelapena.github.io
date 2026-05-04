from flask import Flask, abort, render_template

app = Flask(__name__)

app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_DESTINATION'] = 'build'

SKILLS = [
    {
        "slug": "revenue-integrity-leakage-identification",
        "title": "Revenue Integrity & Leakage Identification",
        "summary": "A practical reconciliation workflow for finding missed billables, mismatched contract terms, and revenue leakage patterns before they affect margin.",
        "scenario": "Monthly telecom billing closes with unexplained variance between activated services, customer contracts, and recognized revenue.",
        "business_example": "A telecom retailer sees that accessory protection plans are active in the point-of-sale system, but a subset of those plans never appears on the monthly billing export. I would compare activation records, customer account status, invoice line items, and cancellation dates to isolate the missing revenue population. After grouping the exceptions by store, product, and activation date, I would identify whether the issue came from a system mapping problem, delayed billing feed, or process gap at activation.",
        "business_steps": [
            "Build an exception table showing every active service with no matching billable invoice line.",
            "Estimate exposure by multiplying missing charges by contract term, product type, and account status.",
            "Send finance a recoverable revenue list and give operations the root-cause pattern to prevent recurrence."
        ],
        "actions": [
            "Reconcile source transactions against billing outputs and contract rules.",
            "Flag underbilled accounts, duplicate credits, and missing service activations.",
            "Prioritize exceptions by financial impact and repeat frequency."
        ],
        "evidence": ["Leakage register", "Variance summary", "Root-cause queue"],
        "impact": "Turns scattered billing exceptions into a ranked recovery plan finance and operations can act on."
    },
    {
        "slug": "advanced-sql",
        "title": "Advanced SQL",
        "summary": "A SQL audit pattern using joins, stored procedures, indexes, and query review to make large operational datasets easier to trust and faster to analyze.",
        "scenario": "A reporting query has grown slow and inconsistent because account, invoice, and adjustment data live across multiple tables.",
        "business_example": "A finance team needs a monthly report showing accounts with unusual credits, missing taxes, or revenue adjustments over a threshold. I would write SQL that joins customers, invoices, payments, adjustments, products, and store locations into one auditable result set. Then I would turn the logic into a stored procedure with date parameters, add indexes to the columns used in filters and joins, and compare execution plans before and after optimization.",
        "business_steps": [
            "Create a query that separates normal billing activity from high-risk adjustment patterns.",
            "Use indexes and query plan review to cut report runtime for repeated month-end use.",
            "Package the audit as a stored procedure so finance can rerun it with consistent logic."
        ],
        "actions": [
            "Use targeted joins to compare invoice lines, account status, and adjustment records.",
            "Add indexes around high-selectivity lookup fields used in recurring audits.",
            "Package repeatable checks in stored procedures for month-end validation."
        ],
        "evidence": ["Optimized join logic", "Index candidates", "Stored audit procedure"],
        "impact": "Reduces manual query work while improving repeatability across billing-cycle reviews."
    },
    {
        "slug": "database-administration",
        "title": "Database Administration",
        "summary": "A production-minded MySQL and AWS RDS setup focused on uptime, backups, access hygiene, and predictable recovery.",
        "scenario": "A business-critical database needs stronger availability and simpler recovery without adding avoidable operational overhead.",
        "business_example": "A small business relies on a MySQL database for orders, inventory, and customer records, but the database runs on a single unmanaged server. I would migrate the workload to AWS RDS, enable automated backups, configure Multi-AZ availability, and create separate database users for the application, reporting, and administration. I would also test a restore into a separate environment so the recovery plan is proven instead of assumed.",
        "business_steps": [
            "Move the database to a managed RDS instance with monitoring and backup retention.",
            "Review permissions so users and applications only have the access they need.",
            "Run a restore test and document the exact recovery steps for an outage."
        ],
        "actions": [
            "Configure RDS backups, retention, monitoring, and Multi-AZ availability.",
            "Review users and privileges against actual application needs.",
            "Document restore steps and test recovery assumptions before an incident."
        ],
        "evidence": ["Backup policy", "Access review", "Recovery checklist"],
        "impact": "Improves confidence that core data stays available, recoverable, and governed."
    },
    {
        "slug": "cloud-architecture-system-scalability",
        "title": "Cloud Architecture & System Scalability",
        "summary": "A cloud-readiness pass that identifies database, application, and infrastructure bottlenecks before demand grows.",
        "scenario": "An application is preparing for higher usage, but its current hosting and database design may not scale cleanly.",
        "business_example": "An internal reporting portal works well for a few analysts, but leadership wants store managers across multiple regions to use it daily. I would review database connection limits, API response times, static asset delivery, background jobs, and deployment reliability. The recommendation might include separating the web app and database tiers, adding read replicas for reporting, caching expensive dashboard queries, and setting CloudWatch alerts around latency and error rates.",
        "business_steps": [
            "Map the current architecture and identify where traffic growth will create strain.",
            "Separate workloads that should scale independently, such as reporting reads and transactional writes.",
            "Define monitoring thresholds so the team can react before users experience downtime."
        ],
        "actions": [
            "Map the current request flow from frontend to API to database.",
            "Identify capacity risks around compute, storage, connections, and failover.",
            "Recommend right-sized cloud services with room for measured growth."
        ],
        "evidence": ["Architecture map", "Capacity notes", "Scaling roadmap"],
        "impact": "Creates a practical path from fragile deployment to scalable system design."
    },
    {
        "slug": "financial-risk-mitigation-audit-compliance",
        "title": "Financial Risk Mitigation & Audit Compliance",
        "summary": "A controls-focused review that catches billing, revenue, and data integrity risks before they become audit findings.",
        "scenario": "Finance needs proof that revenue processes are complete, accurate, and traceable across systems.",
        "business_example": "A company discovers that manual billing adjustments can be entered without a consistent approval trail. I would review adjustment tables, user roles, timestamps, approval notes, and invoice outcomes to find gaps in the control process. Then I would create an exception report for adjustments over a defined threshold, missing approval metadata, or repeated adjustments by the same user and period.",
        "business_steps": [
            "Define the control requirement in plain business terms: who can adjust revenue, when, and why.",
            "Create audit checks that flag missing approvals, unusual amounts, and repeated corrections.",
            "Produce evidence that finance can use for remediation and audit support."
        ],
        "actions": [
            "Compare control expectations against current system behavior.",
            "Create exception checks for missing approvals, stale data, and unusual adjustments.",
            "Capture evidence in a format audit stakeholders can follow."
        ],
        "evidence": ["Control matrix", "Exception log", "Audit evidence pack"],
        "impact": "Makes risk visible early and gives teams a cleaner path to remediation."
    },
    {
        "slug": "data-analysis-visualization",
        "title": "Data Analysis & Visualization",
        "summary": "A reporting workflow that turns raw extracts, Excel analysis, DFDs, and UI mockups into clear business decisions.",
        "scenario": "Stakeholders need to understand where process delays and data mismatches are occurring.",
        "business_example": "Operations wants to know why certain stores have more billing corrections than others. I would combine billing exports, store metadata, product mix, activation volume, and correction reason codes into an analysis workbook. From there, I would build charts that compare correction rate by region, product category, and employee workflow stage, then create a simple data flow diagram showing where each correction enters the process.",
        "business_steps": [
            "Clean and profile the dataset so comparisons are fair across stores and time periods.",
            "Build visual summaries that expose patterns by region, product, and process step.",
            "Translate the findings into a workflow diagram stakeholders can discuss and improve."
        ],
        "actions": [
            "Profile the dataset for gaps, duplicates, and outliers.",
            "Build summary views that separate trends from one-off noise.",
            "Use DFDs and mockups to explain how data moves through the workflow."
        ],
        "evidence": ["Trend workbook", "Data flow diagram", "Decision-ready mockup"],
        "impact": "Helps non-technical teams see the operational story inside the data."
    },
    {
        "slug": "full-stack-development",
        "title": "Full-Stack Development",
        "summary": "A working application slice using Node.js, Vue.js, Express, and MongoDB to support real CRUD workflows.",
        "scenario": "A team needs a shared tool for creating, updating, searching, and validating records instead of maintaining spreadsheets.",
        "business_example": "A nonprofit tracks clients, services, appointments, and follow-ups in disconnected spreadsheets. I would build a web app where staff can search client records, create new service entries, update case notes, and filter follow-ups by due date. The Vue frontend would keep the workflow fast for staff, while Express routes would validate submissions and MongoDB would store flexible case records.",
        "business_steps": [
            "Interview users to define the record fields, statuses, and search paths they need daily.",
            "Build API endpoints for creating, reading, updating, and filtering client activity.",
            "Add form validation and clear error states so staff can trust the data they enter."
        ],
        "actions": [
            "Design API endpoints around the actual user workflow.",
            "Build Vue components for fast record entry and review.",
            "Persist data with clear validation and predictable error handling."
        ],
        "evidence": ["REST API", "Vue record editor", "MongoDB collection model"],
        "impact": "Converts manual record handling into a maintainable web workflow."
    },
    {
        "slug": "database-migration-schema-modernization",
        "title": "Database Migration & Schema Modernization",
        "summary": "A migration plan that cleans legacy data, modernizes schema design, and protects reporting continuity.",
        "scenario": "Legacy tables are inconsistent, hard to query, and risky to move without a careful transformation plan.",
        "business_example": "A legacy customer database stores phone numbers, account notes, billing flags, and product subscriptions in inconsistent free-text fields. I would profile the legacy data, define normalized target tables, map messy values into clean categories, and run validation queries comparing record counts, totals, and key relationships before cutover. A parallel run would confirm that old reports and new reports agree before the business relies on the new schema.",
        "business_steps": [
            "Create a field mapping from legacy columns to the modern relational schema.",
            "Clean duplicate customers, invalid values, and inconsistent product naming before import.",
            "Validate totals and relationships so reporting continuity is protected after migration."
        ],
        "actions": [
            "Profile legacy fields and define canonical target tables.",
            "Map old values to new schema rules with validation checkpoints.",
            "Run parallel checks to confirm migrated totals and relationships."
        ],
        "evidence": ["Field mapping", "Target ERD", "Migration validation report"],
        "impact": "Moves data forward without losing the trust built into existing reports."
    },
    {
        "slug": "technical-documentation-erd-design",
        "title": "Technical Documentation & ERD Design",
        "summary": "A documentation package that makes schemas, relationships, and system behavior easier for teams to maintain.",
        "scenario": "A database is being used by multiple teams, but table meaning and relationships are mostly tribal knowledge.",
        "business_example": "A reporting database has tables named by old project codes, and new analysts do not know which fields are authoritative. I would interview the users who rely on the data, inspect foreign keys and recurring queries, and create an ERD showing how customers, invoices, payments, products, and adjustments relate. Then I would add a data dictionary explaining field meaning, ownership, refresh cadence, and known caveats.",
        "business_steps": [
            "Turn unclear table relationships into an ERD that analysts and developers can share.",
            "Document field definitions, source systems, and business rules behind key metrics.",
            "Create handoff notes that reduce onboarding time for future maintainers."
        ],
        "actions": [
            "Create an ERD that shows core entities and dependency paths.",
            "Document table ownership, field definitions, and business rules.",
            "Capture operational notes for handoff and future development."
        ],
        "evidence": ["Entity relationship diagram", "Data dictionary", "Handoff notes"],
        "impact": "Reduces confusion and speeds up future changes because the system is easier to understand."
    },
    {
        "slug": "cross-functional-collaboration",
        "title": "Cross-Functional Collaboration",
        "summary": "A stakeholder workflow for aligning IT, finance, and operations around the same root-cause evidence.",
        "scenario": "A revenue issue touches multiple departments, but each team sees only its own slice of the problem.",
        "business_example": "Finance sees a margin issue, operations sees store workflow problems, and IT sees recurring integration errors. I would bring the teams together around a shared exception report that shows when the issue starts, which systems touch it, and what financial impact it creates. The meeting would end with owners for the system fix, process retraining, revenue recovery list, and follow-up validation.",
        "business_steps": [
            "Translate the technical finding into business impact for each stakeholder group.",
            "Use one shared source of evidence so teams are not debating different numbers.",
            "Assign owners and deadlines for the process, system, and financial follow-up work."
        ],
        "actions": [
            "Translate technical findings into finance and operations language.",
            "Separate symptoms from root causes using shared evidence.",
            "Define next actions with clear owners and follow-up checks."
        ],
        "evidence": ["Issue brief", "Owner matrix", "Follow-up tracker"],
        "impact": "Keeps complex investigations moving because each team understands its part."
    },
    {
        "slug": "automation",
        "title": "Automation",
        "summary": "A repeatable automation setup for backups, point-in-time recovery, and stored-procedure driven reporting.",
        "scenario": "Recurring database tasks are being handled manually, creating delays and avoidable risk.",
        "business_example": "A weekly inventory and revenue report takes several hours because someone manually exports data, filters rows, and emails summaries. I would create stored procedures that produce the report-ready dataset, schedule the job, log completion status, and send an alert when row counts or totals look abnormal. For database protection, I would pair the reporting automation with backup verification and point-in-time recovery checks.",
        "business_steps": [
            "Identify manual reporting steps that follow the same logic every week.",
            "Move repeatable logic into stored procedures and scheduled jobs with run logs.",
            "Add alerts for failures or unusual totals so automation does not hide problems."
        ],
        "actions": [
            "Automate daily backup checks and retention verification.",
            "Create stored procedures for recurring inventory or revenue reports.",
            "Schedule validations and log failures for quick follow-up."
        ],
        "evidence": ["Backup schedule", "Stored procedure", "Run log"],
        "impact": "Saves time while making critical processes more consistent."
    },
    {
        "slug": "frontend-technologies",
        "title": "Frontend Technologies",
        "summary": "A responsive interface pass using Bootstrap, HTML, and CSS to make tools clear, accessible, and easy to scan.",
        "scenario": "An internal tool works technically, but users struggle to find actions and read dense information.",
        "business_example": "A billing review screen shows dozens of fields with no visual hierarchy, so analysts miss important account status and exception details. I would redesign the page with clear sections for account summary, billing issue, supporting evidence, and next action. Using responsive HTML, CSS, and Bootstrap patterns, the interface would stay readable on laptops while still working for managers reviewing cases from tablets.",
        "business_steps": [
            "Organize dense data around the order analysts make decisions in.",
            "Use responsive layout, spacing, and state styles to make high-risk fields stand out.",
            "Make common actions easy to find without overwhelming the user with extra text."
        ],
        "actions": [
            "Structure layouts around the user's highest-frequency tasks.",
            "Use responsive components for forms, tables, and navigation.",
            "Tighten spacing, contrast, and states so the interface feels dependable."
        ],
        "evidence": ["Responsive layout", "Form components", "Polished CSS states"],
        "impact": "Makes everyday tools faster and less frustrating for the people using them."
    },
    {
        "slug": "version-control-collaboration",
        "title": "Version Control & Collaboration",
        "summary": "A Git-based team workflow for reviewing changes, protecting shared code, and keeping documentation in sync.",
        "scenario": "Several contributors need to update application code and database docs without overwriting each other.",
        "business_example": "A team is changing a customer data import process while another teammate updates the reporting dashboard that depends on it. I would use separate branches, focused commits, and pull request notes that explain the database fields affected by each change. Before merging, I would check that schema documentation, migration scripts, and application logic all describe the same behavior.",
        "business_steps": [
            "Keep work isolated in branches so changes can be reviewed without blocking the team.",
            "Write commit messages and review notes that explain business impact, not just code edits.",
            "Coordinate schema, documentation, and application changes so the release stays consistent."
        ],
        "actions": [
            "Use branches and focused commits to keep changes reviewable.",
            "Resolve conflicts by preserving intent from both sides.",
            "Keep schema notes and implementation changes aligned in the same workflow."
        ],
        "evidence": ["Feature branch", "Review notes", "Change history"],
        "impact": "Improves team speed while reducing accidental regressions."
    },
    {
        "slug": "technical-feasibility-studies-risk-mitigation",
        "title": "Technical Feasibility Studies & Risk Mitigation",
        "summary": "A feasibility review that weighs constraints, implementation effort, risks, and success criteria before work begins.",
        "scenario": "A team wants to modernize a process but needs to know whether the proposed approach is realistic.",
        "business_example": "Leadership wants to replace a spreadsheet-based reconciliation process with an automated database workflow. I would evaluate data quality, system access, integration options, reporting requirements, security constraints, and user adoption risks. The final recommendation would compare a small automation pilot, a full custom app, and an off-the-shelf tool so leadership can choose based on cost, timeline, and operational risk.",
        "business_steps": [
            "Identify technical dependencies and business constraints before committing to a solution.",
            "Compare implementation options by cost, timeline, complexity, and expected benefit.",
            "Document risks and mitigation steps so the chosen path is realistic."
        ],
        "actions": [
            "Identify technical dependencies, data constraints, and integration risks.",
            "Compare implementation options against cost, complexity, and benefit.",
            "Define go/no-go criteria and mitigation steps."
        ],
        "evidence": ["Feasibility matrix", "Risk register", "Recommendation brief"],
        "impact": "Gives stakeholders a clear decision path before committing resources."
    },
    {
        "slug": "crud-operation-engineering",
        "title": "CRUD Operation Engineering",
        "summary": "A clean create, read, update, and delete workflow designed around validation, usability, and data integrity.",
        "scenario": "Users need to maintain operational records safely while the system enforces required fields and change rules.",
        "business_example": "A service team needs to manage customer support cases with accurate status, owner, priority, and resolution notes. I would build CRUD operations that let users create cases, search and filter open items, update status with validation, and restrict deletes to authorized users. Each change would keep a timestamped trail so managers can see how long cases stay open and where bottlenecks occur.",
        "business_steps": [
            "Design create and update forms around required business rules and user permissions.",
            "Build read views that support search, filtering, and operational follow-up.",
            "Guard delete actions and preserve history where accountability matters."
        ],
        "actions": [
            "Design database operations around real user permissions and workflows.",
            "Validate inputs before records are created or updated.",
            "Add clear read views and guarded delete behavior for sensitive data."
        ],
        "evidence": ["CRUD endpoints", "Validation rules", "Record management UI"],
        "impact": "Makes record maintenance reliable without slowing down everyday work."
    }
]

def get_home_data():
    return {
        "name": "Kyle Dela Pena",
        "title": "Revenue Assurance Analyst @ Prime Communications | SQL & Data Integrity | Database Administration | Financial Risk Mitigation | Full Stack Development",
        "company": "Prime Communications",
        "location": "Pearland, Texas, United States",
        "linkedin_url": "https://www.linkedin.com/in/kyle-dela-pena-321bb41b5",
        "profile_pic": "ProfilePic.png",
        "prime_logo": "prime_logo.jpg",
        "uh_logo": "university_of_houston_logo.jpg",
        "about_text": "I am a Revenue Assurance Analyst at Prime Communications, where I bridge the gap between complex data systems and financial integrity. With a background in Computer Information Science, I specialize in using SQL and database management to identify revenue leakage, optimize financial controls, and ensure enterprise-level data accuracy. My focus is on safeguarding profitability by transforming raw data into actionable insights and maintaining the highest standards of data integrity within our billing and operational ecosystems.",
        "core_expertise": "Revenue Integrity | SQL & Data Analysis | Financial Risk Mitigation | Database Administration | Process Optimization",
        "career_focus": "I am interested in roles where I can use my skills in data systems, SQL, analysis, database management, and full-stack development to help businesses increase revenue, reduce loss, and make stronger operational decisions.",
        "metrics": [
            {"value": "5,000+", "label": "records synchronized across nonprofit data workflows"},
            {"value": "45%", "label": "reporting accuracy improvement from data consolidation"},
            {"value": "40%", "label": "server response time reduction through SQL optimization"},
            {"value": "10+ hrs", "label": "manual reporting time saved monthly through automation"}
        ],
        "skills": SKILLS
    }

PROJECTS = [
    {
        "title": "Revenue Leakage Detection Dashboard",
        "category": "Revenue Assurance",
        "visual": "dashboard",
        "problem": "Activated services do not always become invoice lines, so finance needs a fast way to see which accounts may be underbilled before month-end close.",
        "built": "A reconciliation queue that compares activations against invoice matches, estimates recoverable monthly revenue, and points operations toward the likely process gap.",
        "tools": ["SQL", "Excel", "Revenue reconciliation", "Exception reporting"],
        "impact": "Helps finance recover missed charges while giving store operations a specific list of accounts, products, and process steps to fix.",
        "metrics": ["Missing billables", "Recoverable revenue estimate", "Root-cause queue"]
    },
    {
        "title": "SQL Billing Reconciliation Audit",
        "category": "SQL & Data Analysis",
        "visual": "sql",
        "problem": "Manual billing reviews can miss unusual credits, tax gaps, duplicate adjustments, or charges that need approval evidence.",
        "built": "A reusable SQL audit workflow that filters exception type, exposure threshold, and billing period into a reviewable worklist.",
        "tools": ["MySQL", "Stored procedures", "Joins", "Index review"],
        "impact": "Gives finance and audit stakeholders a repeatable exception list with owner-ready next actions instead of one-off spreadsheet checks.",
        "metrics": ["Stored audit logic", "Exception worklist", "Approval evidence review"]
    },
    {
        "title": "Legacy Data Migration & Schema Modernization",
        "category": "Database Systems",
        "visual": "migration",
        "problem": "Legacy customer and billing records contain duplicates, inconsistent product values, and free-text notes that make migration risky.",
        "built": "A cutover workflow that profiles source quality, maps legacy fields to normalized tables, and validates totals before reports move to the new schema.",
        "tools": ["MySQL", "ERD design", "Data mapping", "Validation queries"],
        "impact": "Protects reporting continuity by proving that customer counts, subscription totals, and revenue totals reconcile before go-live.",
        "metrics": ["Source quality profile", "Field mapping", "Cutover validation report"]
    },
    {
        "title": "Operations Case Queue App",
        "category": "Full-Stack Development",
        "visual": "crud",
        "problem": "Revenue, support, or operations teams using spreadsheets lose track of case owners, issue types, priorities, follow-up dates, and closure status.",
        "built": "A Node.js, Express, Vue, and MongoDB case queue pattern for creating cases, assigning owners, updating workflow status, and keeping records searchable.",
        "tools": ["Node.js", "Express", "Vue.js", "MongoDB", "Bootstrap"],
        "impact": "Turns scattered spreadsheet follow-ups into an accountable workflow where managers can see open risk, ownership, and resolution progress.",
        "metrics": ["Validated case intake", "Owner queue", "Status update flow"]
    },
    {
        "title": "AWS RDS High-Availability Database Setup",
        "category": "Cloud & Database Administration",
        "visual": "cloud",
        "problem": "A single unmanaged database server creates outage, backup, access, and recovery risk for orders, inventory, and reporting data.",
        "built": "A production-minded AWS RDS MySQL readiness workflow covering Multi-AZ failover, backup health, restore testing, and load response.",
        "tools": ["AWS RDS", "MySQL", "Multi-AZ", "Backups", "PITR"],
        "impact": "Gives the business confidence that core data can stay available during failures and be restored from a documented recovery path.",
        "metrics": ["Failover readiness", "Automated backups", "Tested restore path"]
    }
]

CASE_STUDIES = [
    {
        "title": "Strengthening Billing Adjustment Controls",
        "visual": "controls",
        "problem": "Manual credits and billing adjustments can reduce revenue without a consistent approval trail, creating financial risk and audit cleanup work.",
        "approach": "Define control rules for high-dollar adjustments, missing approval notes, repeated corrections by the same user, and stale review items. Turn those rules into an exception review cadence with owners and evidence requirements.",
        "tools": ["Control matrix", "Exception review", "Approval evidence", "Audit readiness"],
        "outcome": "Finance gains a clearer approval trail, managers know which adjustments need review, and audit support becomes easier because exceptions are tracked with ownership."
    },
    {
        "title": "Turning Data Quality Findings Into Action",
        "visual": "stakeholder",
        "problem": "Finance, operations, and IT can look at the same data issue differently, which slows resolution when ownership and business impact are unclear.",
        "approach": "Translate technical findings into department-specific actions: finance receives exposure and control impact, operations receives process patterns, and IT receives system mapping or integration evidence.",
        "tools": ["Stakeholder brief", "Owner matrix", "Issue tracker", "Business impact summary"],
        "outcome": "Teams leave with the same evidence, clear ownership, and a follow-up plan instead of debating separate spreadsheets or symptoms."
    },
    {
        "title": "Automating Recurring Operational Reports",
        "visual": "automation",
        "problem": "Manual weekly reports waste analyst time and increase the chance of inconsistent calculations.",
        "approach": "Move repeatable report logic into stored procedures, schedule the reporting job, log each run, and add checks for unusual totals or row counts.",
        "tools": ["Stored procedures", "Scheduled jobs", "Run logs", "PITR awareness"],
        "outcome": "The business gets faster reporting, fewer manual steps, and better visibility when something in the data changes unexpectedly."
    }
]

TOOLKIT = [
    {"group": "Languages & Querying", "items": ["SQL", "JavaScript", "HTML", "CSS"]},
    {"group": "Databases", "items": ["MySQL", "MongoDB", "AWS RDS", "Relational schema design"]},
    {"group": "Backend", "items": ["Node.js", "Express", "REST API design", "CRUD workflows"]},
    {"group": "Frontend", "items": ["Vue.js", "Bootstrap", "Responsive HTML/CSS", "UI mockups"]},
    {"group": "Data & Analysis", "items": ["Excel", "ERDs", "DFDs", "Reconciliation reports", "Exception analysis"]},
    {"group": "Workflow", "items": ["Git", "Technical documentation", "Audit logs", "Cross-functional handoffs"]}
]

CERTIFICATIONS = [
    {
        "title": "AWS Cloud Practitioner",
        "status": "Learning goal",
        "reason": "Strengthens the cloud architecture and AWS RDS side of my database background."
    },
    {
        "title": "SQL Certification",
        "status": "Learning goal",
        "reason": "Provides third-party validation for advanced querying, optimization, and data analysis."
    },
    {
        "title": "CompTIA Security+",
        "status": "Learning goal",
        "reason": "Connects my CIS security background with financial controls, access review, and risk mitigation."
    }
]

@app.route('/')
def home():
    return render_template('index.html', **get_home_data())

@app.route('/skills/<slug>/')
def skill_detail(slug):
    skill = next((item for item in SKILLS if item["slug"] == slug), None)
    if skill is None:
        abort(404)
    return render_template('skill.html', skill=skill, skills=SKILLS)

@app.route('/experience')
def experience():
    experience_data = [
        {
            "role": "Revenue Assurance Analyst",
            "org": "Prime Communications",
            "period": "Apr 2026 - Present",
            "bullets": [
                "Revenue Integrity & Analysis: Perform end-to-end reconciliation of revenue streams to identify and rectify discrepancies, ensuring that all billable services are accurately captured and processed.",
                "Data-Driven Problem Solving: Utilize advanced data tools (SQL, Excel) to audit billing systems and contracts, reducing financial risk and improving margin accuracy.",
                "Cross-Functional Collaboration: Partner with IT, Finance, and Operations departments to investigate root causes of revenue loss and implement long-term control enhancements.",
                "Audit & Compliance: Conduct regular spot checks and sanity audits on monthly billing cycles to ensure 100% data integrity and compliance with financial regulations.",
                "Process Optimization: Identify 'leakage' patterns and provide actionable insights to senior leadership to streamline the revenue cycle and optimize sustainable costs.",
                "Managed complex data validation projects, leveraging SQL and database management principles to audit large-scale telecommunications datasets."
            ]
        },
        {
            "role": "Database Administrator & Cloud Architect",
            "org": "Chonche Cafe",
            "period": "Jan 2023 - May 2023",
            "bullets": [
                "Architected and managed a MySQL production database on AWS RDS, utilizing Multi-AZ deployment to increase system uptime from 95% to 99.5%.",
                "Optimized SQL query execution plans and implemented indexing strategies, reducing average server response times by 40% and decreasing monthly cloud compute costs by 20%.",
                "Automated daily database backups and point-in-time recovery (PITR) protocols, ensuring 100% data durability and zero-loss during high-traffic periods.",
                "Developed stored procedures to automate weekly inventory reporting, saving 10+ hours of manual data entry per month."
            ]
        },
        {
            "role": "Junior Systems & Database Analyst",
            "org": "Houston Hot Breads",
            "period": "Jan 2021 - Dec 2022",
            "bullets": [
                "Performed SQL performance audits on existing customer loyalty systems, identifying bottlenecks and refactoring queries to improve transaction speed by 20%.",
                "Analyzed business requirements to design a modernized MySQL schema that supported a 15% increase in concurrent user sessions.",
                "Created detailed Data Flow Diagrams (DFDs) and UI mockups, accelerating the project approval cycle by 30% through effective stakeholder communication.",
                "Conducted technical feasibility studies for database scalability, evaluating constraints and mitigating risks related to data integrity and system migration."
            ]
        },
        {
            "role": "Full-Stack Web Developer",
            "org": "Community Family Center (CFC) & Bread of Life",
            "period": "Jan 2022 - May 2022",
            "bullets": [
                "Project: Consolidated Data Platform for Nonprofits",
                "Technologies: MongoDB, Express, Vue.js, Node.js, Bootstrap, Git",
                "Led the migration of legacy nonprofit data into a centralized MySQL relational database, improving data consistency and reporting accuracy by 45%.",
                "Designed complex SQL joins and matching logic to synchronize 5,000+ client records, increasing successful cross-platform data matching rates by 30%.",
                "Engineered a Node.js backend to facilitate real-time CRUD operations on the MySQL database, reducing manual data reconciliation work by 40%.",
                "Maintained technical documentation and ERDs in a team-based Git environment, ensuring seamless collaboration and version control for database schemas."
            ]
        }
    ]
    return render_template('experience.html', experience=experience_data)

@app.route('/projects')
def projects():
    return render_template('projects.html', projects=PROJECTS, case_studies=CASE_STUDIES)

@app.route('/case-studies')
def case_studies():
    return render_template('case_studies.html', case_studies=CASE_STUDIES)

@app.route('/toolkit')
def toolkit():
    return render_template('toolkit.html', toolkit=TOOLKIT, certifications=CERTIFICATIONS)

@app.route('/education')
def education():
    education_data = [
        {
            "school": "University of Houston",
            "period": "Aug 2020 - May 2023",
            "degree": "Bachelor of Science, Computer and Information Systems Security/Information Assurance",
            "bullets": [
                "Cum Laude",
                "Academic Excellence Scholarship Recipient",
                "Dean's List"
            ]
        }
    ]
    return render_template('education.html', education=education_data)

if __name__ == '__main__':
    app.run(debug=True)
