// Configuration centralisée de la sécurité simplifiée

module.exports = {

  // Configuration CORS
  cors: {
    allowedOrigins: process.env.FRONTEND_URL || 
      "http://localhost:5173,http://localhost:5174,http://192.168.1.23:5173,http://192.168.1.23:5174"
  },

  // Configuration des fichiers
  files: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'video/avi',
      'video/mov',
      'video/mkv',
      'video/flv',
      'video/wmv',
      'audio/mpeg',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
      '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv',
      '.mp3', '.wav', '.flac', '.aac', '.ogg',
      '.pdf', '.doc', '.docx', '.txt', '.rtf'
    ]
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },

  // Configuration du chiffrement
  encryption: {
    algorithm: 'aes-256-cbc',
    secret: process.env.ENCRYPTION_SECRET || 'default_secret_key_for_development'
  },

  // Patterns suspects pour la détection d'intrusion
  suspiciousPatterns: [
    /\.\.\//, // Directory traversal
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /javascript:/gi, // XSS
    /on\w+\s*=/gi, // XSS
    /union\s+select/gi, // SQL Injection
    /drop\s+table/gi, // SQL Injection
    /exec\s*\(/gi, // Command Injection
    /eval\s*\(/gi, // Code Injection
    /document\.cookie/gi, // Cookie theft
    /window\.location/gi, // Redirect
    /<iframe/gi, // Iframe injection
    /<object/gi, // Object injection
    /<embed/gi, // Embed injection
  ],

  // Configuration des logs de sécurité
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    suspiciousActivity: true,
    authAttempts: true,
    fileUploads: true,
    rateLimitViolations: true
  },

  // Configuration de la validation des données
  validation: {
    maxStringLength: 1000,
    maxUsernameLength: 50,
    maxEmailLength: 100,
    passwordMinLength: 8,
    passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  }
};
