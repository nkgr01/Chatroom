import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';
import '../style/notificationManager.css';

const NotificationManager = ({ currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  useEffect(() => {
    // Vérifier le statut des notifications
    setNotificationStatus(notificationService.getStatus());

    // Gérer le focus de la fenêtre
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialiser Socket.IO
    const newSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      auth: { token }
    });

    setSocket(newSocket);

    // Écouter les nouveaux messages
    newSocket.on('newMessage', (message) => {
      console.log('📨 Nouveau message reçu:', message);
      
      // Afficher notification seulement si la fenêtre n'est pas focalisée
      if (!isWindowFocused && message.sender.id !== currentUser.id) {
        notificationService.showNewMessageNotification(
          message, 
          message.sender, 
          message.isPrivate
        );
      }
    });

    // Écouter les nouveaux messages privés
    newSocket.on('newPrivateMessage', (message) => {
      console.log('💬 Nouveau message privé reçu:', message);
      
      if (!isWindowFocused && message.sender.id !== currentUser.id) {
        notificationService.showNewMessageNotification(
          message, 
          message.sender, 
          true
        );
      }

      try {
        // Propager un événement global pour mettre à jour les compteurs non lus
        window.dispatchEvent(new CustomEvent('privateMessageReceived', {
          detail: {
            fromUserId: message.sender.id,
            toUserId: message.receiverId,
            createdAt: message.createdAt
          }
        }));
      } catch {}
    });

    // Écouter les fichiers partagés
    newSocket.on('fileShared', (file) => {
      console.log('📁 Fichier partagé reçu:', file);
      
      if (!isWindowFocused && file.sender.id !== currentUser.id) {
        notificationService.showFileNotification(
          file, 
          file.sender, 
          file.isPrivate
        );
      }
    });

    // Écouter les utilisateurs en ligne
    newSocket.on('userOnline', (user) => {
      console.log('🟢 Utilisateur en ligne:', user);
      
      // Notification discrète pour les utilisateurs en ligne
      if (!isWindowFocused) {
        notificationService.showUserOnlineNotification(user);
      }
    });

    // Écouter les demandes d'amis (futur)
    newSocket.on('friendRequest', (request) => {
      console.log('👥 Demande d\'ami reçue:', request);
      
      if (!isWindowFocused) {
        notificationService.showFriendRequestNotification(request.sender);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser, isWindowFocused]);

  // Demander la permission pour les notifications
  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationStatus(notificationService.getStatus());
    
    if (granted) {
      // Afficher une notification de test
      notificationService.showNotification('Notifications activées !', {
        body: 'Vous recevrez maintenant des notifications pour les nouveaux messages.',
        icon: '/favicon.ico',
        requireInteraction: false,
        silent: false
      });
    }
  };

  // Tester les notifications
  const testNotification = () => {
    notificationService.showNotification('Test de notification', {
      body: 'Ceci est un test de notification !',
      icon: '/favicon.ico',
      requireInteraction: false,
      silent: false
    });
  };

  if (!notificationStatus) {
    return null;
  }

  return (
    <div className="notification-manager">
      {/* Indicateur de statut des notifications */}
      <div className="notification-status">
        <div className={`status-indicator ${notificationStatus.enabled ? 'enabled' : 'disabled'}`}>
          {notificationStatus.enabled ? '🔔' : '🔕'}
        </div>
        <span className="status-text">
          {notificationStatus.enabled ? 'Notifications activées' : 'Notifications désactivées'}
        </span>
      </div>

      {/* Boutons d'action */}
      <div className="notification-actions">
        {!notificationStatus.enabled && notificationStatus.supported && (
          <button 
            className="notification-btn enable-btn"
            onClick={requestNotificationPermission}
          >
            Activer les notifications
          </button>
        )}

        {notificationStatus.enabled && (
          <button 
            className="notification-btn test-btn"
            onClick={testNotification}
          >
            Tester
          </button>
        )}

        {!notificationStatus.supported && (
          <div className="notification-warning">
            ⚠️ Votre navigateur ne supporte pas les notifications
          </div>
        )}
      </div>

      {/* Informations de statut */}
      <div className="notification-info">
        <div className="info-item">
          <span className="info-label">Support :</span>
          <span className={`info-value ${notificationStatus.supported ? 'supported' : 'not-supported'}`}>
            {notificationStatus.supported ? '✅ Supporté' : '❌ Non supporté'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Permission :</span>
          <span className={`info-value ${notificationStatus.permission}`}>
            {notificationStatus.permission === 'granted' && '✅ Accordée'}
            {notificationStatus.permission === 'denied' && '❌ Refusée'}
            {notificationStatus.permission === 'default' && '⏳ En attente'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Fenêtre :</span>
          <span className={`info-value ${isWindowFocused ? 'focused' : 'blurred'}`}>
            {isWindowFocused ? '🟢 Focalisée' : '🔴 En arrière-plan'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
