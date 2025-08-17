export default function SidebarRight({ room, user }) {
  if (room) {
    // Affiche infos salle, membres, fichiers partagés
    return (
      <aside className="chatroom-sidebar-right">
        <h3>Infos de la salle</h3>
        <p>{room.description}</p>
        {/* Ajoute ici la liste des membres, fichiers, etc. */}
      </aside>
    );
  }
  if (user) {
    // Affiche profil utilisateur, actions, fichiers partagés
    return (
      <aside className="chatroom-sidebar-right">
        <h3>Profil utilisateur</h3>
        <p>Nom : {user.username}</p>
        <p>Intentions : {user.intentions}</p>
        {/* Ajoute ici les actions (bloquer, voir fichiers, etc.) */}
      </aside>
    );
  }
  return <aside className="chatroom-sidebar-right"></aside>;
}
