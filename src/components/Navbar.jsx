import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    alert('Logged out');
    navigate('/login');
  };

  return (
    <nav
      style={{
        position: 'sticky', // Make navbar sticky
        top: 0,             // Stick to the top
        zIndex: 1000,       // Ensure it stays above other content
        padding: '1rem',
        backgroundColor: '#000000',
        bottomborder: '2px solid #ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', gap: '3rem' }}>
        <Link style={{ color: '#ffffff', textDecoration: 'none' }} to="/">Chats</Link>
        <Link style={{ color: '#ffffff', textDecoration: 'none' }} to="/offer">Offer Skill</Link>
        <Link style={{ color: '#ffffff', textDecoration: 'none' }} to="/find">Find Skill</Link>
      </div>

      <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        {!loggedIn ? (
          <>
            <Link style={{ color: '#ffffff', textDecoration: 'none' }} to="/login">Login</Link>
            <Link style={{ color: '#ffffff', textDecoration: 'none' }} to="/signup">Signup</Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#1E90FF',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
