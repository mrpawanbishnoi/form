require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ensure the table includes ip_address and submitted_at
(async () => {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      ip_address VARCHAR(255) NOT NULL,  -- new column for IP address
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  client.release();
  console.log('✅ Table ensured with IP and timestamp.');
})();

app.post('/submit', async (req, res) => {
  const { name, email, message } = req.body;
  const ip = req.ip || req.connection.remoteAddress; // Get the user's IP address
  
  if (!name || !email || !message) {
    return res.status(400).send('All fields are required.');
  }

  try {
    await pool.query(
      'INSERT INTO submissions (name, email, message, ip_address) VALUES ($1, $2, $3, $4)',
      [name, email, message, ip]
    );
    res.send('Form submitted successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
