import { Link } from "react-router-dom";
import "../style/welcome.css";

export default function Welcome() {
  return (
    <div className="welcome-container">
      <nav className="welcome-nav">
        <div className="welcome-logo">ConnectChat</div>
      </nav>
      
      <main className="welcome-main">
        <section className="welcome-hero">
          <h1 className="welcome-title">Bienvenue sur ConnectChat</h1>
          <p className="welcome-subtitle">
            Votre nouvelle plateforme de communication moderne, sécurisée et conviviale
          </p>
          <Link to="/register" className="cta-button">
            Commencer l'aventure
          </Link>
        </section>

        <section className="features-section">
          <h2>Découvrez nos fonctionnalités</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <h3>Chat en Temps Réel</h3>
              <p>Conversations instantanées et fluides avec vos contacts</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3>Sécurité Maximale</h3>
              <p>Vos conversations sont protégées et cryptées</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👥</span>
              <h3>Salles Thématiques</h3>
              <p>Rejoignez ou créez des salles selon vos intérêts</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <h3>Multi-Appareils</h3>
              <p>Accessible sur tous vos appareils</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Messages Privés</h3>
              <p>Discutez en privé avec vos contacts</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📎</span>
              <h3>Partage de Fichiers</h3>
              <p>Partagez facilement des fichiers et médias</p>
            </div>
          </div>
        </section>

        <section className="get-started-section">
          <h2>Prêt à nous rejoindre ?</h2>
          <p>Créez votre compte gratuitement et commencez à chatter en quelques secondes</p>
          <div className="welcome-btns">
            <Link to="/register" className="welcome-btn primary">
              Créer un compte
            </Link>
            <Link to="/login" className="welcome-btn secondary">
              Se connecter
            </Link>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="footer-content">
          <div className="footer-info">
            <h3>ConnectChat</h3>
            <p>La communication réinventée</p>
          </div>
          <div className="footer-links">
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-copyright">
            © 2025 ConnectChat - Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}