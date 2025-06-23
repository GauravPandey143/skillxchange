import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function OfferSkill() {
  const [form, setForm] = useState({
    name: '',
    skillOffered: '',
    skillWanted: '',
    location: '',
    contact: '',
    description: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert('You must be logged in to offer a skill.');
      return;
    }

    try {
      await addDoc(collection(db, 'skills'), {
        ...form,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      alert('Skill posted successfully!');

      setForm({
        name: '',
        skillOffered: '',
        skillWanted: '',
        location: '',
        contact: '',
        description: ''
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Something went wrong while posting your skill.');
    }
  };

  return (
    <div style={{ 
          padding: '1rem', 
          alignContent: 'center'
          }}>
      <h2>Offer a Skill</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '400px'
        }}
      >
        <input
          style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
        style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          type="text"
          name="skillOffered"
          placeholder="Skill You Can Offer"
          value={form.skillOffered}
          onChange={handleChange}
          required
        />
        <input
        style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          type="text"
          name="skillWanted"
          placeholder="Skill You Want to Learn"
          value={form.skillWanted}
          onChange={handleChange}
          required
        />
        <input
        style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />
        <input
        style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          type="text"
          name="contact"
          placeholder="Your Email"
          value={form.contact}
          onChange={handleChange}
          required
        />
        <textarea
        style={{
          borderRadius: '12px',
          maxWidth: '350px',}}
          name="description"
          placeholder="Short Description"
          value={form.description}
          onChange={handleChange}
        />
        <button style={{
          borderRadius: '12px',
          maxWidth: 'auto',
          padding: '0.8rem',}} 
          type="submit">Submit Skill Offer</button>
      </form>
    </div>
  );
}

export default OfferSkill;
