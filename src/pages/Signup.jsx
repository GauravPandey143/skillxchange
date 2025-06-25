import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import GreenTick from '../assets/GreenTick.svg'; // Use your SVG tick (without a circle background)

// Use Resend API route for OTP sending
const sendOtpToEmail = async (email) => {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.success) {
      alert('Failed to send OTP. Please try again.');
      return false;
    }
    window.localStorage.setItem('signupPendingEmail', email);
    window.localStorage.setItem('signupPendingOtp', data.otp); // For dev only
    alert(`OTP sent to ${email}`);
    return true;
  } catch (err) {
    alert('Error sending OTP. Try again.');
    return false;
  }
};

const verifyOtp = (inputOtp) => {
  // Accept "000000" as a valid OTP for demo/testing
  if (inputOtp === '000000') return true;
  const otp = window.localStorage.getItem('signupPendingOtp');
  return otp && inputOtp === otp;
};

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate();

  // Consistent styles with Profile.jsx and the rest of the app
  const cardStyle = {
    maxWidth: 900,
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: 0,
    minHeight: 'auto'
  };

  const formContainerStyle = {
    padding: '2rem 2rem 1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const inputStyle = {
    width: '100%',
    background: '#f6f8fa',
    borderRadius: 18,
    border: '1px solid #dcdcdc',
    padding: '0.7rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    marginBottom: 0,
    marginTop: 0,
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '0.8rem 0',
    fontWeight: 600,
    fontSize: '1.1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    width: '100%',
    transition: 'background 0.2s'
  };

  const sendOtpButtonStyle = {
    background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '0.3rem 1.1rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    verticalAlign: 'middle',
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '70%'
  };

  const tickImgStyle = {
    position: 'absolute',
    right: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none'
  };

  const handleShowOtpBox = (e) => {
    e.preventDefault();
    setSignupError('');
    setOtpError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSignupError('Please enter a valid email.');
      return;
    }
    setShowOtpBox(true);
    setOtpInput('');
    setEmailVerifyLoading(true);
    sendOtpToEmail(email).then(() => setEmailVerifyLoading(false));
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpInput) {
      setOtpError('Please enter the OTP.');
      return;
    }
    if (!verifyOtp(otpInput)) {
      setOtpError('Invalid OTP.');
      return;
    }
    setEmailVerified(true);
    setShowOtpBox(false);
    setOtpInput('');
    setOtpError('');
    alert('Email verified! You can now sign up.');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!emailVerified) {
      setSignupError('Please verify your email before signing up.');
      return;
    }
    setSignupLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
      });
      alert("Signup successful!");
      window.localStorage.removeItem('signupPendingEmail');
      window.localStorage.removeItem('signupPendingOtp');
      navigate('/offer');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setSignupError('Email already in use.');
      } else {
        setSignupError(`Signup failed: ${err.message}`);
      }
    }
    setSignupLoading(false);
  };

  return (
    <div style={cardStyle}>
      <div style={formContainerStyle}>
        <h2
          style={{
            marginBottom: '1.5rem',
            fontWeight: 700,
            fontSize: '1.6rem',
            color: '#222',
            textAlign: 'center',
            letterSpacing: '0.5px'
          }}
        >
          Create Your Account
        </h2>
        <form
          onSubmit={handleSignup}
          style={{
            background: '#fff',
            border: '2px solid #dcdcdc',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            width: '100%',
            maxWidth: 400
          }}
        >
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailVerified(false);
                setOtpInput('');
                setShowOtpBox(false);
              }}
              required
              style={{
                ...inputStyle,
                paddingRight: 90
              }}
              disabled={emailVerified}
            />
            {!emailVerified && (
              <button
                type="button"
                style={sendOtpButtonStyle}
                onClick={handleShowOtpBox}
                tabIndex={-1}
                disabled={emailVerified || emailVerifyLoading}
              >
                Send OTP
              </button>
            )}
            {emailVerified && (
              <span style={tickImgStyle}>
                <img src={GreenTick} alt="Verified" style={{ width: 28, height: 28, display: 'block' }} />
              </span>
            )}
          </div>
          {/* OTP verification box (like Profile page) */}
          {showOtpBox && (
            <div
              style={{
                background: '#f6f8fa',
                border: '1px solid #dcdcdc',
                borderRadius: 12,
                padding: '1.2rem',
                margin: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem'
              }}
            >
              <input
                style={inputStyle}
                type="text"
                placeholder="Enter OTP"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                required
              />
              <button
                type="button"
                style={buttonStyle}
                onClick={handleVerifyOtp}
                disabled={emailVerifyLoading}
              >
                {emailVerifyLoading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: '#eee',
                  color: '#222',
                  marginTop: 0
                }}
                onClick={() => {
                  setShowOtpBox(false);
                  setOtpInput('');
                  setSignupError('');
                  setOtpError('');
                }}
              >
                Cancel
              </button>
              {otpError && (
                <div style={{ color: '#ff3b3b', fontWeight: 500, marginTop: 6 }}>
                  {otpError}
                </div>
              )}
            </div>
          )}
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
            disabled={emailVerified && signupLoading}
          />
          <button type="submit" style={buttonStyle} disabled={signupLoading || !emailVerified}>
            {signupLoading ? "Signing Up..." : "Sign Up"}
          </button>
          {signupError && (
            <div style={{ color: '#ff3b3b', fontWeight: 500, marginTop: 6 }}>
              {signupError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Signup;
