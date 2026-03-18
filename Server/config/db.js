

const mySql = require('mysql2');

// const db = require('../config/db');
const db = mySql.createConnection({
    host: 'localhost',     
    user: 'root',
    password: 'root@123',
    database: 'Placement_Portal'
}); 

db.connect((err) => {
    if(err){
        console.log('Error connecting to database:', err);      
    } else {
        console.log('Connected to Placement_Portal');
    }           
});


module.exports = {db} ;