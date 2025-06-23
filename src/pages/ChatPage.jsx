import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  collectionGroup,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';

function ChatPage() {
  const [chatIds, setChatIds] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch chat IDs
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collectionGroup(db, 'messages'));
    const unsub = onSnapshot(q, (snapshot) => {
      const ids = new Set();

      snapshot.docs.forEach((doc) => {
        const path = doc.ref.path;
        const chatId = path.split('/')[1];
        if (chatId.includes(auth.currentUser.uid)) {
          ids.add(chatId);
        }
      });

      setChatIds([...ids]);
    });

    return () => unsub();
  }, []);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!activeChatId) return;

    const q = query(collection(db, `chats/${activeChatId}/messages`), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });

    return () => unsub();
  }, [activeChatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await addDoc(collection(db, `chats/${activeChatId}/messages`), {
      text: message,
      sender: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });

    setMessage('');
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2>Chats</h2>

      {/* Chat List */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        {chatIds.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {chatIds.map((id, idx) => (
              <li key={idx}>
                <button
                  onClick={() => setActiveChatId(id)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #555',
                    background: id === activeChatId ? '#222' : 'transparent',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {`Chat with ${id.replace(auth.currentUser.uid, '').replace('_', '')}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Window */}
      {activeChatId && (
        <div>
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #555',
              padding: '1rem',
              marginBottom: '1rem',
              background: '#111'
            }}
          >
            {messages.map((msg, index) => (
              <p
                key={index}
                style={{
                  textAlign: msg.sender === auth.currentUser.uid ? 'right' : 'left',
                  color: '#ccc',
                  margin: '0.5rem 0'
                }}
              >
                {msg.text}
              </p>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '0.5rem', background: '#222', color: '#fff', border: '1px solid #444' }}
              required
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1E90FF',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
