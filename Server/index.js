const express = require('express');
const cors = require('cors');
const path = require('path');
const studentFormRoutes = require('./routes/student_routes/student_form_routes');
const studentLoginRoutes = require('./routes/student_routes/student_login_routes');
const studentProfileGetRoutes = require('./routes/student_routes/studentprofile_get_routes');


const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/student/form', studentFormRoutes);
app.use('/student/profile', studentProfileGetRoutes);
app.use('/student', studentLoginRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


app.get('/', (req, res) => {
    res.send('Hello from the server!');
});



