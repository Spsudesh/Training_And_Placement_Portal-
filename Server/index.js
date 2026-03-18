const express = require('express');
const studentRoutes = require('./routes/student_routes');

const app = express();

app.use(express.json());
app.use('/student', studentRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


app.get('/', (req, res) => {
    res.send('Hello from the server!');
});



