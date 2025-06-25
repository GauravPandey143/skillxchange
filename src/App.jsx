import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatOverview from './pages/ChatOverview';
import OfferSkill from './pages/OfferSkill';
import FindSkill from './pages/FindSkill';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import { onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import TestOTP from './pages/TestOTP';



function App() {
  // Update lastActive on auth state change and on user activity
  useEffect(() => {
    let unsubAuth;
    let activityInterval;

    const updateLastActive = () => {
      const user = auth.currentUser;
      if (user) {
        setDoc(
          doc(db, 'users', user.uid),
          { lastActive: serverTimestamp() },
          { merge: true }
        );
      }
    };

    unsubAuth = onAuthStateChanged(auth, user => {
      if (user) {
        updateLastActive();
        // Update lastActive every 30 seconds while user is logged in
        activityInterval = setInterval(updateLastActive, 30000);

        // Also update on user interaction
        window.addEventListener('click', updateLastActive);
        window.addEventListener('keydown', updateLastActive);
      } else {
        if (activityInterval) clearInterval(activityInterval);
        window.removeEventListener('click', updateLastActive);
        window.removeEventListener('keydown', updateLastActive);
      }
    });

    return () => {
      if (activityInterval) clearInterval(activityInterval);
      window.removeEventListener('click', updateLastActive);
      window.removeEventListener('keydown', updateLastActive);
      if (unsubAuth) unsubAuth();
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ChatOverview />} />
        <Route path="/offer" element={<OfferSkill />} />
        <Route path="/find" element={<FindSkill />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:uid" element={<Profile />} />
        {/* Optional: fallback route */}
        {/* <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Page Not Found</h2></div>} /> */}
        {/* Test OTP route */}
        <Route path="/test-otp" element={<TestOTP />} />
      </Routes>
    </Router>
  );
}

export default App;
