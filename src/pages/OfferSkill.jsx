import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

function OfferSkill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    skillOffered: '',
    skillWanted: '',
    location: '',
    contact: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [loadingSkill, setLoadingSkill] = useState(!!id);

  // Prefill name and email from user profile, and load skill if editing
  useEffect(() => {
    const fetchUserAndSkill = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        let name = '';
        let contact = auth.currentUser.email || '';
        if (userSnap.exists()) {
          name = userSnap.data().name || '';
        }
        if (id) {
          // Editing: fetch skill data
          const skillRef = doc(db, 'skills', id);
          const skillSnap = await getDoc(skillRef);
          if (skillSnap.exists() && skillSnap.data().userId === auth.currentUser.uid) {
            const skillData = skillSnap.data();
            setForm({
              name: name,
              skillOffered: skillData.skillOffered || '',
              skillWanted: skillData.skillWanted || '',
              location: skillData.location || '',
              contact: contact,
              description: skillData.description || ''
            });
          } else {
            alert('Skill not found or you do not have permission to edit this skill.');
            navigate('/');
          }
          setLoadingSkill(false);
        } else {
          setForm(f => ({
            ...f,
            name,
            contact
          }));
        }
      }
    };
    fetchUserAndSkill();
    // eslint-disable-next-line
  }, [id, auth.currentUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert('You must be logged in to offer a skill.');
      return;
    }

    setUploading(true);

    try {
      // 🔒 Save name in /users if not already stored
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: auth.currentUser.uid,
          name: form.name,
          email: auth.currentUser.email,
          createdAt: serverTimestamp(),
        });
      } else if (form.name && userSnap.data().name !== form.name) {
        // Update name if changed
        await setDoc(
          userRef,
          { name: form.name },
          { merge: true }
        );
      }

      // 📝 Save or update skill data
      if (id) {
        // Editing existing skill
        const skillRef = doc(db, 'skills', id);
        await updateDoc(skillRef, {
          skillOffered: form.skillOffered,
          skillWanted: form.skillWanted,
          location: form.location,
          description: form.description,
          // Do not update userId, timestamp, or contact
        });
        alert('Skill updated successfully!');
      } else {
        // Creating new skill
        await addDoc(collection(db, 'skills'), {
          ...form,
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp()
        });
        alert('Skill posted successfully!');
      }

      setForm({
        name: form.name,
        skillOffered: '',
        skillWanted: '',
        location: '',
        contact: form.contact,
        description: ''
      });
      if (id) navigate('/'); // Go back to main page after editing
    } catch (error) {
      console.error('Error adding/updating skill:', error);
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

  if (loadingSkill) {
    return (
      <div style={cardStyle}>
        <div style={formContainerStyle}>
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.6rem', color: '#222', textAlign: 'center', letterSpacing: '0.5px' }}>
            Loading...
          </h2>
        </div>
      </div>
    );
  }

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
          {id ? 'Edit Skill Offer' : 'Offer a Skill'}
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
            {uploading ? (id ? 'Updating...' : 'Submitting...') : (id ? 'Update Skill Offer' : 'Submit Skill Offer')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OfferSkill;