import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

function Chat() {
  const { chatId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: message,
        sender: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Message failed. Try again.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Chat Room</h2>

      <div
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '1rem',
          marginBottom: '1rem',
          background: '#f9f9f9'
        }}
      >
        {messages.map((msg, index) => (
          <p
            key={index}
            style={{
              textAlign: msg.sender === auth.currentUser.uid ? 'right' : 'left',
              margin: '0.5rem 0',
              color: '#333'
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
          style={{ flex: 1, padding: '0.5rem' }}
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
