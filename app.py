from flask import Flask, render_template

app = Flask(__name__)

# Configuration for static site generation
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_DESTINATION'] = 'build'

@app.route('/')
def home():
    data = {
        "name": "Kyle Dela Pena",
        "title": "Revenue Assurance Analyst",
        "company": "Prime Communications",
        "location": "Pearland, Texas, United States",
        "linkedin_url": "https://www.linkedin.com/in/kyle-dela-pena-321bb41b5",
        "profile_pic": "ProfilePic.png",
        "prime_logo": "prime_logo.jpg",
        "uh_logo": "university_of_houston_logo.jpg",
        "about_text": "I am a Revenue Assurance Analyst at Prime Communications, where I bridge the gap between complex data systems and financial integrity. With a background in Computer Information Science, I specialize in using SQL and database management to identify revenue leakage, optimize financial controls, and ensure enterprise-level data accuracy. My focus is on safeguarding profitability by transforming raw data into actionable insights and maintaining the highest standards of data integrity within our billing and operational ecosystems.",
        "skills": [
            "Revenue Integrity & Leakage Identification",
            "Advanced SQL (Joins, Stored Procedures, Indexing, Performance Audits)",
            "Database Administration (MySQL, AWS RDS, Multi-AZ Deployment)",
            "Cloud Architecture & System Scalability",
            "Financial Risk Mitigation & Audit Compliance",
            "Data Analysis & Visualization (Excel, DFDs, UI Mockups)",
            "Full-Stack Development (Node.js, Vue.js, Express, MongoDB)",
            "Database Migration & Schema Modernization",
            "Technical Documentation & ERD Design",
            "Cross-Functional Collaboration (IT, Finance, Operations)",
            "Automation (Backups, PITR Protocols, Stored Procedures)",
            "Frontend Technologies (Bootstrap, HTML, CSS)",
            "Version Control & Collaboration (Git, Team Environments)",
            "Technical Feasibility Studies & Risk Mitigation",
            "CRUD Operation Engineering"
        ]
    }
    return render_template('index.html', **data)

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
            "org": "Chonche Café",
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

if __name__ == '__main__':
    app.run(debug=True)
