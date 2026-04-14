const db = require('../config/db').db;

const createTPCTable = () => {
  return new Promise((resolve, reject) => {
    const sql = `
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
    `;

    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error creating TPC_Credentials table:', err);
        reject(err);
      } else {
        console.log('✅ TPC_Credentials table created/verified successfully');
        resolve(result);
      }
    });
  });
};

const verifyTableStructure = () => {
  return new Promise((resolve, reject) => {
    const sql = 'DESCRIBE TPC_Credentials';

    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error verifying table structure:', err);
        reject(err);
      } else {
        console.log('✅ TPC_Credentials table structure verified:');
        console.table(result);
        resolve(result);
      }
    });
  });
};

const setup = async () => {
  try {
    console.log('Setting up TPC_Credentials table...');
    await createTPCTable();
    await verifyTableStructure();
    console.log('✅ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setup();
