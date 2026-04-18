from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html',
        name="Kyle Dela Pena",
        title="Revenue Assurance Analyst",
        company="Prime Communications",
        location="Pearland, Texas, United States",
        linkedin_url="https://www.linkedin.com/in/kyle-dela-pena-321bb41b5",
        profile_pic="ProfilePic.png",
        prime_logo="prime_logo.jpg",
        uh_logo="university_of_houston_logo.jpg",
        about_text="I am a Revenue Assurance Analyst at Prime Communications, where I bridge the gap between complex data systems and financial integrity. With a background in Computer Information Science, I specialize in using SQL and database management to ensure data accuracy and operational excellence.",
        skills=[
            "Database Administration (MySQL, AWS RDS)",
            "Advanced SQL & Query Optimization",
            "Cloud Architecture & System Scalability",
            "Financial Risk Mitigation",
            "Data Analysis & Visualization",
            "Full-Stack Development (Node.js, Vue.js)",
            "Technical Documentation & ERD Design",
            "Version Control (Git)"
        ]
    )

@app.route('/experience.html')
def experience():
    exp_data = [
        {
            "role": "Revenue Assurance Analyst",
            "period": "Apr 2026 - Present",
            "org": "Prime Communications",
            "bullets": [
                "Perform end-to-end reconciliation of revenue streams to identify and rectify discrepancies.",
                "Utilize SQL and Excel to audit billing systems and ensure captured services are processed accurately.",
                "Collaborate with Finance and IT to mitigate financial risk and improve audit compliance."
            ]
        },
        {
            "role": "Database Administrator",
            "period": "Jan 2023 - May 2023",
            "org": "Chonche Café",
            "bullets": [
                "Architected a MySQL production database, ensuring 99.9% uptime for business operations.",
                "Implemented Point-in-Time Recovery (PITR) and automated backup protocols using AWS RDS.",
                "Optimized database performance through schema modernization and advanced stored procedures."
            ]
        },
        {
            "role": "Full-Stack Web Developer",
            "period": "Jan 2022 - May 2022",
            "org": "Community Family Center (CFC) & Bread of Life",
            "bullets": [
                "Led the migration of legacy data into a centralized MySQL database, improving accuracy by 45%.",
                "Designed complex SQL joins to synchronize 5,000+ client records across platforms.",
                "Engineered a Node.js backend to facilitate real-time CRUD operations, reducing manual work by 40%."
            ]
        },
        {
            "role": "IT Support / Clerical Tester",
            "period": "Feb 2022 - Mar 2022",
            "org": "Administrative Services",
            "bullets": [
                "Developed proficiency in organizational filing systems and alphabetical sequencing.",
                "Maintained technical documentation and ensured data integrity for administrative records.",
                "Assisted in testing and evaluating clerical workflows to improve operational efficiency."
            ]
        }
    ]
    return render_template('experience.html', name="Kyle Dela Pena", experience=exp_data)

@app.route('/education.html')
def education():
    edu_data = {
        "school": "University of Houston",
        "degree": "Bachelor of Science, Computer and Information Systems Security/Information Assurance",
        "period": "Aug 2020 – May 2023",
        "honors": [
            "Cum Laude",
            "Academic Excellence Scholarship Recipient",
            "Dean's List"
        ]
    }
    return render_template('education.html', name="Kyle Dela Pena", edu=edu_data)

if __name__ == '__main__':
    app.run(debug=True)
