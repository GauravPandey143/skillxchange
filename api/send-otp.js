import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  console.log("Received request:", req.method, req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    console.log("Missing email");
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Optional: Save OTP in memory/db if needed for verification
  console.log(`Generated OTP for ${email}:`, otp);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER, // stored in Vercel
        pass: process.env.MAIL_PASS  // App password
      }
    });

    const mailOptions = {
      from: `SkillXchange <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<p style="font-size: 18px;">Your OTP code is: <strong>${otp}</strong></p>`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, otp }); // you can remove `otp` from response later
  } catch (error) {
    console.error('Failed to send email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
}
