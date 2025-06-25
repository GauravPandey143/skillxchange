import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'gauravp3512@gmail.com', // ✅ Your Gmail
      pass: 'sssd jrtp ngfq obrl'     // ✅ App password from Gmail
    }
  });

  const mailOptions = {
    from: 'SkillXchange <your.email@gmail.com>',
    to: email,
    subject: 'Your OTP for SkillXchange',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, otp }); // You may skip sending OTP to frontend in real apps
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
