const express = require('express');
const cors = require('cors');
const studentFormRoutes = require('./routes/student_routes/student_form_routes');
const studentLoginRoutes = require('./routes/student_routes/student_login_routes');
const studentProfileGetRoutes = require('./routes/student_routes/studentprofile_get_routes');
const tpcStudentVerificationRoutes = require('./routes/tpc_routes/tpc_student_verification_routes');
const tpcOpportunitiesRoutes = require('./routes/tpc_routes/tpc_opportunities_routes');
const tpoPlacementsRoutes = require('./routes/tpo_routes/tpo_placements_routes');
const tpoNoticeRoutes = require('./routes/tpo_routes/tpo_notice_routes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello from the server!');
});

app.use('/upload', uploadRoutes);
app.use('/student/form', studentFormRoutes);
app.use('/student/profile', studentProfileGetRoutes);
app.use('/student', studentLoginRoutes);
app.use('/student/placements', tpoPlacementsRoutes);
app.use('/tpc/verification', tpcStudentVerificationRoutes);
app.use('/tpc/opportunities', tpcOpportunitiesRoutes);
app.use('/tpc/notices', tpoNoticeRoutes);
app.use('/tpo/opportunities', tpcOpportunitiesRoutes);
app.use('/tpo/placements', tpoPlacementsRoutes);
app.use('/tpo/notices', tpoNoticeRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



