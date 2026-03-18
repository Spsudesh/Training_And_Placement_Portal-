const express = require('express');
const router = express.Router();
const db = require('../config/db').db;


    // console.log("DB:", db);

// Example route for student login
router.post('/login', (req, res) => {
    const { PRN , password } = req.body;   

db.query(
    "SELECT * FROM Student_Credentials WHERE PRN = ?",
    [PRN],
    (err, result) => {

      if (err) {
        return res.status(500).json({ error: err });
      }

      // ❌ No user found
      if (result.length === 0) {
        return res.json({ success: false, message: "User not found" });
      }

      // ✅ Get first row
      const user = result[0];

      // ⚠️ TEMP (plain password check)
      if (password === user.Password) {
        return res.json({ success: true, message: "Login successful" });
      } else {
        return res.json({ success: false, message: "Invalid password" });
      }

    }
  );

    //SIMPLY CHECK PRN and passowrd in databse and return response accordingly

        // if (PRN === '12345' && password === 'password') {           
        //     res.json({ success: true, message: 'Login successful' });
        // }
        // else {

        //     res.json({ success: false, message: 'Invalid PRN or password' });


        // }       
});

module.exports = router;