# Implementation Summary: TPC Login, JWT Tokenization with Department, and TPC Management

## Overview
This implementation adds complete TPC (Training & Placement Coordinator) functionality to the Training & Placement Portal with department-level access control through JWT tokens.

## Changes Made

### Backend Changes

#### 1. JWT Token Service Updates
**File:** `Server/utils/tokenService.js`
- Updated `createTokenPayload()` to include department information for TPC users
- Updated `createAuthResponse()` to include department in the user response for TPC users
- TPC users now receive department in both access token and response payload

#### 2. TPC Login Endpoint
**File:** `Server/routes/tpc_routes/tpc_login_routes.js` (NEW)
- Implemented TPC login endpoint (`POST /tpc/login`)
- Validates TPC credentials from `TPC_Credentials` table
- Returns JWT tokens with department information
- Implements token refresh endpoint (`POST /tpc/refresh`)
- Implements logout endpoint (`POST /tpc/logout`)

#### 3. Student Login Updates
**File:** `Server/routes/student_routes/student_login_routes.js`
- **Removed role parameter** from signup - students always have 'student' role
- **Updated signup endpoint** to not require role selection
- **Simplified login** to automatically set role as 'student'
- Database no longer requires role selection for students

#### 4. Authentication Middleware
**File:** `Server/middleware/authMiddleware.js`
- Added `requireTPCDepartmentAccess()` middleware for department-level access control
- Enforces that TPC users can only access data for their assigned department
- Exported new middleware for use in routes

#### 5. TPC Management Routes
**File:** `Server/routes/tpo_routes/tpo_tpc_routes.js` (NEW)
- `GET /tpo/tpc/list` - List all TPCs
- `GET /tpo/tpc/:id` - Get specific TPC details
- `POST /tpo/tpc/create` - Create new TPC credentials
- `PUT /tpo/tpc/:id` - Update TPC credentials
- `DELETE /tpo/tpc/:id` - Delete TPC

#### 6. Server Configuration
**File:** `Server/index.js`
- Imported TPC login routes
- Imported TPC management routes
- Registered routes:
  - `/tpc` - TPC login endpoints
  - `/tpo/tpc` - TPC management endpoints (TPO only)

#### 7. Database Migration
**File:** `Server/migrations/001_create_tpc_credentials.sql` (NEW)
- Creates `TPC_Credentials` table with:
  - `id` (auto-increment)
  - `email` (unique, indexed)
  - `password` (hashed)
  - `department_name` (indexed for filtering)
  - `is_active` (status flag)
  - `created_at` / `updated_at` (timestamps)

### Frontend Changes

#### 1. Signup Page Updates
**File:** `Client/src/components/loginPage/SignupPage.jsx`
- Removed role selector (only students can sign up)
- Updated form to include only PRN, email, password fields
- Changed description from "students and faculty" to "students"
- Removed role parameter from signup API call

#### 2. Login Page Updates
**File:** `Client/src/components/loginPage/LoginPage.jsx`
- Changed "Faculty" label to "TPC"
- Updated description from "students and faculty" to  "students, faculty and TPO"
- Login form now allows Student/TPC/TPO selection

#### 3. Authentication API
**File:** `Client/src/shared/authApi.js`
- Updated `loginUser()` to route to correct endpoint based on role
- TPC users now login via `/tpc/login` endpoint

#### 4. API Client Configuration
**File:** `Client/src/shared/apiClient.js`
- Updated `performRefresh()` to use correct endpoint based on user role
- TPC users refresh via `/tpc/refresh`
- Student users refresh via `/student/refresh`

#### 5. TPC Management Page
**File:** `Client/src/TPO/pages/TPCManagement.jsx` (NEW)
- Full page component for managing TPCs by TPO admin
- Form to add new TPC with validation
- List view of existing TPCs showing:
  - Email
  - Department name
  - Active/Inactive status
  - Delete action
- Real-time form validation with error messages

#### 6. TPC API Service
**File:** `Client/src/TPO/services/tpcApi.js` (NEW)
- `fetchTPCList()` - Get list of all TPCs
- `fetchTPCById()` - Get specific TPC details
- `createTPC()` - Create new TPC
- `updateTPC()` - Update TPC info
- `deleteTPCById()` - Delete TPC

#### 7. TPO Sidebar Navigation
**File:** `Client/src/TPO/pages/Tpo_sidebar.jsx`
- Added "TPC" navigation item with trending up icon
- Points to `/tpo-dashboard/tpc` route

#### 8. App Routing
**File:** `Client/src/App.jsx`
- Imported `TPCManagement` component
- Created `TpoTPCManagementApp()` wrapper function
- Added route: `GET /tpo-dashboard/tpc` for TPC management page

### Key Features

#### 1. Department-Based Access Control
- TPC JWT tokens include `department` field
- Middleware validates TPC can only access their department's data
- Authorization at both token and endpoint level

#### 2. Seamless Authentication Flow
- Student signup without role selection
- TPC login with department assignment
- TPO uses static credentials
- Automatic token refresh with correct endpoints

#### 3. TPC Management Interface
- TPO admins can add/remove TPCs
- Department assignment at creation time
- Active/inactive status management
-Real-time validation and error handling

#### 4. Database Schema
- Proper indexing on frequently queried fields
- Automatic timestamps for audit trail
- Unique email constraint
- Foreign key relationship potential

## Database Setup

Run the migration file to create the TPC_Credentials table:

```sql
-- From Server/migrations/001_create_tpc_credentials.sql
CREATE TABLE IF NOT EXISTS TPC_Credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_department (department_name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**NOTE:** If you have existing `role` column in `Student_Credentials`, you should remove it or update all student records to have `role = 'student'` first.

## Testing Checklist

- [ ] Student signup works without role selection
- [ ] Student login works and routes to student panel
- [ ] TPC login works with correct department in token
- [ ] TPO can add new TPCs via management page
- [ ] TPO can view list of all TPCs with departments
- [ ] TPO can delete TPCs
- [ ] Token refresh works for both students and TPCs
- [ ] Protected routes properly validate department access for TPCs
- [ ] Form validation displays appropriate error messages
- [ ] Mobile responsiveness works on TPC management page

## API Endpoints Summary

### Student Authentication
- `POST /student/signup` - Register as student
- `POST /student/login` - Login as student
- `POST /student/refresh` - Refresh student token

### TPC Authentication
- `POST /tpc/login` - Login as TPC
- `POST /tpc/refresh` - Refresh TPC token
- `POST /tpc/logout` - Logout TPC

### TPC Management (TPO Only)
- `GET /tpo/tpc/list` - List all TPCs
- `GET /tpo/tpc/:id` - Get TPC details
- `POST /tpo/tpc/create` - Create TPC
- `PUT /tpo/tpc/:id` - Update TPC
- `DELETE /tpo/tpc/:id` - Delete TPC

## Security Considerations

1. **Passwords:** All passwords are hashed using bcrypt with 12 rounds
2. **JWT:** Uses HS256 algorithm with secure secrets
3. **Department Validation:** TPC access is restricted to their assigned department
4. **Email Validation:** Only @ritindia.edu emails allowed
5. **Token Expiry:** Access tokens expire in 1 hour, refresh tokens in 6 hours
6. **HTTP-Only Cookies:** Refresh tokens stored in secure cookies

## Future Enhancements

1. Add password reset functionality
2. Implement department-level job posting restrictions
3. Add audit logging for TPC actions
4. Create TPC performance metrics dashboard
5. Implement TPC approval workflow
6. Add bulk import for TPCs via CSV
