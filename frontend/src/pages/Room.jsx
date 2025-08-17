import { useEffect, useState, useRef } from "react";
import api from "../utils/axios";
import "../style/room.css";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

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

export default function Room({ roomId }) { 
  const params = useParams();
  const actualRoomId = roomId || params.roomId;
  
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [file, setFile] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token:", token ? "Présent" : "Absent");
    console.log("RoomId:", actualRoomId);
    
    // Récupérer les informations de l'utilisateur d'abord
    api.get("/auth/me")
      .then(res => {
        console.log("Utilisateur connecté:", res.data.user);
        setUser(res.data.user);
        
        // Une fois l'utilisateur chargé, récupérer les infos de la salle
        return api.get(`/rooms/${actualRoomId}`);
      })
      .then(res => {
        console.log("Informations salle:", res.data.room);
        setRoom(res.data.room);
        setMembers(res.data.room.users.map(u => u.user));
        
        // Vérifier si l'utilisateur est membre maintenant qu'on a les deux infos
        const currentUser = res.data.room.users.find(u => u.user.id === user?.id);
        const isUserMember = !!currentUser;
        console.log("Utilisateur membre:", isUserMember);
        setIsMember(isUserMember);
        
        // Si l'utilisateur est membre, récupérer les messages
        if (isUserMember) {
          console.log("Utilisateur membre, récupération des messages...");
          return api.get(`/messages/room/${actualRoomId}`);
        } else {
          throw new Error("Utilisateur non membre");
        }
      })
      .then(res => {
        if (res && res.data) {
          console.log("Messages récupérés:", res.data.messages.length);
          console.log("Premier message:", res.data.messages[0]);
          setMessages(res.data.messages);
        }
      })
      .catch(err => {
        console.error("Erreur récupération:", err.message);
        console.error("Détails erreur:", err.response?.data);
        
        // Si l'utilisateur n'est pas membre, essayer de le rejoindre
        if (err.message === "Utilisateur non membre" || 
            (err.response?.status === 403 && err.response?.data?.message === "Vous n'êtes pas membre de cette salle")) {
          console.log("Tentative de rejoindre la salle...");
          api.post(`/rooms/${actualRoomId}/fix-membership`)
            .then(res => {
              console.log("Utilisateur ajouté à la salle:", res.data);
              setIsMember(true);
              // Recharger les messages après avoir rejoint la salle
              return api.get(`/messages/room/${actualRoomId}`);
            })
            .then(res => {
              console.log("Messages récupérés après rejoindre:", res.data.messages.length);
              console.log("Premier message après rejoindre:", res.data.messages[0]);
              setMessages(res.data.messages);
            })
            .catch(joinErr => {
              console.error("Erreur lors de la tentative de rejoindre la salle:", joinErr.response?.data);
            });
        }
      });

    // --- SOCKET.IO ---
    socketRef.current = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      auth: { token }
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connecté");
      socketRef.current.emit("joinRoom", parseInt(actualRoomId));
    });

    socketRef.current.on("newMessage", (msg) => {
      console.log("Nouveau message reçu:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Erreur connexion socket:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [actualRoomId]); // Retiré user de la dépendance pour éviter les re-renders

  // Effet séparé pour rejoindre la salle quand l'utilisateur devient membre
  useEffect(() => {
    if (isMember && socketRef.current && socketRef.current.connected) {
      console.log("Rejoindre la salle via socket");
      socketRef.current.emit("joinRoom", parseInt(actualRoomId));
    }
  }, [isMember, actualRoomId]);

  // Effet pour vérifier l'adhésion quand l'utilisateur change
  useEffect(() => {
    if (user && room) {
      const isUserMember = room.users.some(u => u.user.id === user.id);
      console.log("Vérification adhésion - Utilisateur membre:", isUserMember);
      setIsMember(isUserMember);
    }
  }, [user, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  const handleSend = e => {
    e.preventDefault();
    console.log("Envoi du message:", message); // Debug
    if (!message.trim() && !file) return;

    if (file) {
      // Envoi de fichier via API REST
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", actualRoomId);
      api.post("/files/upload", formData)
        .then(() => setFile(null))
        .catch(err => {
          console.error("Erreur upload fichier:", err.response?.data);
        });
    }

    if (message.trim()) {
      socketRef.current.emit("sendMessage", {
        content: message,
        roomId: parseInt(actualRoomId)
      });
      setMessage("");
    }
    setShowEmojis(false);
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleJoin = async () => {
    try {
      console.log("Tentative de rejoindre la salle...");
      await api.post(`/rooms/${actualRoomId}/join`);
      console.log("Utilisateur ajouté à la salle");
      
      // Rafraîchir la salle et les messages
      const res = await api.get(`/rooms/${actualRoomId}`);
      setRoom(res.data.room);
      setMembers(res.data.room.users.map(u => u.user));
      
      // Vérifier explicitement si l'utilisateur est maintenant membre
      const isUserMember = res.data.room.users.some(u => u.user.id === user.id);
      console.log("Après adhésion - Utilisateur membre:", isUserMember);
      setIsMember(isUserMember);
      
      if (isUserMember) {
        // Recharger les messages après avoir rejoint
        console.log("Récupération des messages après adhésion...");
        const messagesRes = await api.get(`/messages/room/${actualRoomId}`);
        console.log("Messages récupérés après adhésion:", messagesRes.data.messages.length);
        console.log("Premier message après adhésion:", messagesRes.data.messages[0]);
        setMessages(messagesRes.data.messages);
        
        // Rejoindre la salle via socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("joinRoom", parseInt(actualRoomId));
        }
      }
    } catch (err) {
      console.error("Erreur lors de la tentative de rejoindre la salle:", err.response?.data);
      alert(err.response?.data?.message || "Erreur lors de la tentative de rejoindre la salle");
    }
  };

  if (!room) return <div>Chargement...</div>;

  return (
    <div className="room-container">
      <aside className="room-sidebar">
        <h3>{room.name}</h3>
        <p>{room.description}</p>
        <div className="room-members">
          <h4>Membres en ligne</h4>
          {members.map(m => (
            <div key={m.id} className="room-member">
              <img
                src={
                  m.avatar && !m.avatar.startsWith("http")
                    ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${m.avatar}`
                    : m.avatar || "/default-avatar.png"
                }
                alt="avatar"
                className="room-member-avatar"
              />
              <span>{m.username}</span>
            </div>
          ))}
        </div>
      </aside>
      <main className="room-main">
        {!isMember ? (
          <div className="room-join-block">
            <p>Vous devez rejoindre ce groupe pour voir les messages et participer.</p>
            <button className="room-join-btn" onClick={handleJoin}>Rejoindre le groupe</button>
          </div>
        ) : (
          <>
            <div className="room-messages">
              {messages.map(msg => {
                const isMine = msg.sender.id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`room-message-bubble ${isMine ? "mine" : "other"}`}
                    style={{ position: 'relative' }}
                  >
                    {!isMine && (
                      <div className="room-message-meta">
                        <img
                          src={
                            msg.sender.avatar && !msg.sender.avatar.startsWith("http")
                              ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${msg.sender.avatar}`
                              : msg.sender.avatar || "/default-avatar.png"
                          }
                          alt="avatar"
                          className="room-message-avatar"
                        />
                        <span className="room-message-sender">{msg.sender.username}</span>
                      </div>
                    )}
                    <div className="room-message-content">{msg.content}</div>
                    <div className="room-message-time">{formatDate(msg.createdAt)}</div>
                    {isMine && (
                      <div className="room-message-actions" style={{ position: 'absolute', top: 4, right: 8, display: 'flex', gap: 4 }}>
                        <button
                          className="msg-action-btn"
                          title="Supprimer pour tout le monde"
                          onClick={async () => {
                            if(window.confirm('Supprimer ce message pour tout le monde ?')) {
                              try {
                                await api.delete(`/messages/${msg.id}`);
                                setMessages(prev => prev.filter(m => m.id !== msg.id));
                              } catch (err) {
                                alert('Erreur lors de la suppression');
                              }
                            }
                          }}
                        >🗑️</button>
                        <button
                          className="msg-action-btn"
                          title="Supprimer pour moi"
                          onClick={async () => {
                            // Optionnel : à implémenter côté backend pour masquer le message à l'utilisateur uniquement
                            alert('Fonctionnalité à venir : suppression pour moi uniquement');
                          }}
                        >🙈</button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
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
            <form className="room-form" onSubmit={handleSend}>
              <button
                type="button"
                title="Envoyer un fichier"
                onClick={() => document.getElementById("fileInput").click()}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem" }}
              >📎</button>
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={e => setFile(e.target.files[0])}
              />
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Votre message..."
              />
              <button
                type="button"
                title="Emoji"
                onClick={() => setShowEmojis(!showEmojis)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem" }}
              >😊</button>
              <button type="submit">Envoyer</button>
            </form>
            {file && (
              <div style={{ marginTop: 8, color: "#2563eb" }}>
                Fichier sélectionné : {file.name}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
