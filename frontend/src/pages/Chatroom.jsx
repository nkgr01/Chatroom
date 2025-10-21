import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import CreateRoomModal from "./CreateRoomModal";
import NotificationManager from "../components/NotificationManager";
import GlobalSearch from "../components/GlobalSearch";
import "../style/chatroom.css";

export default function Chatroom() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showPrivateMessages, setShowPrivateMessages] = useState(false);
  const [privateConversations, setPrivateConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

    // Récupérer l'utilisateur connecté
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUser(res.data.user));

    // Récupérer les salles (conversations)
    axios.get(`${import.meta.env.VITE_API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log('Salles récupérées:', res.data);
      // Combiner les salles créées et rejointes
      const allRooms = [...(res.data.created || []), ...(res.data.joined || [])];
      setConversations(allRooms);
    });

    // Récupérer les utilisateurs en ligne
    axios.get(`${import.meta.env.VITE_API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const online = res.data.users.filter(u => u.isOnline);
      setOnlineUsers(online);
    });
  }, [navigate]);

  // Mettre à jour les non lus à la réception d'un message privé (événement global)
  useEffect(() => {
    const handler = (e) => {
      const { fromUserId } = e.detail || {};
      if (!fromUserId) return;
      setUnreadCounts(prev => ({
        ...prev,
        [fromUserId]: (prev[fromUserId] || 0) + 1
      }));
    };
    window.addEventListener('privateMessageReceived', handler);
    return () => window.removeEventListener('privateMessageReceived', handler);
  }, []);

  // Raccourci clavier pour la recherche globale
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chatroom/${conversation.id}`);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleMessageClick = async () => {
    console.log('🔍 handleMessageClick appelé, showPrivateMessages actuel:', showPrivateMessages);
    setShowPrivateMessages(!showPrivateMessages);
    
    if (!showPrivateMessages) {
      console.log('📡 Récupération des conversations privées...');
      try {
      const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/private`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Conversations privées récupérées:', response.data);
        setPrivateConversations(response.data.conversations || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des conversations privées:', error);
      }
    } else {
      console.log('🔄 Retour aux conversations de groupe');
    }
  };

  if (!user) return <div>Chargement...</div>;

  console.log('🔄 Rendu du composant Chatroom - showPrivateMessages:', showPrivateMessages);

  return (
    <div className="chatroom-container">
      {/* Barre de navigation latérale gauche */}
      <div className="chatroom-sidebar">
        <div className="sidebar-user">
          <div className="user-avatar">
          
            <img
              src={
                user.avatar && !user.avatar.startsWith("http")
                  ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${user.avatar}`
                  : user.avatar || "/default-avatar.png"
              }
              alt="avatar"
            />
        
          </div>
        </div>
        
        <div className="sidebar-nav">
          <button 
            className={`nav-btn ${!showPrivateMessages ? 'active' : ''}`} 
            onClick={handleRefresh}
          >
            <span className="nav-icon">🏠</span>
          </button>
          <button 
            className={`nav-btn ${showPrivateMessages ? 'active' : ''}`} 
            onClick={handleMessageClick}
          >
            <span className="nav-icon">💬</span>
          </button>
          <button className="nav-btn" onClick={handleProfileClick}>
            <span className="nav-icon">👤</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
          </button>
        </div>
      </div>

      {/* Panneau de contenu gauche */}
      <div className="chatroom-content">
        <div className="content-header">
          <h1>Messages</h1>
                                <div className="search-container">
                        <input
                          type="text"
                          placeholder="Rechercher des utilisateurs ou de..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                        <button 
                          className="global-search-btn"
                          onClick={() => setShowGlobalSearch(true)}
                          title="Recherche globale (Ctrl+K)"
                        >
                          🌐
                        </button>
                      </div>
        </div>

        <div className="content-sections">
          {/* Utilisateurs en ligne */}
          <div className="section">
            <h3>En ligne</h3>
            {onlineUsers.length > 0 ? (
              <div className="online-users">
                {onlineUsers.map(u => (
                  <div 
                    key={u.id} 
                    className="online-user"
                    onClick={() => navigate(`/profile/${u.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={
                        u.avatar && !u.avatar.startsWith("http")
                          ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${u.avatar}`
                          : u.avatar || "/default-avatar.png"
                      }
                      alt="avatar"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucun utilisateur en ligne</p>
            )}
          </div>

          {/* Conversations */}
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>{showPrivateMessages ? 'Messages privés' : 'Conversations'}</h3>
              {!showPrivateMessages && (
                <button 
                  onClick={() => setShowModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Créer
                </button>
              )}
            </div>
            {console.log('🔍 showPrivateMessages:', showPrivateMessages, 'privateConversations:', privateConversations.length)}
            {showPrivateMessages ? (
              // Affichage des conversations privées
              privateConversations.length > 0 ? (
                <div className="conversations-list">
                  {privateConversations
                    .filter(conv => 
                      conv.username.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${unreadCounts[conv.id] > 0 ? 'unread' : ''}`}
                      onClick={() => {
                        setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
                        navigate(`/private/${conv.id}`);
                      }}
                    >
                      <div className="conv-avatar">
                        <img
                          src={
                            conv.avatar && !conv.avatar.startsWith("http")
                              ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${conv.avatar}`
                              : conv.avatar || "/default-avatar.png"
                          }
                          alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      </div>
                      <div className="conv-info">
                        <div className="conv-name">{conv.username}</div>
                        <div className="conv-last-message">
                          {conv.lastMessage || "Aucun message récent"}
                        </div>
                      </div>
                      <div className="conv-time">
                        <div className="conv-time-row">
                          <span className="conv-time-text">
                            {conv.lastMessageTime
                              ? new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) === new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                                ? new Date(conv.lastMessageTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                : new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                              : ''}
                          </span>
                          {unreadCounts[conv.id] > 0 && (
                            <span className="unread-badge">{unreadCounts[conv.id]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-conversations">
                  <div className="no-conv-icon">💬</div>
                  <p>Aucun message privé</p>
                </div>
              )
            ) : (
              // Affichage des conversations de groupe
              conversations.length > 0 ? (
                <div className="conversations-list">
                  {conversations
                    .filter(conv => 
                      conv.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(conv => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                      onClick={() => handleConversationSelect(conv)}
                    >
                      <div className="conv-avatar">
                        <span className="conv-icon">{conv.icon || "💬"}</span>
                      </div>
                      <div className="conv-info">
                        <div className="conv-name">{conv.name}</div>
                        <div className="conv-last-message">
                          {conv.description || "Aucun message récent"}
                        </div>
                      </div>
                      <div className="conv-time">
                        {conv.userCount || 0} membres
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-conversations">
                  <div className="no-conv-icon">💬</div>
                  <p>Aucune conversation récente</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Zone principale (placeholder) */}
      <div className="chatroom-main">
        <div className="main-placeholder">
          <div className="placeholder-icon">💬</div>
          <h2>{showPrivateMessages ? 'Sélectionnez un contact' : 'Sélectionnez une conversation'}</h2>
          <p>{showPrivateMessages ? 'Choisissez un contact pour commencer une conversation privée' : 'Choisissez une salle de chat pour commencer à discuter'}</p>
          
          {/* Gestionnaire de notifications */}
          <NotificationManager currentUser={user} />
        </div>
      </div>

      {/* Modal de création de salle */}
      {showModal && (
        <CreateRoomModal 
          onClose={() => setShowModal(false)} 
          onRoomCreated={(newRoom) => {
            console.log('Nouvelle salle créée:', newRoom);
            // S'assurer que la nouvelle salle a le bon format
            if (newRoom && newRoom.id) {
              setConversations(prev => [...prev, {
                ...newRoom,
                userCount: newRoom.users?.length || 1,
                messageCount: 0
              }]);
            }
            setShowModal(false);
          }}
        />
      )}
      {showGlobalSearch && <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />}
    </div>
  );
}
