import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/logout.css";

export default function Logout() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(true);

  const handleConfirm = async () => {
    setShowConfirm(false);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        // Ce n'est pas grave si l'API échoue, on continue
      }
      localStorage.removeItem("token");
    }
    navigate("/login");
  };

  const handleCancel = () => {
    navigate("/chatroom");
  };

  if (showConfirm) {
    return (
      <div className="logout-overlay">
        <div className="logout-modal">
          <h3>Confirmer la déconnexion</h3>
          <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
          <div className="logout-buttons">
            <button onClick={handleCancel} className="logout-btn-cancel">
              Annuler
            </button>
            <button onClick={handleConfirm} className="logout-btn-confirm">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span>Déconnexion en cours...</span>
    </div>
  );
}
