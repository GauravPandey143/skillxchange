// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'your-very-secret-key'; // Change this in production!
const CLIENT_URL = 'http://localhost:5173'; // Your frontend URL

// Configure nodemailer (use your real SMTP in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'gauravp3512@gmail.com',
    pass: 'sssdjrtpngfqobrl' // Use an App Password, NOT your Gmail password
  }
});

// Send verification email
app.post('/api/send-verify-link', async (req, res) => {
  const { newEmail, uid } = req.body;
  if (!newEmail || !uid) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  // Create a token valid for 1 hour
  const token = jwt.sign({ newEmail, uid }, JWT_SECRET, { expiresIn: '1h' });
  const verifyUrl = `${CLIENT_URL}/verify-email-change?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"SkillXchange" <gauravp3512@gmail.com>',
      to: newEmail,
      subject: 'Verify your new email address',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your new email address.</p>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

// Verify token endpoint (for frontend to call)
app.post('/api/verify-email-token', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, newEmail: decoded.newEmail, uid: decoded.uid });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));