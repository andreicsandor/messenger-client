import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LoginView, LogoutView } from "./components/Authentication";
import ChatView from "./components/Chat";

function App() {
  return (
    <Router>
      <div className="container-custom">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/logout" element={<LogoutView />} />
          <Route path="/chat" element={<ChatView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
