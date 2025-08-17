// Service Worker pour ConnectChat PWA
const CACHE_NAME = 'connectchat-v1.0.0';
const STATIC_CACHE = 'connectchat-static-v1.0.0';
const DYNAMIC_CACHE = 'connectchat-dynamic-v1.0.0';

// Fichiers à mettre en cache statique
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/default-avatar.png'
];

// Installer le service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Installation du Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Mise en cache des fichiers statiques');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker installé avec succès');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erreur lors de l\'installation:', error);
      })
  );
});

// Activer le service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Activation du Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activé');
        return self.clients.claim();
      })
  );
});

// Intercepter les requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers l'API
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Ignorer les requêtes de fichiers uploadés
  if (url.pathname.startsWith('/uploads/')) {
    return;
  }

  // Stratégie de cache pour les fichiers statiques
  if (STATIC_FILES.includes(url.pathname) || url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Stratégie de cache pour les autres ressources
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Retourner la version en cache et mettre à jour en arrière-plan
          fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
            })
            .catch(() => {
              // Ignorer les erreurs de mise à jour en arrière-plan
            });
          return response;
        }

        // Si pas en cache, récupérer depuis le réseau
        return fetch(request)
          .then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Retourner une page d'erreur hors ligne
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        });
      break;
  }
});

// Gérer les notifications push (pour une utilisation future)
self.addEventListener('push', (event) => {
  console.log('📱 Notification push reçue:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouveau message reçu',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/chatroom'
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ConnectChat', options)
    );
  }
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Clic sur notification:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/chatroom')
    );
  }
});

// Gérer les erreurs
self.addEventListener('error', (event) => {
  console.error('❌ Erreur Service Worker:', event.error);
});

// Gérer les rejets de promesses non gérés
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesse rejetée non gérée:', event.reason);
});

