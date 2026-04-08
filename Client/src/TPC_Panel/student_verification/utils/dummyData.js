const students = [
  {
    prn: "2453001",
    name: "Anushka Rajesh Patil",
    department: "CSE",
    year: "B.Tech Final Year",
    email: "anushka.patil@rit.edu.in",
    phone: "+91 98765 43210",
    location: "Kolhapur, Maharashtra",
    status: "Pending",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    verifiedFields: {
      personal_email: true,
    },
    sections: [
      {
        id: "personal",
        title: "Personal Details",
        description: "Primary identity and contact details provided by the student.",
        fields: [
          { id: "personal_name", label: "Full Name", value: "Anushka Rajesh Patil" },
          { id: "personal_prn", label: "PRN", value: "2453001" },
          { id: "personal_email", label: "Personal Email", value: "anushka.personal@email.com" },
          { id: "personal_college_email", label: "College Email", value: "anushka.patil@rit.edu.in" },
          { id: "personal_phone", label: "Phone", value: "+91 98765 43210" },
          { id: "personal_dob", label: "Date of Birth", value: "14 May 2002" },
          { id: "personal_aadhaar", label: "Aadhaar Number", value: "XXXX XXXX 3210" },
          { id: "personal_blood_group", label: "Blood Group", value: "O+" },
          { id: "personal_address", label: "Address", value: "Shahupuri, Kolhapur, Maharashtra" },
        ],
      },
      {
        id: "education",
        title: "Education Details",
        description: "Academic records and supporting documents.",
        fields: [
          {
            id: "education_tenth_marks",
            label: "10th Marks",
            value: "89.5%",
            meta: "Board: CBSE",
            documentUrl: "https://example.com/documents/10th-marksheet-anushka.pdf",
            verifiable: true,
          },
          {
            id: "education_twelfth_marks",
            label: "12th Marks",
            value: "91.2%",
            meta: "Board: CBSE",
            documentUrl: "https://example.com/documents/12th-marksheet-anushka.pdf",
            verifiable: true,
          },
          {
            id: "education_cgpa",
            label: "Current CGPA",
            value: "8.78",
            rowLayout: "half",
          },
          {
            id: "education_percentage",
            label: "Percentage",
            value: "87.8%",
            rowLayout: "half",
          },
          {
            id: "education_backlogs",
            label: "Active Backlogs",
            value: "0",
            rowLayout: "half",
          },
          {
            id: "education_dead_backlogs",
            label: "Dead Backlogs",
            value: "0",
            rowLayout: "half",
          },
          {
            id: "education_resume",
            label: "Resume",
            value: "Placement Resume - 2026",
            documentUrl: "https://example.com/documents/resume-anushka.pdf",
            verifiable: true,
          },
        ],
      },
      {
        id: "skills",
        title: "Skills",
        description: "Technical capabilities highlighted for placement drives.",
        fields: [
          { id: "skills_languages", label: "Languages", value: "Java, Python, JavaScript" },
          { id: "skills_frameworks", label: "Frameworks", value: "React, Express" },
          { id: "skills_tools", label: "Tools", value: "Git, MySQL, Postman" },
        ],
      },
      {
        id: "projects",
        title: "Projects",
        description: "Project work that supports the student's profile.",
        fields: [
          {
            id: "projects_portal",
            label: "Training & Placement Portal",
            value: "Built a multi-role campus portal with React, Node.js, and MySQL.",
            documentUrl: "https://example.com/documents/project-portfolio-anushka.pdf",
          },
          {
            id: "projects_analytics",
            label: "Placement Analytics Dashboard",
            value: "Created recruiter and student analytics dashboards using Recharts.",
          },
        ],
      },
      {
        id: "experience",
        title: "Experience",
        description: "Internships and practical exposure.",
        fields: [
          {
            id: "experience_infosys_role",
            label: "Infosys Internship",
            value: "Web Development Intern | 2 Months",
            documentUrl: "https://example.com/documents/internship-certificate-anushka.pdf",
          },
          {
            id: "experience_infosys_work",
            label: "Key Contribution",
            value: "Worked on React UI components and API integration for internal tools.",
          },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        description: "Industry certifications and course completions.",
        fields: [
          {
            id: "certifications_aws",
            label: "AWS Cloud Foundations",
            value: "Coursera",
            documentUrl: "https://example.com/documents/aws-foundations-anushka.pdf",
          },
          {
            id: "certifications_java",
            label: "Java Basics",
            value: "Udemy",
            documentUrl: "https://example.com/documents/java-basics-anushka.pdf",
          },
        ],
      },
      {
        id: "activities",
        title: "Activities",
        description: "Co-curricular and extracurricular participation.",
        fields: [
          {
            id: "activities_club",
            label: "Coding Club Volunteer",
            value: "Helped organize weekly coding sessions and contests.",
          },
          {
            id: "activities_hackathon",
            label: "Hackathon Participant",
            value: "Built a campus utility prototype in an inter-college hackathon.",
          },
        ],
      },
    ],
  },
  {
    prn: "2453002",
    name: "Rohan Vishal Kulkarni",
    department: "IT",
    year: "B.Tech Final Year",
    email: "rohan.kulkarni@rit.edu.in",
    phone: "+91 99887 66554",
    location: "Pune, Maharashtra",
    status: "Verified",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    verifiedFields: {},
    sections: [
      {
        id: "personal",
        title: "Personal Details",
        description: "Primary identity and contact details provided by the student.",
        fields: [
          { id: "personal_name", label: "Full Name", value: "Rohan Vishal Kulkarni" },
          { id: "personal_prn", label: "PRN", value: "2453002" },
          { id: "personal_email", label: "Email", value: "rohan.kulkarni@rit.edu.in" },
          { id: "personal_phone", label: "Phone", value: "+91 99887 66554" },
          { id: "personal_dob", label: "Date of Birth", value: "08 August 2002" },
          { id: "personal_address", label: "Address", value: "Kothrud, Pune, Maharashtra" },
        ],
      },
      {
        id: "education",
        title: "Education Details",
        description: "Academic records and supporting documents.",
        fields: [
          {
            id: "education_tenth_marks",
            label: "10th Marks",
            value: "93.2%",
            meta: "Board: SSC",
            documentUrl: "https://example.com/documents/10th-marksheet-rohan.pdf",
            verifiable: true,
          },
          {
            id: "education_twelfth_marks",
            label: "12th Marks",
            value: "88.4%",
            meta: "Board: HSC",
            documentUrl: "https://example.com/documents/12th-marksheet-rohan.pdf",
            verifiable: true,
          },
          { id: "education_cgpa", label: "Current CGPA", value: "9.12" },
          { id: "education_backlogs", label: "Active Backlogs", value: "0" },
        ],
      },
      {
        id: "skills",
        title: "Skills",
        description: "Technical capabilities highlighted for placement drives.",
        fields: [
          { id: "skills_languages", label: "Languages", value: "Python, SQL, TypeScript" },
          { id: "skills_frameworks", label: "Frameworks", value: "Next.js, Node.js" },
          { id: "skills_tools", label: "Tools", value: "Power BI, Docker, GitHub Actions" },
        ],
      },
      {
        id: "projects",
        title: "Projects",
        description: "Project work that supports the student's profile.",
        fields: [
          {
            id: "projects_fintech",
            label: "Fintech Fraud Detection",
            value: "Built a machine learning workflow to flag suspicious transactions.",
          },
        ],
      },
      {
        id: "experience",
        title: "Experience",
        description: "Internships and practical exposure.",
        fields: [
          {
            id: "experience_tcs",
            label: "TCS Internship",
            value: "Data Analyst Intern | 8 Weeks",
            documentUrl: "https://example.com/documents/internship-certificate-rohan.pdf",
          },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        description: "Industry certifications and course completions.",
        fields: [
          {
            id: "certifications_azure",
            label: "Azure Fundamentals",
            value: "Microsoft",
            documentUrl: "https://example.com/documents/azure-fundamentals-rohan.pdf",
          },
        ],
      },
      {
        id: "activities",
        title: "Activities",
        description: "Co-curricular and extracurricular participation.",
        fields: [
          {
            id: "activities_nss",
            label: "NSS Volunteer",
            value: "Participated in community outreach and blood donation drives.",
          },
        ],
      },
    ],
  },
  {
    prn: "2453003",
    name: "Sneha Milind Jadhav",
    department: "MECH",
    year: "B.Tech Final Year",
    email: "sneha.jadhav@rit.edu.in",
    phone: "+91 97654 33221",
    location: "Sangli, Maharashtra",
    status: "Pending",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
    verifiedFields: {},
    sections: [
      {
        id: "personal",
        title: "Personal Details",
        description: "Primary identity and contact details provided by the student.",
        fields: [
          { id: "personal_name", label: "Full Name", value: "Sneha Milind Jadhav" },
          { id: "personal_prn", label: "PRN", value: "2453003" },
          { id: "personal_email", label: "Email", value: "sneha.jadhav@rit.edu.in" },
          { id: "personal_phone", label: "Phone", value: "+91 97654 33221" },
        ],
      },
      {
        id: "education",
        title: "Education Details",
        description: "Academic records and supporting documents.",
        fields: [
          {
            id: "education_tenth_marks",
            label: "10th Marks",
            value: "86.7%",
            meta: "Board: SSC",
            documentUrl: "https://example.com/documents/10th-marksheet-sneha.pdf",
            verifiable: true,
          },
          {
            id: "education_diploma",
            label: "Diploma Percentage",
            value: "84.1%",
            meta: "Board: MSBTE",
            documentUrl: "https://example.com/documents/diploma-marksheet-sneha.pdf",
            verifiable: true,
          },
          { id: "education_cgpa", label: "Current CGPA", value: "8.34" },
        ],
      },
      {
        id: "skills",
        title: "Skills",
        description: "Technical capabilities highlighted for placement drives.",
        fields: [
          { id: "skills_core", label: "Core Skills", value: "CAD, SolidWorks, AutoCAD" },
          { id: "skills_software", label: "Software", value: "ANSYS, MATLAB" },
        ],
      },
      {
        id: "projects",
        title: "Projects",
        description: "Project work that supports the student's profile.",
        fields: [
          {
            id: "projects_ev",
            label: "EV Chassis Design",
            value: "Led the CAD modeling workflow for a lightweight EV chassis prototype.",
          },
        ],
      },
      {
        id: "experience",
        title: "Experience",
        description: "Internships and practical exposure.",
        fields: [
          {
            id: "experience_mahindra",
            label: "Mahindra Internship",
            value: "Manufacturing Intern | 6 Weeks",
          },
        ],
      },
      {
        id: "certifications",
        title: "Certifications",
        description: "Industry certifications and course completions.",
        fields: [
          {
            id: "certifications_solidworks",
            label: "SolidWorks Associate",
            value: "Dassault Systemes",
            documentUrl: "https://example.com/documents/solidworks-sneha.pdf",
          },
        ],
      },
      {
        id: "activities",
        title: "Activities",
        description: "Co-curricular and extracurricular participation.",
        fields: [
          {
            id: "activities_baja",
            label: "BAJA Team Member",
            value: "Worked on fabrication and assembly planning for the college BAJA team.",
          },
        ],
      },
    ],
  },
];

export default students;
