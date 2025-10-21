import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../style/privatemessages.css";

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

export default function PrivateMessages() { 
  const params = useParams();
  const navigate = useNavigate();
  const actualUserId = params.userId;
  
  const [messages, setMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    console.log("🔍 Chargement des messages privés pour l'utilisateur:", actualUserId);

    const loadPrivateChatData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📡 Récupération des informations utilisateur...");
        
        // Récupérer les informations des utilisateurs
        const [userResponse, currentUserResponse] = await Promise.all([
    axios.get(`${import.meta.env.VITE_API_URL}/users/${actualUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
          }),
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        console.log("✅ Informations utilisateur récupérées:", {
          otherUser: userResponse.data.user,
          currentUser: currentUserResponse.data.user
        });

        setUser(userResponse.data.user);
        setCurrentUser(currentUserResponse.data.user);

        console.log("📡 Récupération des messages et fichiers...");

        // Récupérer les messages et fichiers privés
        const [messagesResponse, filesResponse] = await Promise.all([
    axios.get(`${import.meta.env.VITE_API_URL}/messages/private/${actualUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/files/private/${actualUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        console.log("✅ Messages et fichiers récupérés:", {
          messages: messagesResponse.data.messages?.length || 0,
          files: filesResponse.data.files?.length || 0
        });

        setMessages(messagesResponse.data.messages || []);
        setSharedFiles(filesResponse.data.files || []);
        setLoading(false);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des données privées:", error);
        console.error("Détails de l'erreur:", {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url
        });
        
        setError(error.response?.data?.message || "Erreur lors du chargement");
        setLoading(false);
        
        if (error.response?.status === 404) {
          console.log("🚫 Utilisateur non trouvé, redirection vers chatroom");
          navigate("/chatroom");
        } else if (error.response?.status === 403) {
          console.log("🚫 Accès refusé, redirection vers chatroom");
          navigate("/chatroom");
        }
      }
    };

    if (actualUserId) {
      loadPrivateChatData();
    } else {
      console.error("❌ Aucun userId fourni");
      navigate("/chatroom");
    }

    // Configuration Socket.IO
    socketRef.current = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      auth: { token }
    });

    socketRef.current.emit("joinPrivateChat", actualUserId);

    socketRef.current.on("newPrivateMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("userTyping", (data) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      if (socketRef.current) {
      socketRef.current.disconnect();
      }
    };
  }, [actualUserId, navigate, currentUser?.id]);

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

  const handleSend = e => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    if (file) {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("receiverId", actualUserId);
      formData.append("isPrivate", "true");
      
      // Envoyer le fichier d'abord
      axios.post(
        `${import.meta.env.VITE_API_URL}/files/upload`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          } 
        }
      ).then((response) => {
        // Envoyer le message avec le fichier
        socketRef.current.emit("sendMessage", {
          content: message || "📎 Fichier partagé",
          receiverId: actualUserId,
          isPrivate: true,
          sharedFile: response.data.file
        });
        
        // Nettoyer
        setFile(null);
        setFilePreview(null);
        setFileType(null);
        
        // Recharger les fichiers
        axios.get(`${import.meta.env.VITE_API_URL}/files/private/${actualUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setSharedFiles(res.data.files || []));
      }).catch((error) => {
        console.error('Erreur lors de l\'envoi du fichier:', error);
      });
    } else if (message.trim()) {
      // Envoyer seulement le message texte
      socketRef.current.emit("sendMessage", {
        content: message,
        receiverId: actualUserId,
        isPrivate: true
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
      receiverId: actualUserId
    });
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      // Créer une prévisualisation
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('audio/')) {
        setFilePreview('audio');
      } else {
        setFilePreview('document');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  if (loading) {
    return (
      <div className="private-interface">
        <div className="loading-container">
          <div className="loading">Chargement de la conversation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="private-interface">
        <div className="error-container">
          <div className="error-message">
            <h3>Erreur</h3>
            <p>{error}</p>
            <button onClick={() => navigate("/chatroom")} className="back-btn">
              Retour au chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return (
      <div className="private-interface">
        <div className="error-container">
          <div className="error-message">
            <h3>Utilisateur non trouvé</h3>
            <p>L'utilisateur demandé n'existe pas ou n'est pas accessible.</p>
            <button onClick={() => navigate("/chatroom")} className="back-btn">
              Retour au chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="private-interface">
      {/* Sidebar gauche - Informations de l'utilisateur */}
      <div className="private-sidebar-left">
        <div className="user-info">
          <div className="user-avatar">
        <img
          src={
            user.avatar && !user.avatar.startsWith("http")
              ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${user.avatar}`
              : user.avatar || "/default-avatar.png"
          }
          alt="avatar"
            />
            <span className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
          </div>
          <div className="user-details">
            <h3 className="user-name">{user.username}</h3>
            <p className="user-status">
              {user.isOnline ? 'En ligne' : `Vu pour la dernière fois ${formatDate(user.lastSeen)}`}
            </p>
            <div className="user-meta">
              <span>Âge: {user.age}</span>
              <span>Intérêts: {user.interests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone principale de chat */}
      <div className="private-main">
        <div className="messages-container">
          {messages.map((msg, index) => {
          const isMine = msg.sender.id === currentUser.id;
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
                          <div className="message-file-content">
                            {msg.sharedFile.mimeType?.startsWith('image/') ? (
                              <div className="message-image">
                                <img 
                                  src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                  alt={msg.sharedFile.originalName}
                                  className="message-file-image"
                                  onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`, '_blank')}
                                />
                                <div className="message-file-overlay">
                                  <span className="message-file-name">{msg.sharedFile.originalName}</span>
                                  <a
                                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                    download
                                    className="message-file-download"
                                    title="Télécharger"
                                  >
                                    ⬇️
                                  </a>
                                </div>
                              </div>
                            ) : msg.sharedFile.mimeType?.startsWith('video/') ? (
                              <div className="message-video">
                                <video 
                                  src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                  controls
                                  className="message-file-video"
                                />
                                <div className="message-file-overlay">
                                  <span className="message-file-name">{msg.sharedFile.originalName}</span>
                                  <a
                                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                    download
                                    className="message-file-download"
                                    title="Télécharger"
                                  >
                                    ⬇️
                                  </a>
                                </div>
                              </div>
                            ) : msg.sharedFile.mimeType?.startsWith('audio/') ? (
                              <div className="message-audio">
                                <div className="message-audio-content">
                                  <span className="audio-icon">🎵</span>
                                  <audio 
                                    src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                    controls
                                    className="message-file-audio"
                                  />
                                </div>
                                <div className="message-file-overlay">
                                  <span className="message-file-name">{msg.sharedFile.originalName}</span>
                                  <a
                                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                    download
                                    className="message-file-download"
                                    title="Télécharger"
                                  >
                                    ⬇️
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="message-document">
                                <div className="message-document-content">
                                  <div className="document-icon">
                                    {msg.sharedFile.mimeType?.includes('pdf') ? '📄' : 
                                     msg.sharedFile.mimeType?.includes('doc') ? '📝' : 
                                     msg.sharedFile.mimeType?.includes('zip') || msg.sharedFile.mimeType?.includes('rar') ? '📦' : '📎'}
                                  </div>
                                  <div className="document-details">
                                    <div className="document-name">{msg.sharedFile.originalName}</div>
                                    <div className="document-size">
                                      {(msg.sharedFile.fileSize / 1024).toFixed(1)} Ko
                                    </div>
                                  </div>
                                  <a
                                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sharedFile.filePath}`}
                                    download
                                    className="message-file-download"
                                    title="Télécharger"
                                  >
                                    ⬇️
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
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
          {isTyping && (
            <div className="typing-indicator">
              <span>{user.username} est en train d'écrire...</span>
            </div>
          )}
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
                onClick={() => document.getElementById("privateFileInput").click()}
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
              id="privateFileInput"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
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
        <div className="file-preview-container">
          <div className="file-preview-header">
            <span className="file-preview-title">Fichier à envoyer</span>
            <button 
              type="button" 
              className="file-preview-remove"
              onClick={removeFile}
            >
              ✕
            </button>
          </div>
          
          <div className="file-preview-content">
            {fileType?.startsWith('image/') && filePreview ? (
              <div className="media-preview">
                <img 
                  src={filePreview} 
                  alt="Prévisualisation" 
                  className="image-preview"
                />
                <div className="file-info-overlay">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} Ko</span>
                </div>
              </div>
            ) : fileType?.startsWith('video/') && filePreview ? (
              <div className="media-preview">
                <video 
                  src={filePreview} 
                  controls 
                  className="video-preview"
                />
                <div className="file-info-overlay">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} Ko</span>
                </div>
              </div>
            ) : fileType?.startsWith('audio/') ? (
              <div className="media-preview">
                <div className="audio-preview">
                  <span className="audio-icon">🎵</span>
                  <audio src={filePreview} controls />
                </div>
                <div className="file-info-overlay">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} Ko</span>
                </div>
              </div>
            ) : (
              <div className="document-preview">
                <div className="document-icon">
                  {fileType?.includes('pdf') ? '📄' : 
                   fileType?.includes('doc') ? '📝' : 
                   fileType?.includes('zip') || fileType?.includes('rar') ? '📦' : '📎'}
                </div>
                <div className="document-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} Ko</span>
                  <span className="file-type">{fileType || 'Fichier'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Sidebar droite - Fichiers partagés */}
      <div className="private-sidebar-right">
        <div className="files-header">
          <h3 className="files-title">Fichiers partagés</h3>
          <p className="files-count">{sharedFiles.length} fichier{sharedFiles.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="files-list">
          {sharedFiles.length > 0 ? (
            sharedFiles.map(file => (
              <div key={file.id} className="file-item">
                <div className="file-icon">
                  {file.mimeType?.startsWith('image/') ? '🖼️' : 
                   file.mimeType?.startsWith('video/') ? '🎥' : 
                   file.mimeType?.startsWith('audio/') ? '🎵' : '📄'}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.originalName}</div>
                  <div className="file-meta">
                    {(file.fileSize / 1024).toFixed(0)} Ko
                  </div>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${file.filePath}`}
                  download
                  className="file-download"
                >
                  ⬇️
                </a>
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
