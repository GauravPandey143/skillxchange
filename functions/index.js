const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// ✅ Configure your Gmail + App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'gauravp3512@gmail.com',      // replace with your Gmail
    pass: 'sssd jrtp ngfq obrl'         // use an App Password, NOT your Gmail password
  }
});

exports.sendOtpEmail = functions.https.onCall(async (data, context) => {
  const { email } = data;

  // ✅ Validate input
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
  }

  // ✅ Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Store OTP in Firestore (temporary)
  await db.collection('emailOtps').doc(email).set({
    otp,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // ✅ Send email
  const mailOptions = {
    from: 'SkillXchange <gauravp3512@gmail.com>', // use your Gmail here
    to: email,
    subject: 'SkillXchange OTP Verification',
    text: `Your OTP for email change is: ${otp}. It will expire in 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email.');
  }
});
