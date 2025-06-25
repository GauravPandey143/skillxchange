import { useState } from 'react';

function OtpVerification({ email, onVerified }) {
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendOtp = async () => {
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setServerOtp(data.otp); // For demo/testing
        setError('');
        setSuccess(`OTP sent to ${email}`);
      } else {
        throw new Error(data.error || 'Error sending OTP');
      }
    } catch (err) {
      setError('Failed to send OTP');
      console.error(err);
    }
  };

  const verifyOtp = () => {
    if (userOtp === serverOtp) {
      setSuccess('OTP Verified ✔️');
      setError('');
      onVerified(); // 👈 fire the actual signup or email change logic
    } else {
      setError('Incorrect OTP ❌');
    }
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '1.5rem',
      borderRadius: '12px',
      maxWidth: '400px',
      margin: '2rem auto',
      color: 'white',
      textAlign: 'center'
    }}>
      <h3>Verify Email</h3>
      <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Email: {email}</p>

      {!otpSent ? (
        <button onClick={sendOtp} style={{
          marginTop: '1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.6rem 1.2rem',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Send OTP
        </button>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={userOtp}
            onChange={(e) => setUserOtp(e.target.value)}
            style={{
              marginTop: '1rem',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #444',
              width: '100%',
              color: 'white',
              backgroundColor: '#121212'
            }}
          />
          <button
            onClick={verifyOtp}
            style={{
              marginTop: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Verify OTP
          </button>
        </>
      )}

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'lime', marginTop: '1rem' }}>{success}</p>}
    </div>
  );
}

export default OtpVerification;
