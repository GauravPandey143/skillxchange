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
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#fff',
      borderBottom: '2px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '0.7rem 0'
    }}>
      <div className="navbar-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.2rem',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        {loggedIn && (
          <Link className="navbar-link" to="/profile" style={{ fontWeight: 600, color: '#1E90FF', textDecoration: 'none' }}>Profile</Link>
        )}
        <Link className="navbar-link" to="/" style={{ fontWeight: 600, color: '#1E90FF', textDecoration: 'none' }}>Chats</Link>
        <Link className="navbar-link" to="/offer" style={{ fontWeight: 600, color: '#1E90FF', textDecoration: 'none' }}>Offer Skill</Link>
        <Link className="navbar-link" to="/find" style={{ fontWeight: 600, color: '#1E90FF', textDecoration: 'none' }}>Find Skill</Link>
        {!loggedIn ? (
          <>
            <Link to="/login" className="navbar-btn" style={{
              background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 18,
              padding: '0.5rem 1.2rem',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              marginLeft: '0.5rem'
            }}>Login</Link>
            <Link to="/signup" className="navbar-btn" style={{
              background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 18,
              padding: '0.5rem 1.2rem',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              marginLeft: '0.5rem'
            }}>Signup</Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="navbar-btn"
            style={{
              background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 18,
              padding: '0.5rem 1.2rem',
              fontWeight: 600,
              fontSize: '1rem',
              marginLeft: '0.5rem',
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
