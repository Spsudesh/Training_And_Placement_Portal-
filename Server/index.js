const express = require('express');
const cors = require('cors');
const path = require('path');
const studentFormRoutes = require('./routes/student_routes/student_form_routes');
const studentLoginRoutes = require('./routes/student_routes/student_login_routes');
const studentProfileGetRoutes = require('./routes/student_routes/studentprofile_get_routes');
const studentResumeRoutes = require('./routes/student_routes/resume/student_resume_routes');
const tpcStudentVerificationRoutes = require('./routes/tpc_routes/tpc_student_verification_routes');
const tpcOpportunitiesRoutes = require('./routes/tpc_routes/tpc_opportunities_routes');
const tpoPlacementsRoutes = require('./routes/tpo_routes/tpo_placements_routes');
const tpoNoticeRoutes = require('./routes/tpo_routes/tpo_notice_routes');
const tpoStudentManagementRoutes = require('./routes/tpo_routes/tpo_student_management_routes');
const tpoApplicationTrackingRoutes = require('./routes/tpo_routes/application_tracking/tpo_application_tracking_routes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth, requireRole } = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Hello from the server!');
});

app.use('/student', studentLoginRoutes);
app.use('/upload', requireAuth, uploadRoutes);
app.use('/student/form', requireAuth, requireRole('student'), studentFormRoutes);
app.use('/student/profile', requireAuth, requireRole('student'), studentProfileGetRoutes);
app.use('/student/resumes', requireAuth, requireRole('student'), studentResumeRoutes);
app.use('/student/placements', requireAuth, requireRole('student'), tpoPlacementsRoutes);
app.use('/student/notices', requireAuth, requireRole('student'), tpoNoticeRoutes);
app.use('/tpc/verification', requireAuth, requireRole('tpc'), tpcStudentVerificationRoutes);
app.use('/tpc/opportunities', requireAuth, requireRole('tpc'), tpcOpportunitiesRoutes);
app.use('/tpc/notices', requireAuth, requireRole('tpc'), tpoNoticeRoutes);
app.use('/tpo/opportunities', requireAuth, requireRole('tpo'), tpcOpportunitiesRoutes);
app.use('/tpo/placements', requireAuth, requireRole('tpo'), tpoPlacementsRoutes);
app.use('/tpo/notices', requireAuth, requireRole('tpo'), tpoNoticeRoutes);
app.use('/tpo/application-tracking', requireAuth, requireRole('tpo'), tpoApplicationTrackingRoutes);
app.use('/tpo', requireAuth, requireRole('tpo'), tpoStudentManagementRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



