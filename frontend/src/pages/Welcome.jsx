import { Link } from "react-router-dom";
import "../style/welcome.css";

export default function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">ConnectChat</h1>
        <p className="welcome-desc">
          Plateforme de tchat moderne, sécurisée et conviviale.<br />
          Rejoignez des salles thématiques, discutez en privé, partagez des fichiers et faites de belles rencontres !
        </p>
        <div className="welcome-btns">
          <Link to="/register" className="welcome-btn primary">
            S'inscrire
          </Link>
          <Link to="/login" className="welcome-btn secondary">
            Se connecter
          </Link>
        </div>
      </div>
      <footer className="welcome-footer">© 2024 ConnectChat</footer>
    </div>
  );
} 