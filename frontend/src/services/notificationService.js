// Service de notifications en temps réel

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.isSupported = 'Notification' in window;
    this.init();
  }

  // Initialisation du service
  async init() {
    if (!this.isSupported) {
  // ...log supprimé pour la production...
      return;
    }

    // Demander la permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    } else {
      this.hasPermission = Notification.permission === 'granted';
    }

  // ...log supprimé pour la production...
  }

  // Demander la permission
  async requestPermission() {
    if (!this.isSupported) return false;

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    
  // ...log supprimé pour la production...

    return this.hasPermission;
  }

  // Créer une notification
  showNotification(title, options = {}) {
    if (!this.isSupported || !this.hasPermission) {
      // ...log supprimé pour la production...
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Gérer les événements de la notification
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Rediriger vers l'application si nécessaire
        if (options.onClick) {
          options.onClick();
        }
      };

      notification.onclose = () => {
        if (options.onClose) {
          options.onClose();
        }
      };

  // ...log supprimé pour la production...
      return notification;
    } catch (error) {
      // ...log supprimé pour la production...
      return null;
    }
  }

  // Notification de nouveau message
  showNewMessageNotification(message, sender, isPrivate = false) {
    const title = isPrivate ? `Message de ${sender.username}` : `Nouveau message dans ${message.room?.name || 'la salle'}`;
    const body = message.content.length > 50 
      ? `${message.content.substring(0, 50)}...` 
      : message.content;

    return this.showNotification(title, {
      body,
      icon: sender.avatar || '/default-avatar.png',
      tag: `message-${message.id}`,
      requireInteraction: false,
      silent: false,
      onClick: () => {
        // Rediriger vers la conversation
        if (isPrivate) {
          window.location.href = `/private/${sender.id}`;
        } else {
          window.location.href = `/chatroom/${message.roomId}`;
        }
      }
    });
  }

  // Notification de fichier reçu
  showFileNotification(file, sender, isPrivate = false) {
    const title = isPrivate ? `Fichier de ${sender.username}` : `Fichier reçu dans ${file.room?.name || 'la salle'}`;
    const body = `${file.originalName} (${this.formatFileSize(file.fileSize)})`;

    return this.showNotification(title, {
      body,
      icon: this.getFileIcon(file.fileType),
      tag: `file-${file.id}`,
      requireInteraction: false,
      silent: false,
      onClick: () => {
        // Rediriger vers la conversation
        if (isPrivate) {
          window.location.href = `/private/${sender.id}`;
        } else {
          window.location.href = `/chatroom/${file.roomId}`;
        }
      }
    });
  }

  // Notification d'utilisateur en ligne
  showUserOnlineNotification(user) {
    return this.showNotification(`${user.username} est en ligne`, {
      body: 'Votre contact est maintenant disponible',
      icon: user.avatar || '/default-avatar.png',
      tag: `online-${user.id}`,
      requireInteraction: false,
      silent: true
    });
  }

  // Notification de demande d'ami
  showFriendRequestNotification(user) {
    return this.showNotification(`Demande d'ami de ${user.username}`, {
      body: 'Cliquez pour accepter ou refuser',
      icon: user.avatar || '/default-avatar.png',
      tag: `friend-request-${user.id}`,
      requireInteraction: true,
      silent: false,
      onClick: () => {
        // Rediriger vers les demandes d'amis
        window.location.href = '/friend-requests';
      }
    });
  }

  // Formater la taille des fichiers
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obtenir l'icône selon le type de fichier
  getFileIcon(fileType) {
    const icons = {
      image: '/icons/image.png',
      video: '/icons/video.png',
      audio: '/icons/audio.png',
      document: '/icons/document.png'
    };
    return icons[fileType] || '/icons/file.png';
  }

  // Vérifier si les notifications sont activées
  isEnabled() {
    return this.isSupported && this.hasPermission;
  }

  // Obtenir le statut des notifications
  getStatus() {
    return {
      supported: this.isSupported,
      permission: Notification.permission,
      enabled: this.isEnabled()
    };
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;
