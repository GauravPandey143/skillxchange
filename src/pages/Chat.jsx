import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc } from 'firebase/firestore';

function getCounterpartyId(chatId, currentUserId) {
  // chatId is like 'uid1_uid2', return the other uid
  return chatId.split('_').find(uid => uid !== currentUserId);
}

function formatTime(ts) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleDateString();
}

function Chat() {
  const { chatId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [counterparty, setCounterparty] = useState({ name: 'User', photoURL: '', uid: '' });
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    // Fetch user profile from Firestore for the counterparty
    if (!currentUser) return;
    const counterpartyId = getCounterpartyId(chatId, currentUser.uid);

    async function fetchCounterparty() {
      try {
        const userDoc = await getDoc(doc(db, 'users', counterpartyId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCounterparty({
            name: data.name || 'User',
            photoURL: data.photoURL || '',
            uid: counterpartyId
          });
        } else {
          setCounterparty({
            name: 'User',
            photoURL: '',
            uid: counterpartyId
          });
        }
      } catch {
        setCounterparty({
          name: 'User',
          photoURL: '',
          uid: counterpartyId
        });
      }
    }

    fetchCounterparty();
  }, [chatId, currentUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: message,
        sender: currentUser.uid,
        senderName: 'You', // Optionally store sender name
        timestamp: serverTimestamp()
      });
      setMessage('');
    } catch (error) {
      alert('Message failed. Try again.');
    }
  };

  // Handler to navigate to the counterparty's profile
  const handleProfileClick = () => {
    navigate(`/profile/${counterparty.uid}`);
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'msg', ...msg });
  });

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '2rem auto',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        overflow: 'hidden',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 1.2rem',
          borderBottom: '1px solid #ececec',
          background: '#fafbfc',
          cursor: 'pointer'
        }}
        onClick={handleProfileClick}
        title="View Profile"
      >
        <img
          src={
            counterparty.photoURL
              ? counterparty.photoURL
              : 'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(counterparty.name || 'U') +
                '&background=333&color=fff&rounded=true'
          }
          alt="Profile"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            marginRight: 14,
            border: '2px solid #e0e0e0'
          }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#222'
          }}
        >
          {counterparty.name}
        </span>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          padding: '1.2rem',
          overflowY: 'auto',
          background: '#f6f8fa',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7rem'
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: '2rem' }}>
            No messages yet.
          </div>
        )}
        {groupedMessages.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div
                key={`date-${item.date}-${idx}`}
                style={{
                  textAlign: 'center',
                  color: '#888',
                  fontSize: '0.95rem',
                  margin: '1.2rem 0 0.5rem 0',
                  fontWeight: 500
                }}
              >
                {item.date}
              </div>
            );
          }
          const isMe = item.sender === currentUser.uid;
          return (
            <div
              key={item.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                gap: 2
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#888',
                  marginBottom: 2,
                  marginRight: isMe ? 6 : 0,
                  marginLeft: isMe ? 0 : 6
                }}
              >
                {isMe ? 'You' : counterparty.name}
                {' '}
                <span style={{ fontSize: '0.75rem', color: '#bbb', marginLeft: 6 }}>
                  {formatTime(item.timestamp)}
                </span>
              </span>
              <div
                style={{
                  background: isMe
                    ? 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)'
                    : '#ececec',
                  color: isMe ? '#fff' : '#222',
                  borderRadius: 16,
                  padding: '0.7rem 1.1rem',
                  maxWidth: '70%',
                  fontSize: '1rem',
                  wordBreak: 'break-word',
                  boxShadow: isMe
                    ? '0 2px 8px rgba(30,144,255,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {item.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <form
        onSubmit={sendMessage}
        autoComplete="off"
        style={{
          display: 'flex',
          borderColor: '#fff',
          padding: '1rem 1rem',
          background: '#fff',  
          gap: '0.5rem'
        }}
      >
        
        {/* Message Input */}
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          required
          style={{
            minWidth: '330px',
            margin: 'auto',
            border: 'none',
            outline: 'none',
            background: '#f6f8fa',
            borderRadius: 18,
            border: '1px solid #dcdcdc',
            padding: '0.7rem 1rem',
            fontSize: '1rem',
            marginRight: 0,
            marginLeft: 0
          }}
        />
        {/* Send Button */}
        <button
          type="submit"
          style={{
            minWidth: '110px',
            background: 'linear-gradient(90deg, #1E90FF 60%, #00C6FB 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 18,
            fontWeight: 400,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;