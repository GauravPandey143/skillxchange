import React from 'react';

function TestOTP() {
  const sendOtp = async () => {
    const res = await fetch('https://skillxchange-eight.vercel.app//api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'gauravp3512@gmail.com' }) // 👈 replace with your Gmail
    });

    const data = await res.json();
    console.log('Server Response:', data);

    if (data.success) {
      alert('OTP sent successfully!');
    } else {
      alert('Failed to send OTP.');
    }
  };

  return <button onClick={sendOtp}>Send Test OTP</button>;
}

export default TestOTP;
