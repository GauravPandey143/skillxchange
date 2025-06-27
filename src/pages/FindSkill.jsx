import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

      // Only set userSkills if logged in and user still exists
      if (auth.currentUser && profiles[auth.currentUser.uid]) {
        const mine = results.filter(skill => skill.userId === auth.currentUser?.uid);
        setUserSkills(mine);
      } else {
        setUserSkills([]);
      }

      // Filter out skills whose user profile does not exist (deleted users)
      const filtered = results.filter(skill => profiles[skill.userId]);
      setSkills(filtered);
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

  // Available: not completed
  const availableSkills = filteredSkills.filter(skill => !skill.completed);

  // Completed: completed
  const completedSkills = filteredSkills.filter(skill => skill.completed);

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
    background: '#f6f8fa',
    position: 'relative'
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

  const iconButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 16,
    fontSize: 26,
    padding: 0,
    outline: 'none',
    display: 'flex',
    alignItems: 'center'
  };

  const skillSectionStyle = {
    padding: '1.3rem 1.2rem 0.7rem 1.2rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
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

  // Mark skill as completed
  const handleCompleteSkill = async (skillId) => {
    try {
      await updateDoc(doc(db, 'skills', skillId), { completed: true });
    } catch (e) {
      alert('Failed to mark as completed.');
    }
  };

  // Mark skill as available again
  const handleRepeatSkill = async (skillId) => {
    try {
      await updateDoc(doc(db, 'skills', skillId), { completed: false });
    } catch (e) {
      alert('Failed to repeat skill.');
    }
  };

  // Render skill card (for both available and completed)
  const renderSkillCard = (skill, isCompleted = false) => {
    const isMatch = userSkills.some(mySkill =>
      skill.skillOffered?.toLowerCase() === mySkill.skillWanted?.toLowerCase() &&
      skill.skillWanted?.toLowerCase() === mySkill.skillOffered?.toLowerCase()
    );
    const userProfile = userProfiles[skill.userId] || {};
    const displayName = userProfile.name || 'User';
    const photoURL = userProfile.photoURL && userProfile.photoURL.trim() !== ''
      ? userProfile.photoURL
      : avatar;

    let contactDisplay = userProfile.email || '';
    if (!userId && contactDisplay) {
      contactDisplay = maskEmail(contactDisplay);
    }

    const isOwner = userId && userId === skill.userId;

    return (
      <li
        key={skill.id}
        style={skillCardStyle(isMatch)}
      >
        {/* Complete/Repeat/Delete icons for owner */}
        <div style={profileSectionStyle}>
          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
              {!isCompleted ? (
                <>
                  <span
                    title="Mark as completed"
                    style={{ ...iconButtonStyle, color: '#2ecc40' }}
                    onClick={() => handleCompleteSkill(skill.id)}
                  >
                    {/* Green tick SVG */}
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="14" fill="#2ecc40"/>
                      <path d="M8 14.5L13 19L20 11.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span
                    title="Delete"
                    style={{ ...iconButtonStyle, color: '#ff3b3b' }}
                    onClick={() => {
                      setDeleteModal({ open: true, skillId: skill.id });
                      setConfirmText('');
                      setConfirmError('');
                    }}
                  >
                    {/* Red cross SVG */}
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="14" fill="#ff3b3b"/>
                      <path d="M9 9L19 19M19 9L9 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </>
              ) : (
                <span
                  title="Repeat"
                  style={{ ...iconButtonStyle, color: '#1E90FF' }}
                  onClick={() => handleRepeatSkill(skill.id)}
                >
                  {/* Repeat SVG */}
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#1E90FF"/>
                    <path d="M9 14c0-2.95 2.39-5.34 5.34-5.34 2.22 0 4.12 1.36 4.94 3.34M19 9v3.34h-3.34" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
          )}
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
        {/* Skill offered and wanted in a single line, capitalized, black, blue for Wants, and edit icon after */}
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
          {/* Edit icon for owner, after the skill line, only if not completed */}
          {isOwner && !isCompleted && (
            <span
              title="Edit"
              style={{ ...iconButtonStyle, color: '#1E90FF', marginLeft: 12 }}
              onClick={() => navigate(`/offer-skill/${skill.id}`)}
            >
              {/* Edit SVG */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#1E90FF"/>
                <path d="M18.9 9.1L19.9 10.1C20.3 10.5 20.3 11.1 19.9 11.5L12.5 18.9C12.3 19.1 12.1 19.2 11.8 19.2H10V17.4C10 17.1 10.1 16.9 10.3 16.7L17.7 9.3C18.1 8.9 18.7 8.9 18.9 9.1Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
        {/* Other details */}
        <div style={{ padding: '0 1.2rem 1.2rem 1.2rem' }}>
          {isMatch && !isCompleted && (
            <p style={{ color: '#1E90FF', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              🎯 This is a perfect match!
            </p>
          )}
          <p style={{ margin: '0.2rem 0' }}><strong>Location:</strong> {skill.location}</p>
          <p style={{ margin: '0.2rem 0' }}><strong>Contact:</strong> {contactDisplay}</p>
          <p style={{ margin: '0.2rem 0' }}><strong>Description:</strong> {skill.description}</p>
          {/* Only allow messaging if logged in and not your own post and not completed */}
          {!isCompleted && (
            isOwner ? null : userId && userId !== skill.userId ? (
              <Link to={`/chat/${[userId, skill.userId].sort().join('_')}`}>
                <button style={buttonStyle}>Message</button>
              </Link>
            ) : !userId ? (
              <button style={buttonStyle} onClick={handleMessageClick}>
                Message
              </button>
            ) : null
          )}
          {isCompleted && (
            <div style={{ color: '#2ecc40', fontWeight: 500, marginTop: 8 }}>
              This skill swap has been marked as completed.
            </div>
          )}
        </div>
      </li>
    );
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

      {availableSkills.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>No matching skills found.</p>}

      <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: 500, margin: '0 auto' }}>
        {availableSkills.map(skill => renderSkillCard(skill, false))}
      </ul>

      {/* Completed Skill Swaps Section */}
      <h2 style={{
        margin: '2.5rem 0 1.5rem 0',
        fontWeight: 700,
        fontSize: '1.6rem',
        color: '#2ecc40',
        textAlign: 'center',
        letterSpacing: '0.5px'
      }}>
        Completed Skill Swaps
      </h2>

      {completedSkills.length === 0 && <p style={{ color: '#bbb', textAlign: 'center' }}>No completed skills.</p>}

      <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: 500, margin: '0 auto' }}>
        {completedSkills.map(skill => renderSkillCard(skill, true))}
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
