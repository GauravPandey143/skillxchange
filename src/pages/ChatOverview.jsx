// src/pages/ChatOverview.jsx
import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collectionGroup, query, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

function ChatOverview() {
  const [chatIds, setChatIds] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collectionGroup(db, 'messages'));
    const unsub = onSnapshot(q, (snapshot) => {
      const ids = new Set();

      snapshot.docs.forEach((doc) => {
        const path = doc.ref.path;
        const chatId = path.split('/')[1]; // gets the chatId from path "chats/{chatId}/messages"
        if (chatId.includes(auth.currentUser.uid)) {
          ids.add(chatId);
        }
      });

      setChatIds([...ids]);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Your Chats</h2>
      {chatIds.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {chatIds.map((id, idx) => (
            <li key={idx} style={{ marginBottom: '1rem' }}>
              <Link to={`/chat/${id}`}>
                <button>Chat with {id.replace(auth.currentUser.uid, '').replace('_', '')}</button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChatOverview;
