import Room from "../pages/Room";
import PrivateMessages from "../pages/PrivateMessages";
import "../style/chatarea.css";

export default function ChatArea({ room, user }) {
  if (!room && !user) {
    return (
      <div className="chatroom-main chatroom-main-welcome">
        <div className="chatroom-welcome-icon">💬</div>
        <h2>Bienvenue sur ConnectChat !</h2>
        <p>Sélectionne une salle ou un utilisateur pour commencer à discuter.</p>
      </div>
    );
  }
  if (room) {
    return (
      <div className="chatroom-main">
        <Room roomId={room.id} />
      </div>
    );
  }
  if (user) {
    return (
      <div className="chatroom-main">
        <PrivateMessages userId={user.id} />
      </div>
    );
  }
}
