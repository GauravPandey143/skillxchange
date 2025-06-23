import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatOverview from './pages/ChatOverview'; // ⬅️ Replaces Home
import OfferSkill from './pages/OfferSkill';
import FindSkill from './pages/FindSkill';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ChatOverview />} /> {/* ⬅️ Home now shows all chats */}
        <Route path="/offer" element={<OfferSkill />} />
        <Route path="/find" element={<FindSkill />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat/:chatId" element={<Chat />} />

        {/* Optional: fallback route */}
        {/* <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Page Not Found</h2></div>} /> */}
      </Routes>
    </Router>
  );
}

export default App;
