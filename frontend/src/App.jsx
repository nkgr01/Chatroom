import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chatroom from "./pages/Chatroom";
import CreateRoomModal from "./pages/CreateRoomModal";
import Room from "./pages/Room";
import ChatInterface from "./pages/ChatInterface";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import PrivateMessages from "./pages/PrivateMessages";
import ChatMedia from "./pages/ChatMedia";
import Logout from "./pages/Logout";
import './App.css'

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Chatroom />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chatroom" element={<Chatroom />} />
        <Route path="/chatroom/:roomId" element={<ChatInterface />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/private/:userId" element={<PrivateMessages />} />
        <Route path="/chat-media/:roomId" element={<ChatMedia />} />
        <Route path="/logout" element={<Logout />} />
        {/* Les autres routes viendront ici */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
