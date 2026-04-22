from flask import Flask, render_template

app = Flask(__name__)

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

@app.route('/experience.html')
def experience():
    experience_data = [
        {
            "role": "Revenue Assurance Analyst",
            "org": "Prime Communications",
            "period": "Apr 2026 - Present",
            "bullets": [
                "Revenue Integrity & Analysis: Perform end-to-end reconciliation of revenue streams to identify and rectify discrepancies, ensuring that all billable services are accurately captured and processed.",
                "Data-Driven Problem Solving: Utilize advanced data tools (SQL, Excel) to audit billing systems and contracts, reducing financial risk and ensuring audit compliance.",
                "Process Optimization: Collaborate with IT and Finance departments to streamline financial reporting and automate data validation workflows."
            ]
        },
        {
            "role": "Database Administrator",
            "org": "Chonche Café",
            "period": "Jan 2023 - May 2023",
            "bullets": [
                "Architected and managed a production-scale MySQL database on AWS RDS, ensuring 99.9% availability for critical business operations.",
                "Implemented automated backup strategies and Point-in-Time Recovery (PITR) protocols to safeguard data against hardware failure or accidental loss.",
                "Modernized legacy schemas and optimized stored procedures, significantly improving query performance and database scalability."
            ]
        },
        {
            "role": "IT Support / Clerical Tester",
            "org": "Administrative Services",
            "period": "Feb 2022 - Mar 2022",
            "bullets": [
                "Developed proficiency in organizational filing systems and alphabetical sequencing.",
                "Maintained technical documentation and ensured data integrity for administrative records.",
                "Developed technical documentation using Flow Diagrams (DFDs) and UI mockups, accelerating the project approval cycle by 30%.",
                "Conducted technical feasibility studies for database scalability, evaluating constraints and mitigating risks related to data integrity."
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
                "Maintained technical documentation and ERDs in a team-based Git environment, ensuring seamless collaboration."
            ]
        }
    ]
    return render_template('experience.html', experience=experience_data)

@app.route('/education.html')
def education():
    edu_data = {
        "school": "University of Houston",
        "degree": "Bachelor of Science, Computer and Information Systems Security/Information Assurance",
        "period": "Aug 2020 – May 2023",
        "honors": ["Cum Laude", "Academic Excellence Scholarship Recipient", "Dean's List"]
    }
    return render_template('education.html', edu=edu_data)

if __name__ == '__main__':
    app.run(debug=True)
