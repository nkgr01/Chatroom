import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "../style/chatinterface.css";

import MediaPreview from '../components/MediaPreview';
import LinkPreview from '../components/LinkPreview';

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
  "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
  "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀",
  "☠️", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽"
];

export default function ChatInterface() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadChatData = async () => {
      try {
        console.log("🔄 Chargement des données de la salle:", roomId);
        
        // Récupérer l'utilisateur connecté
        const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);
        console.log("✅ Utilisateur récupéré:", userResponse.data.user.username);

        // Vérifier l'appartenance à la salle
        const membershipResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/rooms/${roomId}/check-membership`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { isMember: isRoomMember, room: roomData } = membershipResponse.data;
        setRoom(roomData);
        setIsMember(isRoomMember);
        console.log("✅ Statut d'appartenance:", isRoomMember ? "Membre" : "Non membre");

        if (isRoomMember) {
          console.log("🔄 Chargement des messages et fichiers...");
          // Si membre, charger les messages et fichiers
          const [messagesResponse, filesResponse] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/messages/room/${roomId}`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${import.meta.env.VITE_API_URL}/files/room/${roomId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          setMessages(messagesResponse.data.messages);
          setSharedFiles(filesResponse.data.files || []);
          console.log("✅ Messages et fichiers chargés avec succès");
        }
      } catch (error) {
        console.error("❌ Erreur dans ChatInterface:", error);
        console.error("Status de l'erreur:", error.response?.status);
        console.error("Détails de l'erreur:", error.response?.data);
        
        if (error.response?.status === 404) {
          console.log("🚫 Salle non trouvée, redirection vers chatroom");
          navigate("/chatroom");
        } else if (error.response?.status === 403) {
          console.log("🚫 Accès refusé, affichage de l'écran de jointure");
          setIsMember(false);
        } else {
          console.log("⚠️ Erreur serveur, affichage de l'écran de jointure");
          setIsMember(false);
        }
      }
    };

    loadChatData();

    // Configuration Socket.IO
    socketRef.current = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      auth: { token }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("joinRoom", roomId);
    });

    socketRef.current.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("userTyping", (data) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, navigate, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Hier";
    } else if (diffDays > 1) {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);
      
      // Envoyer le fichier d'abord
      axios.post(`${import.meta.env.VITE_API_URL}/files/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      }).then((response) => {
        // Envoyer le message avec le fichier
        socketRef.current.emit("sendMessage", {
          content: message || "📎 Fichier partagé",
          roomId: parseInt(roomId),
          sharedFile: response.data.file
        });
        
        // Nettoyer
        setFile(null);
        setFilePreview(null);
        setFileType(null);
        
        // Recharger les fichiers
        axios.get(`${import.meta.env.VITE_API_URL}/files/room/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => setSharedFiles(res.data.files || []));
      }).catch((error) => {
        console.error('Erreur lors de l\'envoi du fichier:', error);
      });
    } else if (message.trim()) {
      // Envoyer seulement le message texte
      socketRef.current.emit("sendMessage", {
        content: message,
        roomId: roomId
      });
      setMessage("");
    }
    
    setShowEmojis(false);
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleTyping = () => {
    socketRef.current.emit("typing", {
      roomId: roomId,
      userId: user?.id
    });
  };

    const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Vérifier la taille du fichier (5Mo = 5 * 1024 * 1024 octets)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. La taille maximale est de 5 Mo.');
        return;
      }

      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      // Créer une prévisualisation
      if (selectedFile.type.startsWith('image/') ||
          selectedFile.type.startsWith('video/') ||
          selectedFile.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  if (!room || !user) return <div className="loading">Chargement...</div>;

  // Si l'utilisateur n'est pas membre, afficher l'écran de rejoindre
  if (!isMember) {
    return (
      <div className="chat-interface">
        <div className="chat-main">
          <div className="join-room-container">
            <div className="join-room-card">
              <div className="join-room-icon">
                <span>{room.icon || "💬"}</span>
              </div>
              <h2 className="join-room-title">{room.name}</h2>
              <p className="join-room-description">{room.description || "Aucune description"}</p>
              <div className="group-stats">
                <span className="member-count">{room.users?.length || 0} membres</span>
                <span className="online-count">{room.users?.filter(u => u.user.isOnline).length || 0} en ligne</span>
              </div>
              <button 
                className="join-room-btn"
                onClick={async () => {
                  try {
                    console.log("🔄 Tentative de jointure à la salle:", roomId);
                    
                    await axios.post(
                      `${import.meta.env.VITE_API_URL}/rooms/${roomId}/join`,
                      {},
                      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                    );
                    
                    console.log("✅ Jointure réussie, chargement des données...");
                    
                    // Après avoir rejoint, charger les données de la salle
                    const [messagesResponse, filesResponse] = await Promise.all([
                      axios.get(`${import.meta.env.VITE_API_URL}/messages/room/${roomId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                      }),
                      axios.get(`${import.meta.env.VITE_API_URL}/files/room/${roomId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                      })
                    ]);

                    setMessages(messagesResponse.data.messages);
                    setSharedFiles(filesResponse.data.files || []);
                    setIsMember(true);
                    console.log("✅ Données chargées avec succès après jointure");
                  } catch (err) {
                    console.error("❌ Erreur lors de la jointure:", err);
                    console.error("Status:", err.response?.status);
                    console.error("Détails:", err.response?.data);
                    
                    if (err.response?.status === 400 && err.response?.data?.message === 'Vous êtes déjà dans cette salle') {
                      console.log("ℹ️ Utilisateur déjà membre, chargement des données...");
                      try {
                        const [messagesResponse, filesResponse] = await Promise.all([
                          axios.get(`${import.meta.env.VITE_API_URL}/messages/room/${roomId}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                          }),
                          axios.get(`${import.meta.env.VITE_API_URL}/files/room/${roomId}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                          })
                        ]);

                        setMessages(messagesResponse.data.messages);
                        setSharedFiles(filesResponse.data.files || []);
                        setIsMember(true);
                        console.log("✅ Données chargées avec succès (déjà membre)");
                      } catch (loadError) {
                        console.error("❌ Erreur lors du chargement des données:", loadError);
                        console.error("Détails:", loadError.response?.data);
                        alert("Erreur lors du chargement des messages. Veuillez réessayer.");
                      }
                    } else {
                      console.error("❌ Erreur lors de la jointure:", err.response?.data);
                      alert("Erreur lors de la jointure de la salle. Veuillez réessayer.");
                    }
                  }
                }}
              >
                Rejoindre la salle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      {/* Sidebar gauche - Informations du groupe */}
      <div className="chat-sidebar-left">
        <div className="group-info">
          <div className="group-avatar">
            <span className="group-icon">{room.icon || "💬"}</span>
          </div>
          <div className="group-details">
            <h3 className="group-name">{room.name}</h3>
            <p className="group-description">{room.description || "Aucune description"}</p>
            <div className="group-stats">
              <span className="member-count">{room.users?.length || 0} membres</span>
              <span className="online-count">
                {room.users?.filter(u => u.user.isOnline).length || 0} en ligne
              </span>
            </div>
          </div>
        </div>

        <div className="members-section">
          <h4 className="section-title">Membres du groupe</h4>
          <div className="members-list">
                         {room.users?.map(member => (
               <div 
                 key={member.user.id} 
                 className="member-item"
                 onClick={() => {
                   if (member.user.id !== user?.id) {
                     navigate(`/private/${member.user.id}`);
                   }
                 }}
                 style={{ cursor: member.user.id !== user?.id ? 'pointer' : 'default' }}
               >
                 <div className="member-avatar">
                   <img
                     src={
                       member.user.avatar && !member.user.avatar.startsWith("http")
                         ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${member.user.avatar}`
                         : member.user.avatar || "/default-avatar.png"
                     }
                     alt="avatar"
                   />
                   <span className={`online-indicator ${member.user.isOnline ? 'online' : 'offline'}`}></span>
                 </div>
                 <div className="member-info">
                   <div className="member-name">{member.user.username}</div>
                   <div className="member-role">{member.role === 'admin' ? 'Administrateur' : 'Membre'}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

             {/* Zone principale de chat */}
       <div className="chat-main">
         <div className="messages-container">
          {messages.map((msg, index) => {
            const isMine = msg.sender.id === user?.id;
            const showDate = index === 0 || 
              new Date(msg.createdAt).toDateString() !== 
              new Date(messages[index - 1]?.createdAt).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="message-date">
                    <span>{formatDate(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`message ${isMine ? "sent" : "received"}`}>
                  {!isMine && (
                    <div className="message-avatar">
                      <img
                        src={
                          msg.sender.avatar && !msg.sender.avatar.startsWith("http")
                            ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sender.avatar}`
                            : msg.sender.avatar || "/default-avatar.png"
                        }
                        alt="avatar"
                      />
                    </div>
                  )}
                                     <div className="message-content">
                     <div className="message-bubble">
                       <div className="message-text">{msg.content}</div>
                       {/* Affichage des fichiers attachés au message */}
                       {msg.sharedFile && (
                         <div className="message-file">
                           <MediaPreview file={msg.sharedFile} inMessage={true} />
                           <a
                             href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                             download
                             className="file-download-btn"
                             title="Télécharger"
                           >
                             ⬇️
                           </a>
                         </div>
                       )}
                       {/* Affichage des prévisualisations de liens */}
                       {msg.linkPreviews && msg.linkPreviews.length > 0 && (
                         <div className="message-links">
                           {msg.linkPreviews.map((preview, idx) => (
                             <LinkPreview key={idx} preview={preview} />
                           ))}
                         </div>
                       )}
                     </div>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {isMine && (
                        <div className="message-status">
                          <span>✓✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="message-input-container">
          {showEmojis && (
            <div className="emoji-picker">
              {EMOJIS.map((emoji, index) => (
                <span
                  key={index}
                  className="emoji-item"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}
          <form className="input-wrapper" onSubmit={handleSend}>
            <div className="input-actions">
              <button
                type="button"
                className="action-btn"
                onClick={() => setShowEmojis(!showEmojis)}
              >
                😊
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => document.getElementById("fileInput").click()}
              >
                📎
              </button>
              <button
                type="button"
                className="action-btn"
              >
                🎤
              </button>
              <button
                type="button"
                className="action-btn"
              >
                📷
              </button>
            </div>
            <input
              id="fileInput"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <textarea
              className="message-textarea"
              placeholder="Écrire un message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={!message.trim()}
            >
              ➤
            </button>
          </form>
          {file && (
            <div className="file-preview">
              Fichier sélectionné : {file.name}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar droite - Fichiers partagés */}
      <div className="chat-sidebar-right">
        <div className="files-header">
          <h3 className="files-title">Fichiers partagés</h3>
          <p className="files-count">{sharedFiles.length} fichier{sharedFiles.length !== 1 ? 's' : ''}</p>
        </div>
        
                 <div className="files-list">
           {sharedFiles.length > 0 ? (
             sharedFiles.map(file => (
               <div key={file.id} className="file-item">
                 <MediaPreview file={file} />
                 <div className="file-actions">
                   <a
                     href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${file.filePath}`}
                     download
                     className="file-download"
                     title="Télécharger"
                   >
                     ⬇️
                   </a>
                 </div>
               </div>
             ))
           ) : (
             <div className="no-files">
               <div className="no-files-icon">📁</div>
               <p>Aucun fichier partagé</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
