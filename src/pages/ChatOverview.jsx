import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collectionGroup, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import avatar from '../assets/avatar.svg';

function isOnline(lastActive) {
  if (!lastActive || !lastActive.seconds) return false;
  const last = new Date(lastActive.seconds * 1000);
  const now = new Date();
  // Consider online if active in last 2 minutes
  return (now - last) < 2 * 60 * 1000;
}

function ChatOverview() {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collectionGroup(db, 'messages');

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const currentUid = auth.currentUser.uid;
      const chatMap = new Map();

      snapshot.forEach((docSnap) => {
        const path = docSnap.ref.path; // chats/{chatId}/messages/{msg}
        const chatId = path.split('/')[1];
        if (chatId.includes(currentUid)) {
          const data = docSnap.data();
          // Only keep the most recent message for each chat
          if (
            !chatMap.has(chatId) ||
            (data.timestamp && chatMap.get(chatId).timestamp && data.timestamp.seconds > chatMap.get(chatId).timestamp.seconds)
          ) {
            chatMap.set(chatId, { ...data, chatId });
          }
        }
      });

      // For each chatId, get the other user's info and sort by timestamp desc
      const chatItems = await Promise.all(
        Array.from(chatMap.values())
          .sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.seconds - a.timestamp.seconds;
          })
          .map(async (chat) => {
            const [id1, id2] = chat.chatId.split('_');
            const otherUid = id1 === currentUid ? id2 : id1;

            let displayName = `User (${otherUid.slice(0, 6)}...)`;
            let photoURL = '';
            let lastActive = null;

            try {
              const userDoc = await getDoc(doc(db, 'users', otherUid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                displayName = data.name || data.email || displayName;
                photoURL = data.photoURL && data.photoURL.trim() !== '' ? data.photoURL : avatar;
                lastActive = data.lastActive || null;
              } else {
                photoURL = avatar;
              }
            } catch (error) {
              photoURL = avatar;
              console.warn(`Error fetching user ${otherUid}:`, error);
            }

            return {
              chatId: chat.chatId,
              displayName,
              photoURL,
              otherUid,
              lastMessageText: chat.text || '',
              lastActive
            };
          })
      );

      setChatList(chatItems);
    });

    return () => unsubscribe();
  }, []);

  const cardStyle = {
    maxWidth: 900,
    margin: '2rem auto',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: '2rem',
  };

  const chatItemStyle = {
    background: '#f6f8fa',
    padding: '1rem',
    marginBottom: '1.1rem',
    borderRadius: 18,
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    alignItems: 'center',
    transition: 'box-shadow 0.2s, border 0.2s',
    minWidth: 0,
    gap: '0.7rem'
  };

  const linkStyle = {
    color: '#1E90FF',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: 600,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden'
  };

  const profilePicStyle = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '0.7rem',
    border: '2px solid #e0e0e0',
    background: '#eee'
  };

  const statusDotStyle = (online) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: online ? '#2ecc40' : '#bbb',
    display: 'inline-block',
    marginRight: 8,
    border: '1.5px solid #fff',
    boxShadow: '0 0 2px #888'
  });

  const statusTextStyle = (online) => ({
    color: online ? '#2ecc40' : '#888',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginLeft: 2,
    whiteSpace: 'nowrap'
  });

  const lastMessageStyle = {
    color: '#888',
    fontSize: '0.95rem',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 180,
    display: 'block'
  };

  return (
    <div style={cardStyle}>
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
        Your Chats
      </h2>
      {chatList.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>No chats yet.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            width: '100%',
            maxWidth: 340,
            alignSelf: 'center',
          }}
        >
          {chatList.map(({ chatId, displayName, photoURL, otherUid, lastMessageText, lastActive }) => {
            const online = isOnline(lastActive);
            return (
              <li key={chatId} style={chatItemStyle}>
                <Link to={`/profile/${otherUid}`}>
                  <img
                    src={photoURL}
                    alt={displayName}
                    style={profilePicStyle}
                    title={displayName}
                  />
                </Link>
                <Link to={`/chat/${chatId}`} style={linkStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
                    <span style={lastMessageStyle} title={lastMessageText}>
                      {lastMessageText.length > 50
                        ? lastMessageText.slice(0, 50) + '...'
                        : lastMessageText}
                    </span>
                  </div>
                </Link>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 8,
                  flexShrink: 0,
                  minWidth: 0,
                  maxWidth: 90,
                  overflow: 'hidden'
                }}>
                  <span style={statusDotStyle(online)}></span>
                  <span style={statusTextStyle(online)}>
                    {online ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ChatOverview;
