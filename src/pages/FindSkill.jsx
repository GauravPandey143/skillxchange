import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import avatar from '../assets/avatar.svg';

function FindSkill() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, skillId: null });
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Track auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });

    // Fetch skill posts
    const q = query(collection(db, 'skills'), orderBy('timestamp', 'desc'));
    const unsubscribeSkills = onSnapshot(q, async (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkills(results);

      // Only set userSkills if logged in
      if (auth.currentUser) {
        const mine = results.filter(skill => skill.userId === auth.currentUser?.uid);
        setUserSkills(mine);
      } else {
        setUserSkills([]);
      }

      // Fetch user profiles for all skill posters
      const uniqueUserIds = [...new Set(results.map(skill => skill.userId).filter(Boolean))];
      const profiles = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              profiles[uid] = userDoc.data();
            }
          } catch (e) {
            // ignore
          }
        })
      );
      setUserProfiles(profiles);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSkills();
    };
  }, []);

  const filteredSkills = skills.filter((skill) =>
    skill.skillOffered?.toLowerCase().includes(search.toLowerCase()) ||
    skill.skillWanted?.toLowerCase().includes(search.toLowerCase())
  );

  // Consistent styles
  const cardStyle = {
    maxWidth: 900,
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem'
  };

  const inputStyle = {
    width: '100%',
    background: '#f6f8fa',
    borderRadius: 18,
    border: '1px solid #dcdcdc',
    padding: '0.7rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    margin: 'auto',
    marginBottom: '1.2rem',
    boxSizing: 'border-box',
    maxWidth: 500,
  };

  const skillCardStyle = (isMatch) => ({
    width: '100%',
    maxWidth: 500,
    margin: '0 auto 1.7rem auto',
    border: isMatch ? '2px solid #1E90FF' : '2px solid #e0e0e0',
    borderRadius: 18,
    backgroundColor: isMatch ? '#e6f4ff' : '#fafbfc',
    boxShadow: isMatch
      ? '0 2px 8px rgba(30,144,255,0.08)'
      : '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'border 0.2s, background 0.2s',
    padding: 0,
    overflow: 'hidden',
    display: 'block',
    boxSizing: 'border-box'
  });

  const profileSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '1.2rem 1.2rem 1.2rem 1.2rem',
    borderBottom: '1px solid #e0e0e0',
    background: '#f6f8fa'
  };

  const profilePicStyle = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '0.9rem',
    border: '2px solid #e0e0e0',
    background: '#eee',
    verticalAlign: 'middle'
  };

  const nameStyle = {
    fontWeight: 700,
    fontSize: '1.18rem',
    color: '#1E90FF',
    textDecoration: 'none'
  };

  const skillSectionStyle = {
    padding: '1.3rem 1.2rem 0.7rem 1.2rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  };

  const skillTextStyle = {
    fontWeight: 700,
    fontSize: '1.18rem',
    color: '#222',
    margin: 0,
    textTransform: 'capitalize'
  };

  const wantsTextStyle = {
    fontWeight: 700,
    fontSize: '1.18rem',
    color: '#1E90FF',
    margin: '0 0.4rem',
    textTransform: 'capitalize'
  };

  const dividerStyle = {
    border: 0,
    borderTop: '1px solid #e0e0e0',
    margin: 0
  };

  const buttonStyle = {
    background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '0.7rem 0',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    minWidth: 90,
    marginTop: '0.7rem',
    transition: 'background 0.2s'
  };

  const deleteButtonStyle = {
    background: 'linear-gradient(90deg, #ff3b3b 60%, #ff7b7b 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '0.7rem 0',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    minWidth: 90,
    marginTop: '0.7rem',
    transition: 'background 0.2s'
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const modalBoxStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: '2rem 2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    maxWidth: 350,
    width: '90%',
    textAlign: 'center'
  };

  const modalInputStyle = {
    width: '300px',
    background: '#fff',
    padding: '0.7rem 1rem',
    borderRadius: 10,
    border: '1px solid #dcdcdc',
    margin: '1.2rem 0 1.2rem 0',
    fontSize: '1rem',
    outline: 'none'
  };

  const modalAcceptButtonStyle = {
    ...deleteButtonStyle,
    width: 'auto',
    minWidth: 90,
    marginTop: 0,
    padding: '0.7rem 2.5rem'
  };

  // Handler for messaging when not logged in
  const handleMessageClick = (e) => {
    e.preventDefault();
    alert('You must be logged in to message someone.');
    navigate('/login');
  };

  // Handler for profile click when not logged in
  const handleProfileClick = (e) => {
    e.preventDefault();
    alert('You must be logged in to view profiles.');
    navigate('/login');
  };

  // Mask email for not logged in users
  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return 'xxx@' + (domain || '');
    return user[0] + 'xxx' + user[user.length - 1] + '@' + (domain || '');
  };

  // Delete skill logic
  const handleDeleteSkill = async () => {
    if (confirmText !== 'CONFIRM') {
      setConfirmError('Please enter the correct text.');
      return;
    }
    if (!deleteModal.skillId) return;
    try {
      await deleteDoc(doc(db, 'skills', deleteModal.skillId));
      setDeleteModal({ open: false, skillId: null });
      setConfirmText('');
      setConfirmError('');
    } catch (e) {
      alert('Failed to delete skill. Please try again.');
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={{
        marginBottom: '1.5rem',
        fontWeight: 700,
        fontSize: '1.6rem',
        color: '#222',
        textAlign: 'center',
        letterSpacing: '0.5px'
      }}>
        Available Skill Swaps
      </h2>

      <input
        type="text"
        placeholder="Search by skill (e.g. guitar, math)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      {filteredSkills.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>No matching skills found.</p>}

      <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: 500, margin: '0 auto' }}>
        {filteredSkills.map((skill, index) => {
          const isMatch = userSkills.some(mySkill =>
            skill.skillOffered?.toLowerCase() === mySkill.skillWanted?.toLowerCase() &&
            skill.skillWanted?.toLowerCase() === mySkill.skillOffered?.toLowerCase()
          );
          const userProfile = userProfiles[skill.userId] || {};
          const displayName = userProfile.name || 'User';
          const photoURL = userProfile.photoURL && userProfile.photoURL.trim() !== ''
            ? userProfile.photoURL
            : avatar;

          // Always use latest email from Firestore profile
          let contactDisplay = userProfile.email || '';
          if (!userId && contactDisplay) {
            contactDisplay = maskEmail(contactDisplay);
          }

          const isOwner = userId && userId === skill.userId;

          return (
            <li
              key={index}
              style={skillCardStyle(isMatch)}
            >
              {/* Profile picture and name at the top, clickable only if logged in */}
              <div style={profileSectionStyle}>
                {userId ? (
                  <Link
                    to={`/profile/${skill.userId}`}
                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    title={`View ${displayName}'s profile`}
                  >
                    <img
                      src={photoURL}
                      alt={displayName}
                      style={profilePicStyle}
                    />
                    <span style={nameStyle}>{displayName}</span>
                  </Link>
                ) : (
                  <a
                    href="#"
                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}
                    title="Login required to view profile"
                    onClick={handleProfileClick}
                  >
                    <img
                      src={photoURL}
                      alt={displayName}
                      style={profilePicStyle}
                    />
                    <span style={nameStyle}>{displayName}</span>
                  </a>
                )}
              </div>
              <hr style={dividerStyle} />
              {/* Skill offered and wanted in a single line, capitalized, black, blue for Wants */}
              <div style={skillSectionStyle}>
                <span style={skillTextStyle}>
                  {skill.skillOffered
                    ? skill.skillOffered.charAt(0).toUpperCase() + skill.skillOffered.slice(1)
                    : ''}
                </span>
                <span style={wantsTextStyle}>Wants</span>
                <span style={skillTextStyle}>
                  {skill.skillWanted
                    ? skill.skillWanted.charAt(0).toUpperCase() + skill.skillWanted.slice(1)
                    : ''}
                </span>
              </div>
              {/* Other details */}
              <div style={{ padding: '0 1.2rem 1.2rem 1.2rem' }}>
                {isMatch && (
                  <p style={{ color: '#1E90FF', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🎯 This is a perfect match!
                  </p>
                )}
                <p style={{ margin: '0.2rem 0' }}><strong>Location:</strong> {skill.location}</p>
                <p style={{ margin: '0.2rem 0' }}><strong>Contact:</strong> {contactDisplay}</p>
                <p style={{ margin: '0.2rem 0' }}><strong>Description:</strong> {skill.description}</p>
                {/* Only allow messaging if logged in and not your own post */}
                {isOwner ? (
                  <button
                    style={deleteButtonStyle}
                    onClick={() => {
                      setDeleteModal({ open: true, skillId: skill.id });
                      setConfirmText('');
                      setConfirmError('');
                    }}
                  >
                    Delete
                  </button>
                ) : userId && userId !== skill.userId ? (
                  <Link to={`/chat/${[userId, skill.userId].sort().join('_')}`}>
                    <button style={buttonStyle}>Message</button>
                  </Link>
                ) : !userId ? (
                  <button style={buttonStyle} onClick={handleMessageClick}>
                    Message
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ marginBottom: 16, color: '#ff3b3b' }}>Delete Skill Exchange?</h3>
            <p style={{ color: '#444', marginBottom: 8 }}>
              To confirm deletion, type <b>CONFIRM</b> below and click Accept.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => {
                setConfirmText(e.target.value);
                setConfirmError('');
              }}
              style={modalInputStyle}
              placeholder="Type CONFIRM"
              autoFocus
            />
            {confirmError && (
              <div style={{ color: '#ff3b3b', marginBottom: 8, fontWeight: 500 }}>
                {confirmError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                style={modalAcceptButtonStyle}
                onClick={handleDeleteSkill}
              >
                Accept
              </button>
              <button
                style={{
                  ...modalAcceptButtonStyle,
                  background: '#eee',
                  color: '#222',
                  marginLeft: 0
                }}
                onClick={() => {
                  setDeleteModal({ open: false, skillId: null });
                  setConfirmText('');
                  setConfirmError('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindSkill;
