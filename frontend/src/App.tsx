import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Events from "./pages/Events";
import Mentor from "./pages/Mentor";
import Navbar from "./components/Navbar";
import Community from "./pages/Community";
import Learning from "./pages/Learning";
import Chat from "./pages/Chat";
import RoadMap from "./components/RoadMap.tsx";
import Dashboard from "./pages/Admin.tsx";
import LoginPage from "./pages/Login.tsx";
function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname === "/chat";

  return (
    <div>
      {!isChatRoute && <Navbar />}
      <div>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/mentors" element={<Mentor />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/community" element={<Community />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/roadmap" element={<RoadMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
