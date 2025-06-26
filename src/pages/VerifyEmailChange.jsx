import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { updateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function VerifyEmailChange() {
  const query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, () => setAuthReady(true));
  return unsubscribe;
  }, []);

    useEffect(() => {
    if (!authReady) return;
    const verify = async () => {
    const token = query.get('token');
      if (!token) {
        setStatus('Invalid verification link.');
        return;
      }
      try {
        // 1. Verify token with backend
        const res = await axios.post('http://localhost:5000/api/verify-email-token', { token });
        if (!res.data.success) {
          setStatus('Invalid or expired verification link.');
          return;
        }
        const { newEmail, uid } = res.data;
        // 2. Check if logged in as the correct user
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
          setStatus('You must be logged in as the correct user to complete this change.');
          return;
        }
        // 3. Update email in Firebase Auth
        await updateEmail(auth.currentUser, newEmail);
        // 4. Update Firestore
        await setDoc(doc(db, 'users', uid), { email: newEmail }, { merge: true });
        setStatus('Email updated successfully! You can now use your new email to log in.');
        setTimeout(() => navigate('/profile'), 3000);
      } catch (err) {
        setStatus('Failed to verify or update email. ' + (err.message || ''));
        console.error(err);
      }
    };
  verify();
}, [authReady, query, navigate]);

  // Consistent style with your app's card look
  const cardStyle = {
    maxWidth: 500,
    margin: '6rem auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: '2.5rem 2rem',
    color: '#222',
    fontSize: 18,
    letterSpacing: '0.01em'
  };

  const statusColor =
    status.includes('successfully') ? '#1E90FF'
    : status.includes('Verifying') ? '#888'
    : status.includes('Invalid') ? '#d32f2f'
    : status.includes('Failed') ? '#d32f2f'
    : '#222';

  if (!authReady) {
  return (
    <div style={cardStyle}>
      <div style={{ color: '#888', fontWeight: 400, marginBottom: 8 }}>Checking authentication...</div>
    </div>
  );
}  

  return (
    <div style={cardStyle}>
      <div style={{ color: statusColor, fontWeight: 400, marginBottom: 8 }}>{status}</div>
      {status === 'Email updated successfully! You can now use your new email to log in.' && (
        <div style={{ color: '#1E90FF', marginTop: 12, fontSize: 18 }}>
          Redirecting to your profile...
        </div>
      )}
    </div>
  );
}

export default VerifyEmailChange;