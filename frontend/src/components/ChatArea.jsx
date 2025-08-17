export default function ChatArea({ room, user }) {
  if (!room && !user) {
    return (
      <div className="chatroom-main">
        <h2>Bienvenue sur ConnectChat !</h2>
        <p>Sélectionne une salle ou un utilisateur pour commencer à discuter.</p>
      </div>
    );
  }
  if (room) {
    // Ici tu peux intégrer le composant Room.jsx (chat de salle)
    return <div className="chatroom-main"><h2>{room.name}</h2><p>Messages de la salle...</p></div>;
  }
  if (user) {
    // Ici tu peux intégrer le composant PrivateMessages.jsx (chat privé)
    return <div className="chatroom-main"><h2>Chat privé avec {user.username}</h2></div>;
  }
}
