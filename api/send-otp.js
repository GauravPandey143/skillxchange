import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await resend.emails.send({
      from: 'SkillXchange <onboarding@resend.dev>',
      to: email,
      subject: 'Your SkillXchange OTP',
      html: `<h2>Here is your OTP: <strong>${otp}</strong></h2>`
    });

    // For testing, return the OTP. Remove in production!
    return res.status(200).json({ success: true, otp });
  } catch (error) {
    console.error("Mail error:", error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
