module.exports = {
  // Configuration de la base de données
  database: {
    url: process.env.DATABASE_URL || 'mysql://localhost:3306/connectchat'
  },
  
  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
    expiresIn: '7d'
  },
  
  // Configuration du serveur
  server: {
    port: process.env.PORT || 5001,
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  },
  
  // Configuration des uploads
  uploads: {
    path: './uploads',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/ogg', 'audio/wav',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-rar-compressed'
    ]
  },
  
  // Configuration Socket.IO
  socket: {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  }
};
