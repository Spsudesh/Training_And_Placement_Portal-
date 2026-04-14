# Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
- [ ] **CRITICAL:** Back up your current database before making any changes
- [ ] Run the SQL migration from `Server/migrations/001_create_tpc_credentials.sql` to create the `TPC_Credentials` table
- [ ] Verify the table was created successfully:
  ```sql
  SHOW TABLES LIKE 'TPC_Credentials';
  DESCRIBE TPC_Credentials;
  ```
- [ ] If you have a `role` column in `Student_Credentials`, plan to remove it (optional but recommended)

### 2. Environment Variables
- [ ] Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `.env` (server)
- [ ] Verify `CLIENT_URL` is correctly set for CORS in `.env`
- [ ] Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set

### 3. Dependencies
- [ ] Ensure `bcrypt` package is installed on server
- [ ] Ensure `axios` is installed on client (should already be)
- [ ] Run `npm install` in both `Client` and `Server` directories

### 4. Build & Start

#### Server:
```bash
cd Server
npm install
npm run start
```

#### Client:
```bash
cd Client
npm install
npm run dev
```

## Post-Deployment Verification

### 1. Student Authentication Flow
- [ ] Navigate to `/login`
- [ ] Try signup with Student role
  - Enter valid PRN, @ritindia.edu email, password
  - Should NOT see role selector (only showing for login now)
  - Should redirect to login after successful signup
- [ ] Login as student
  - Should show Student/TPC/TPO role options
  - Should route to student panel
  - Profile form should appear if profile not completed

### 2. TPC Authentication Flow
- [ ] Create TPC credentials through TPO panel
- [ ] Logout from student account
- [ ] Login with TPC email/password
  - Select "TPC" role
  - Should include department in token
  - Should route to `/tpc-dashboard`

### 3. TPO TPC Management
- [ ] Login as TPO (tpo@ritindia.edu / TPO)
- [ ] Navigate to TPO Dashboard
- [ ] Click on "TPC" menu item (new option with trending up icon)
- [ ] Test form validation:
  - [ ] Try submitting empty form (should show errors)
  - [ ] Try non-@ritindia.edu email (should show error)
  - [ ] Try password < 6 chars (should show error)
  - [ ] Submit valid form (should appear in list)
- [ ] Verify TPC appears in list with correct:
  - [ ] Email
  - [ ] Department
  - [ ] Active status
- [ ] Test delete TPC (confirmation should appear)

### 4. Token & Auth Flow
- [ ] Verify access tokens include department for TPC users (check JWT in browser devtools)
- [ ] Test token refresh (should work for both students and TPCs)
- [ ] Test session expiry warning at 4 hours remaining
- [ ] Test automatic logout after 6 hours

### 5. API Endpoints
Using Postman or similar tool, test:
- [ ] `POST /student/signup` - Create student account
- [ ] `POST /student/login` - Login as student
- [ ] `POST /tpc/login` - Login as TPC
- [ ] `GET /tpo/tpc/list` - List TPCs (requires TPO token)
- [ ] `POST /tpo/tpc/create` - Create TPC (requires TPO token)
- [ ] `DELETE /tpo/tpc/:id` - Delete TPC (requires TPO token)

## Troubleshooting

### Common Issues

#### 1. "TPC_Credentials table doesn't exist"
- [ ] Run the migration SQL file
- [ ] Verify table was created: `SHOW TABLES;`
- [ ] Check database connection in `.env`

#### 2. "Role still appears in signup"
- [ ] Clear browser cache and localStorage
- [ ] Verify SignupPage.jsx changes were applied
- [ ] Restart client dev server: `npm run dev`

#### 3. "TPC login not working"
- [ ] Verify TPC was added through management page
- [ ] Check TPC email is correct (case-insensitive)
- [ ] Verify TPC_Credentials table has correct data: `SELECT * FROM TPC_Credentials;`
- [ ] Check server logs for errors

#### 4. "Department not in token"
- [ ] Verify TPC was added with department_name
- [ ] Check tokenService.js includes department for 'tpc' role
- [ ] Restart server: `npm run start`
- [ ] Verify token in devtools JWT decoder

#### 5. "Cannot add TPC"
- [ ] Verify you're logged in as TPO
- [ ] Check form validation messages
- [ ] Verify email is not already used
- [ ] Check server console for API errors
- [ ] Verify TPC_Credentials table permissions

### Debug Mode

To enable more detailed logging:

**Server:**
Add to `index.js` before routes:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Client:**
Add to `TPCManagement.jsx`:
```javascript
catch (error) {
  console.error('Full error:', error);
  console.error('Response:', error.response?.data);
  // ... rest of catch block
}
```

## Rollback Plan

If issues occur:

1. **Keep database backup**
2. **Revert specific files if needed**
3. **Clear browser cache and localStorage**
4. **Restart both server and client**

To revert database:
```sql
DROP TABLE TPC_Credentials;
```

## Performance Optimization (Optional)

- [ ] Add database indexes on frequently queried fields (already done)
- [ ] Implement pagination for TPC list if > 100 TPCs
- [ ] Cache TPC list in component state with refresh button
- [ ] Consider adding API request debouncing

## Security Review

- [ ] All passwords are hashed with bcrypt
- [ ] JWT secrets are strong and randomized
- [ ] Department validation prevents cross-department access
- [ ] Email validation restricts to institutional domain
- [ ] Tokens expire appropriately
- [ ] Refresh tokens stored in HTTP-only cookies

## Documentation

- [ ] Share IMPLEMENTATION_SUMMARY.md with team
- [ ] Document custom admin procedures for TPC addition
- [ ] Create user guides for TPC and TPO users
- [ ] Document any customizations made to default implementation
