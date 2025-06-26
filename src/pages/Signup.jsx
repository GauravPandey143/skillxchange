import { useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updatePassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import GreenTick from '../assets/GreenTick.svg';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerifyBox, setShowVerifyBox] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [tempUserCreated, setTempUserCreated] = useState(false);
  const navigate = useNavigate();

  // Styles
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

  const verifyButtonStyle = {
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

  // Step 1: Send verification email (create temp user with random password)
  const handleShowVerifyBox = async (e) => {
    e.preventDefault();
    setSignupError('');
    setVerifyError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSignupError('Please enter a valid email.');
      return;
    }
    setShowVerifyBox(true);
    setEmailVerifyLoading(true);
    setVerificationSent(false);
    setEmailVerified(false);

    try {
      // If user already exists, don't create again
      if (!tempUserCreated) {
        // Use a random password for temp user creation
        const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
        await createUserWithEmailAndPassword(auth, email, tempPass);
        setTempUserCreated(true);
      }
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      setVerifyError('');
      alert('A verification link has been sent to your email. Please verify your email, then click "Check Verification".');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setVerifyError('Email already in use.');
      } else {
        setVerifyError('Failed to send verification email.');
      }
    }
    setEmailVerifyLoading(false);
  };

  // Step 2: Check if email is verified
  const handleCheckVerification = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setEmailVerifyLoading(true);
    try {
      // Try to sign in with the temp user (should already be signed in)
      if (auth.currentUser && auth.currentUser.email === email) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setEmailVerified(true);
          setVerifyError('');
          alert('Email verified! You can now set your password and sign up.');
        } else {
          setVerifyError('Email not verified yet. Please check your inbox and click the verification link.');
        }
      } else {
        setVerifyError('Please use the same browser/tab after verifying your email.');
      }
    } catch (err) {
      setVerifyError('Error checking verification. Please try again.');
    }
    setEmailVerifyLoading(false);
  };

  // Step 3: Complete signup (set password and save user)
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!name || !email || !password) {
      setSignupError('Please fill all fields.');
      return;
    }
    if (!emailVerified) {
      setSignupError('Please verify your email before signing up.');
      return;
    }
    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    setSignupLoading(true);
    try {
      // Set the real password for the user
      await updatePassword(auth.currentUser, password);
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });
      alert("Signup successful! Please login.");
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      setSignupError(`Signup failed: ${err.message}`);
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
            disabled={emailVerified}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailVerified(false);
                setShowVerifyBox(false);
                setVerificationSent(false);
                setVerifyError('');
                setTempUserCreated(false);
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
                style={verifyButtonStyle}
                onClick={handleShowVerifyBox}
                tabIndex={-1}
                disabled={emailVerified || emailVerifyLoading}
              >
                Verify
              </button>
            )}
            {emailVerified && (
              <span style={tickImgStyle}>
                <img src={GreenTick} alt="Verified" style={{ width: 28, height: 28, display: 'block' }} />
              </span>
            )}
          </div>
          {/* Email verification box */}
          {showVerifyBox && !emailVerified && (
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
              <div style={{ color: '#1E90FF', fontWeight: 500, marginBottom: 6 }}>
                {verificationSent
                  ? 'A verification link has been sent to your email. Please verify, then click below.'
                  : 'Sending verification email...'}
              </div>
              <button
                type="button"
                style={buttonStyle}
                onClick={handleCheckVerification}
                disabled={emailVerifyLoading}
              >
                {emailVerifyLoading ? 'Checking...' : "Check Verification"}
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
                  setShowVerifyBox(false);
                  setVerifyError('');
                }}
              >
                Cancel
              </button>
              {verifyError && (
                <div style={{ color: '#ff3b3b', fontWeight: 500, marginTop: 6 }}>
                  {verifyError}
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
            disabled={!emailVerified}
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
