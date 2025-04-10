import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Events from "./pages/Events";
import Mentor from "./pages/Mentor";
import Navbar from "./components/Navbar";
import Community from "./pages/Community";
import Learning from "./pages/Learning";

function App() {
  return (
    <Router>
      <Navbar /> {/* Always visible */}
      <div> {/* Padding to prevent overlap due to fixed navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/mentors" element={<Mentor />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

