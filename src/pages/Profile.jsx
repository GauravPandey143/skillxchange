import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
          email: data.email || '',
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
  }, [uid]);

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
    width: '100%'
  };

  if (!auth.currentUser && !uid) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem', color: '#888' }}>
        Please log in to view profiles.
      </div>
    );
  }

  // Determine the heading: "My Profile" for own profile, otherwise show user's name
  const profileHeading = isOwnProfile
    ? "My Profile"
    : form.name
      ? form.name
      : "Profile";

  return (
    <div style={cardStyle}>
      <div style={formContainerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={
              form.photoURL
                ? form.photoURL
                : 'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(form.name || 'U') +
                  '&background=333&color=fff&rounded=true'
            }
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
            margin: '1rem 0',
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
            gap: '1.1rem',
            width: '100%',
            maxWidth: 400
          }}
        >
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
          <input
            style={inputStyle}
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
            disabled
          />
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
            src={
              form.photoURL
                ? form.photoURL
                : 'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(form.name || 'U') +
                  '&background=333&color=fff&rounded=true'
            }
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
