import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../style/userprofile.css";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les informations des utilisateurs
        const [userResponse, currentUserResponse] = await Promise.all([
    axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
          }),
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser(userResponse.data.user);
        setCurrentUser(currentUserResponse.data.user);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        setError(error.response?.data?.error || "Erreur lors du chargement du profil");
        setLoading(false);
        
        if (error.response?.status === 404) {
          navigate("/chatroom");
        }
      }
    };

    loadUserData();
  }, [userId, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="userprofile-container">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="userprofile-container">
        <div className="error-message">
          <h3>Erreur</h3>
          <p>{error}</p>
          <button onClick={() => navigate("/chatroom")} className="back-btn">
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="userprofile-container">
        <div className="error-message">
          <h3>Utilisateur non trouvé</h3>
          <p>L'utilisateur demandé n'existe pas ou n'est pas accessible.</p>
          <button onClick={() => navigate("/chatroom")} className="back-btn">
            Retour au chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="userprofile-container">
      <div className="userprofile-header">
      <img
        src={
          user.avatar && !user.avatar.startsWith("http")
            ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${user.avatar}`
            : user.avatar || "/default-avatar.png"
        }
        alt="avatar"
        className="userprofile-avatar"
      />
        <div className="userprofile-status">
          <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-text">
            {user.isOnline ? 'En ligne' : `Vu le ${formatDate(user.lastSeen)}`}
          </span>
        </div>
      </div>
      
      <h2>{user.username}</h2>
      
      <ul className="userprofile-info-list">
        <li>
          <span className="userprofile-info-label">Âge :</span> 
          <span className="userprofile-info-value">{user.age} ans</span>
        </li>
        <li>
          <span className="userprofile-info-label">Genre :</span> 
          <span className="userprofile-info-value">{user.gender}</span>
        </li>
        <li>
          <span className="userprofile-info-label">Intentions :</span> 
          <span className="userprofile-info-value">{user.intentions}</span>
        </li>
        <li>
          <span className="userprofile-info-label">Centres d'intérêt :</span> 
          <span className="userprofile-info-value">{user.interests}</span>
        </li>
        <li>
          <span className="userprofile-info-label">Membre depuis :</span> 
          <span className="userprofile-info-value">{formatDate(user.createdAt)}</span>
        </li>
      </ul>
      
      <div className="userprofile-actions">
        {currentUser?.id === user.id ? (
          <button className="userprofile-edit-btn" onClick={() => navigate("/profile/edit")}>
            ✏️ Modifier mon profil
          </button>
        ) : (
          <button 
            className="userprofile-message-btn" 
            onClick={() => navigate(`/private/${user.id}`)}
          >
            💬 Envoyer un message
          </button>
        )}
        
        <button 
          className="userprofile-back-btn" 
          onClick={() => navigate("/chatroom")}
        >
          ← Retour au menu
        </button>
      </div>
    </div>
  );
}
