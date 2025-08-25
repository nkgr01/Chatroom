// Service PWA pour ConnectChat
class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.updateAvailable = false;
    
    this.init();
  }

  async init() {
    // Vérifier si l'app est installée
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;

    // Écouter les événements d'installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // Écouter les événements de mise à jour
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallBanner();
  // ...log supprimé pour la production...
    });

    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.hideOfflineBanner();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineBanner();
    });

    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
  // ...log supprimé pour la production...

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.showUpdateBanner();
            }
          });
        });

        // Écouter les messages du service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data;
          this.handleSWMessage(type, payload);
        });

      } catch (error) {
  // ...log supprimé pour la production...
      }
    }
  }

  // Afficher la bannière d'installation
  showInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-banner install';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">📱</div>
        <div class="banner-text">
          <h4>Installer ConnectChat</h4>
          <p>Accédez rapidement à vos conversations depuis votre écran d'accueil</p>
        </div>
        <div class="banner-actions">
          <button class="banner-btn primary" onclick="pwaService.install()">
            Installer
          </button>
          <button class="banner-btn secondary" onclick="pwaService.hideInstallBanner()">
            Plus tard
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Masquer la bannière d'installation
  hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Installer l'application
  async install() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
  // ...log supprimé pour la production...
      } else {
  // ...log supprimé pour la production...
      }
      
      this.deferredPrompt = null;
      this.hideInstallBanner();
    }
  }

  // Afficher la bannière de mise à jour
  showUpdateBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.className = 'pwa-banner update';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">🔄</div>
        <div class="banner-text">
          <h4>Mise à jour disponible</h4>
          <p>Une nouvelle version de ConnectChat est disponible</p>
        </div>
        <div class="banner-actions">
          <button class="banner-btn primary" onclick="pwaService.update()">
            Mettre à jour
          </button>
          <button class="banner-btn secondary" onclick="pwaService.hideUpdateBanner()">
            Plus tard
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Masquer la bannière de mise à jour
  hideUpdateBanner() {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Mettre à jour l'application
  async update() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      
      // Recharger la page après la mise à jour
      window.location.reload();
    }
  }

  // Afficher la bannière hors ligne
  showOfflineBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-offline-banner';
    banner.className = 'pwa-banner offline';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">📡</div>
        <div class="banner-text">
          <h4>Hors ligne</h4>
          <p>Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.</p>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Masquer la bannière hors ligne
  hideOfflineBanner() {
    const banner = document.getElementById('pwa-offline-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Gérer les messages du service worker
  handleSWMessage(type, payload) {
    switch (type) {
      case 'UPDATE_AVAILABLE':
        this.updateAvailable = true;
        this.showUpdateBanner();
        break;
      case 'CACHE_UPDATED':
  // ...log supprimé pour la production...
        break;
    }
  }

  // Vérifier si l'app peut être installée
  canInstall() {
    return this.deferredPrompt !== null;
  }

  // Vérifier si l'app est installée
  isAppInstalled() {
    return this.isInstalled;
  }

  // Vérifier la connectivité
  isAppOnline() {
    return this.isOnline;
  }

  // Vérifier si une mise à jour est disponible
  hasUpdate() {
    return this.updateAvailable;
  }

  // Vider le cache
  async clearCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            // ...log supprimé pour la production...
            resolve(true);
          } else {
            // ...log supprimé pour la production...
            resolve(false);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
      });
    }
    return false;
  }

  // Obtenir les informations de l'app
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      canInstall: this.canInstall(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }
}

// Créer l'instance globale
const pwaService = new PWAService();

// Exposer globalement pour les boutons HTML
window.pwaService = pwaService;

export default pwaService;

