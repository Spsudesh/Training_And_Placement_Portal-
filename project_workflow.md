# Training and Placement Portal - Project Workflow

This document outlines the entire workflow and structure of the Training and Placement Portal, spanning from the frontend UI concepts down to the backend implementation. The application uses a modern full-stack approach consisting of **React (Vite)** on the frontend and **Node.js/Express** on the backend, with a MySQL database.

## System Roles & Access
The application is segmented into three primary access roles:
1. **Student**: Candidates applying for jobs and managing their profiles.
2. **TPC (Training and Placement Coordinator)**: Faculty or student coordinators verifying student records and assisting in the placement process.
3. **TPO (Training and Placement Officer)**: The overall head who manages the system, creates notices, manages placements, oversees TPC structure, and tracks applications.

Authentication is strictly enforced using JWT tokens (`requireAuth`) and role-based access control (`requireRole()`). Also, active session polling helps maintain auto-renewing user sessions.

---

## 1. Frontend Workflow (Client)

The frontend is a Single Page Application (SPA) utilizing `Vite`, `React`, `React Router DOM` for routing, and `Tailwind CSS` for styling. 

### 1.1 Authentication Pages (`/login`, `/signup`)
*   **What it Implements**: Authentication gateways for the system.
*   **How it Works**: Handled by `LoginPage.jsx` and `SignupPage.jsx`. When users log in, the client stores session states (JWT tokens via cookies, and local storage variables like `AUTH_STORAGE_KEY` and `STUDENT_ID_STORAGE_KEY`). The system dynamically redirects the user to their respective dashboard depending on their role (Student, TPC, TPO).

### 1.2 Student Panel (`/student-panel/*`)
*   **`/profile-form` (Profile Form)**:
    *   **Workflow**: Once a student signs up, they cannot access the dashboard until they fill out this multi-step profile progress form. Checked using `getStudentProfileProgress` API.
*   **`/` (Student Home)**:
    *   **Workflow**: The main dashboard showing a summary of available opportunities and their status. Blocked if the profile is incomplete.
*   **`/jobs` (Job Profiles)**:
    *   **Workflow**: Using `JobProfiles.jsx`, students can view all job postings, internships, and opportunities posted by TPOs and TPCs.
*   **`/profile` (My Profile)**:
    *   **Workflow**: Read-only overview of the student's personal details, verified academic records, and skills.
*   **`/resume` & `/resume/:resumeId/preview` (Resume Builder)**:
    *   **Workflow**: Allows the student to generate automated resumes using the data provided in their profile forms.

### 1.3 TPC Dashboard (`/tpc-dashboard/*`)
*   **`/` (TPC Dashboard)**: 
    *   Main statistics area for coordinators.
*   **`/student-verification` (Verification Center)**: 
    *   **Workflow**: Crucial functionality where TPCs review newly registered students. They check the submitted profile data and documents to mark the student as "Verified". Handled via `StudentListPage` and `StudentDetailsPage`.
*   **`/notice-board` (Notice Compose Center)**:
    *   **Workflow**: TPCs can draft and potentially publish notices specifically targeting segments of students.

### 1.4 TPO Dashboard (`/tpo-dashboard/*`)
*   **`/` (Overview)**: 
    *   High-level analytics of the placement drive (placement rates, total active students, pending interviews).
*   **`/students` (Student Management)**: 
    *   **Workflow**: Gives the TPO administrative oversight of all students in the portal (`TpoStudentListPage`, `TpoStudentDetailsPage`). TPO can resolve disputes or push manual verifications.
*   **`/placements` (Placements / Jobs)**: 
    *   **Workflow**: Where new jobs/drives are created. Handled in `Placements.jsx`.
*   **`/placements/:placementId/applicants` (Application Tracking)**: 
    *   **Workflow**: `ApplicantsPage.jsx` fetches and iterates over every student who has applied to a specific placement drive, managing their statuses (Shortlisted, Rejected, Placed).
*   **`/tpc` (TPC Management)**: 
    *   **Workflow**: The TPO provisions and manages permissions for TPC (Coordinators) acting within the system.

---

## 2. Backend Workflow (Server)

The backend is built with **Node.js** and **Express**. It handles logic, role-validation middlewares, Firebase integrations, file uploads (Multer), and interactions with MySQL.

### 2.1 Initialization (`index.js`)
*   Global Entry Point. Sets up CORS to allow the frontend (`http://localhost:5173`), JSON body parsing, static file service (`/uploads` for resumes and images), and mounts all the modular routers.

### 2.2 Student Infrastructure (`/routes/student_routes/`)
*   `student_login_routes.js`: Exposes `/student/signup`, `/student/login`. Hands out JWTs upon hashing/validation with `bcrypt`. 
*   `student_form_routes.js`: Captures the multi-step frontend profile form (Personal info, Academic info, Skills). Validates and writes heavily into the database.
*   `studentprofile_get_routes.js`: Fetches aggregated data about the student so the frontend can populate the `/student-panel/profile` view.
*   `student_resume_routes.js`: Endpoints to handle resume creation, generation mapping, and fetching.

### 2.3 TPC Infrastructure (`/routes/tpc_routes/`)
*   `tpc_login_routes.js`: Authentication for coordinators.
*   `tpc_student_verification_routes.js`: Highly sensitive endpoints (`GET` to fetch unverified candidates, `POST`/`PUT` to approve or reject a candidate's profile). Once a TPC hits this API, the student is unlocked for applying to jobs.
*   `tpc_opportunities_routes.js`: Routes for TPCs to post standard jobs/drives logic, fetching applied students, handling eligibility criteria.

### 2.4 TPO Infrastructure (`/routes/tpo_routes/`)
*   `tpo_login_routes.js`: Master authorization.
*   `tpo_student_management_routes.js`: Endpoints delivering system-wide views of all students, offering TPOs master-override actions over student profiles.
*   `tpo_placements_routes.js`: TPO-level management of final placement drives.
*   `application_tracking/tpo_application_tracking_routes.js`: Endpoints allowing TPOs to shift the state of an application (e.g., Pending -> Interviewing -> Placed).
*   `tpo_notice_routes.js`: Dedicated routes fetching or broadcasting notices globally.
*   `tpo_tpc_routes.js`: Routes strictly enabling the TPO to create/delete TPC access accounts.

### 2.5 Common Infrastructure
*   `uploadRoutes.js`: Powered by `multer`, handles capturing PDFs, avatars, and attachments directly into the locally served `/uploads` directory or cloud bucket.
*   `/middleware/authMiddleware.js`: Intercepts API requests, decrypts the JWT token, and checks whether the `role` matches the expected scope (`student`, `tpc`, or `tpo`).

---

## Summary of Data Flow (User Journey)
1. **Student Registration**: Student maps fields in `Signup` -> Submits the massive `Profile Form`. State is marked as unverified.
2. **TPC Action**: The TPC logs in, visits the `/student-verification` route, fetches the student, checks the uploaded docs, and accepts them.
3. **Drive Creation**: The TPO logs in, navigates to `/placements` and creates a Job Opportunity.
4. **Application**: The verified Student goes to `/jobs`, sees the new drive, and clicks Apply.
5. **Tracking**: The TPO/TPC checks the `/placements/:id/applicants` view, sees the applied student, conducts offline processes, and marks them as **Selected**.
