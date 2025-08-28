const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const morgan = require('morgan');
require('dotenv').config();

// Initialisation globale de Prisma
const prisma = new PrismaClient();

// Vérifier la connexion Prisma
prisma.$connect()
  .then(() => {
    console.log('✅ Connexion Prisma établie avec succès');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion Prisma:', error);
  });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const searchRoutes = require('./routes/search');
const reactionRoutes = require('./routes/reactions');
const { authenticateSocket, handleConnection } = require('./socket/socketHandler');

// Middlewares de sécurité personnalisés
const {
  validateInput,
  csrfProtection,
  validateFileType,
  securityLogger,
  preventEnumeration,
  validateTokenFormat
} = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO avec CORS sécurisé
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.FRONTEND_URL).split(",");
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ===== MIDDLEWARES DE SÉCURITÉ SIMPLIFIÉS =====

// Morgan - Logging des requêtes HTTP
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(`📝 ${message.trim()}`);
    }
  }
}));

// Middlewares globaux
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.FRONTEND_URL).split(",");
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== MIDDLEWARES DE SÉCURITÉ PERSONNALISÉS =====

// Logging de sécurité
app.use(securityLogger);

// Protection CSRF
app.use(csrfProtection);

// Validation des tokens JWT
app.use(validateTokenFormat);

// Protection contre l'énumération
app.use(preventEnumeration);

// Validation des données d'entrée
app.use(validateInput);

// Servir les fichiers statiques uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES API =====

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes d'upload avec validation de fichiers
app.use('/api/files/upload', validateFileType);

// Autres routes API
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reactions', reactionRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ConnectChat API est en cours d\'exécution',
    timestamp: new Date().toISOString(),
    security: {
      morgan: 'enabled',
      csrfProtection: 'enabled',
      inputValidation: 'enabled',
      fileValidation: 'enabled',
      securityLogging: 'enabled',
      tokenValidation: 'enabled'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// Configuration Socket.IO
io.use(authenticateSocket);
io.on('connection', handleConnection(io));

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur ConnectChat démarré sur le port ${PORT}`);
  console.log(`📡 API disponible à l'adresse: http://localhost:${PORT}/api`);
  console.log(`🌐 Serveur accessible depuis le réseau local: http://192.168.1.23:${PORT}`);
  console.log(`🔒 Sécurité activée: Morgan, CSRF, Validation, Logging`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur en cours...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});
