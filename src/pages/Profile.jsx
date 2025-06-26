import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import avatar from '../assets/avatar.svg';
import { verifyBeforeUpdateEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// 🔁 Cloudinary uploader
const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'profilePictures');
  data.append('cloud_name', 'dyfksujec');

  const res = await fetch('https://api.cloudinary.com/v1_1/dyfksujec/image/upload', {
    method: 'POST',
    body: data
  });

  const result = await res.json();
  if (!result.secure_url) throw new Error('Upload failed');
  return result.secure_url;
};

function Profile() {
  const { uid } = useParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photoURL: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');

  // Keep track of logged-in user for own profile detection
  const [currentUser, setCurrentUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // If viewing own profile, update email in form when it changes
      if (user && (!uid || uid === user.uid)) {
        setForm(f => ({
          ...f,
          email: user.email || ''
        }));
      }
    });
    return unsubscribe;
  }, [uid]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = uid || (auth.currentUser && auth.currentUser.uid);
      if (!userId) return;
      setIsOwnProfile(!uid || (auth.currentUser && uid === auth.currentUser.uid));
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setForm({
          name: data.name || '',
          // Show Firestore email for others, auth.currentUser.email for own profile
          email: (!uid || (auth.currentUser && uid === auth.currentUser.uid))
            ? (auth.currentUser?.email || data.email || '')
            : (data.email || ''),
          phone: data.phone || '',
          address: data.address || '',
          photoURL: data.photoURL || ''
        });
      } else if (auth.currentUser && !uid) {
        setForm(f => ({
          ...f,
          email: auth.currentUser.email || ''
        }));
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [uid, currentUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')
    ) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, photoURL: ev.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a JPG, JPEG, or PNG image.');
      e.target.value = '';
      setProfilePic(null);
    }
  };

  const handleProfilePicClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !isOwnProfile) return;
    setUploading(true);

    let photoURL = form.photoURL;

    try {
      if (profilePic) {
        photoURL = await uploadToCloudinary(profilePic);
      }

      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          photoURL
        },
        { merge: true }
      );

      setForm(f => ({ ...f, photoURL }));
      alert('Profile updated!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile.');
    } finally {
      setUploading(false);
    }
  };

  // Email change logic (Firebase official flow)
  const handleEmailChangeClick = () => {
    setShowEmailChange(true);
    setNewEmail('');
    setPendingEmail('');
    setEmailChangeError('');
  };

  // Use Firebase's verifyBeforeUpdateEmail, but check if email is already in use in both Auth and Firestore
  const handleSendVerifyLink = async () => {
    setEmailChangeError('');
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailChangeError('Please enter a valid email.');
      return;
    }
    setEmailChangeLoading(true);
    try {
      // Check if email is already in use in Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, newEmail);
      if (methods && methods.length > 0) {
        setEmailChangeError('Email already in use.');
        setEmailChangeLoading(false);
        return;
      }
      // Check if email is already in use in Firestore (users collection)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newEmail));
      const querySnapshot = await getDocs(q);
      // If found and not the current user, block
      if (!querySnapshot.empty) {
        let alreadyUsed = false;
        querySnapshot.forEach(docSnap => {
          if (docSnap.id !== auth.currentUser.uid) {
            alreadyUsed = true;
          }
        });
        if (alreadyUsed) {
          setEmailChangeError('Email already in use.');
          setEmailChangeLoading(false);
          return;
        }
      }
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      setPendingEmail(newEmail);
      setEmailChangeError('');
      alert('A verification link has been sent to your new email. Please check your inbox and click the link to complete the change.');
    } catch (err) {
      setEmailChangeError('Error sending verification link: ' + (err.message || ''));
      console.error(err);
    }
    setEmailChangeLoading(false);
  };

  const cardStyle = {
    maxWidth: 900,
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: 0
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
    boxSizing: 'border-box',
    margin: 0
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
    width: '100%'
  };

  const changeButtonStyle = {
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

  const inputFieldsWrapper = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '100%',
    margin: '1.5rem 0'
  };

  if (!currentUser && !uid) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem', color: '#888' }}>
        Please log in to view profiles.
      </div>
    );
  }

  const profileHeading = isOwnProfile
    ? "My Profile"
    : form.name
      ? form.name
      : "Profile";

  const profileImageSrc = form.photoURL && form.photoURL.trim() !== ''
    ? form.photoURL
    : avatar;

  return (
    <div style={cardStyle}>
      <div style={formContainerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img
            src={profileImageSrc}
            alt="Profile"
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #e0e0e0',
              cursor: 'pointer'
            }}
            onClick={handleProfilePicClick}
            title={
              isOwnProfile
                ? 'Click to change profile picture'
                : 'Click to view full size'
            }
          />
          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleProfilePicChange}
              style={{ display: 'none' }}
            />
          )}
        </div>
        <h2
          style={{
            margin: '0 0 1.5rem 0',
            fontWeight: 700,
            fontSize: '1.6rem',
            color: '#222',
            fontFamily: isOwnProfile ? undefined : 'Montserrat, sans-serif',
            letterSpacing: isOwnProfile ? undefined : '0.01em'
          }}
        >
          {profileHeading}
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '2px solid #dcdcdc',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            padding: '2rem 1.5rem'
          }}
        >
          <div style={inputFieldsWrapper}>
            <input
              style={inputStyle}
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={!isOwnProfile}
            />
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  marginTop: 0,
                  paddingRight: isOwnProfile ? 90 : undefined
                }}
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
                disabled
              />
              {isOwnProfile && (
                <button
                  type="button"
                  style={changeButtonStyle}
                  onClick={handleEmailChangeClick}
                  tabIndex={-1}
                >
                  Change
                </button>
              )}
            </div>
            {/* Email change modal/box */}
            {showEmailChange && (
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
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={e => {
                    setNewEmail(e.target.value);
                    setEmailChangeError('');
                  }}
                  required
                />
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={handleSendVerifyLink}
                  disabled={emailChangeLoading}
                >
                  {emailChangeLoading ? 'Sending...' : 'Send Verification Link'}
                </button>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: '#eee',
                    color: '#222',
                    marginTop: 0
                  }}
                  onClick={() => setShowEmailChange(false)}
                >
                  Cancel
                </button>
                {emailChangeError && (
                  <div style={{ marginTop: 10, color: '#d32f2f', fontWeight: 500 }}>
                    {emailChangeError}
                  </div>
                )}
                {pendingEmail && (
                  <div style={{ marginTop: 10, color: '#0070f3' }}>
                    A verification link has been sent to {pendingEmail}.<br />
                    Please check your email and click the link to complete the change.
                  </div>
                )}
              </div>
            )}
            <input
              style={inputStyle}
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
            <input
              style={inputStyle}
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>
          {isOwnProfile && (
            <button style={buttonStyle} type="submit" disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Profile'}
            </button>
          )}
        </form>
      </div>
      {/* Fullscreen Modal for Profile Picture */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <img
            src={profileImageSrc}
            alt="Profile Full"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 18,
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              background: '#fff'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Profile;
