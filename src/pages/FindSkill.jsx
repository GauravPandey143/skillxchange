import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

function FindSkill() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState(null);
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    // Track auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    // Fetch skill posts
    const q = query(collection(db, 'skills'), orderBy('timestamp', 'desc'));
    const unsubscribeSkills = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkills(results);

      const mine = results.filter(skill => skill.userId === auth.currentUser?.uid);
      setUserSkills(mine);
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

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Available Skill Swaps</h2>

      <input
        type="text"
        placeholder="Search by skill (e.g. guitar, math)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '0.8rem', marginBottom: '1rem', width: '100%', maxWidth: '325px' }}
      />

      {filteredSkills.length === 0 && <p>No matching skills found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredSkills.map((skill, index) => {
          const isMatch = userSkills.some(mySkill =>
            skill.skillOffered?.toLowerCase() === mySkill.skillWanted?.toLowerCase() &&
            skill.skillWanted?.toLowerCase() === mySkill.skillOffered?.toLowerCase()
          );

          return (
            <li
              key={index}
              style={{
                marginBottom: '1rem',
                border: '2px solid #7a8485',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: isMatch ? '#e6ffe6' : 'white'
              }}
            >
              <h3>{skill.skillOffered} ➡️ wants {skill.skillWanted}</h3>
              {isMatch && (
                <p style={{ color: 'green', fontWeight: 'bold' }}>
                  🎯 This is a perfect match!
                </p>
              )}
              <p><strong>Name:</strong> {skill.name}</p>
              <p><strong>Location:</strong> {skill.location}</p>
              <p><strong>Contact:</strong> {skill.contact}</p>
              <p><strong>Description:</strong> {skill.description}</p>

              {auth.currentUser?.uid !== skill.userId && (
                <Link to={`/chat/${[auth.currentUser.uid, skill.userId].sort().join('_')}`}>
                  <button>Message</button>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FindSkill;
