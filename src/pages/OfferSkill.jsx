import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function OfferSkill() {
  const [form, setForm] = useState({
    name: '',
    skillOffered: '',
    skillWanted: '',
    location: '',
    contact: '',
    description: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Prefill name and email from user profile
  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        setForm(f => ({
          ...f,
          name: userSnap.exists() ? userSnap.data().name || '' : '',
          contact: auth.currentUser.email || ''
        }));
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/jpg')
    ) {
      setProfilePic(file);
    } else {
      alert('Please select a JPG, JPEG, or PNG image.');
      e.target.value = '';
      setProfilePic(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert('You must be logged in to offer a skill.');
      return;
    }

    setUploading(true);

    let photoURL = '';

    try {
      // 🔒 Save name and photoURL in /users if not already stored
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      // If a profile picture is selected, upload it to Firebase Storage
      if (profilePic) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `profilePictures/${auth.currentUser.uid}.${profilePic.name.split('.').pop()}`
        );
        await uploadBytes(storageRef, profilePic);
        photoURL = await getDownloadURL(storageRef);
      } else if (userSnap.exists()) {
        // If user already exists, keep their existing photoURL if available
        photoURL = userSnap.data().photoURL || '';
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: auth.currentUser.uid,
          name: form.name,
          email: auth.currentUser.email,
          photoURL,
          createdAt: serverTimestamp(),
        });
      } else if (photoURL) {
        // Update photoURL if a new one was uploaded
        await setDoc(
          userRef,
          { photoURL, name: form.name },
          { merge: true }
        );
      } else if (form.name && userSnap.data().name !== form.name) {
        // Update name if changed
        await setDoc(
          userRef,
          { name: form.name },
          { merge: true }
        );
      }

      // 📝 Save skill data
      await addDoc(collection(db, 'skills'), {
        ...form,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      alert('Skill posted successfully!');

      setForm({
        name: form.name,
        skillOffered: '',
        skillWanted: '',
        location: '',
        contact: form.contact,
        description: ''
      });
      setProfilePic(null);
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Something went wrong while posting your skill.');
    } finally {
      setUploading(false);
    }
  };

  // Consistent style with Chat.jsx
  const cardStyle = {
    maxWidth: '900',
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: 'auto',
    minHeight: 'auto'
  };

  const formContainerStyle = {
    padding: '2rem',
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
          Offer a Skill
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '2px solid #dcdcdc',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
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
            required
            autoComplete="name"
            disabled
          />
          <input
            style={inputStyle}
            type="text"
            name="skillOffered"
            placeholder="Skill You Can Offer"
            value={form.skillOffered}
            onChange={handleChange}
            required
          />
          <input
            style={inputStyle}
            type="text"
            name="skillWanted"
            placeholder="Skill You Want to Learn"
            value={form.skillWanted}
            onChange={handleChange}
            required
          />
          <input
            style={inputStyle}
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />
          <input
            style={inputStyle}
            type="text"
            name="contact"
            placeholder="Your Email"
            value={form.contact}
            required
            autoComplete="email"
            disabled
          />
          <textarea
            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
            name="description"
            placeholder="Short Description"
            value={form.description}
            onChange={handleChange}
          />
          <button
            style={buttonStyle}
            type="submit"
            disabled={uploading}
          >
            {uploading ? 'Submitting...' : 'Submit Skill Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OfferSkill;