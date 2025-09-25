const crypto = require('crypto');

// Middleware de validation des données d'entrée
const validateInput = (req, res, next) => {
  try {
    // Nettoyer et valider les données JSON
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Supprimer les caractères dangereux
          req.body[key] = req.body[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        }
      });
    }

    // Valider les paramètres d'URL
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].replace(/[^a-zA-Z0-9-_]/g, '');
        }
      });
    }

    // Valider les query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].replace(/[^a-zA-Z0-9-_]/g, '');
        }
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erreur validation des données:', error);
    res.status(400).json({ error: 'Données invalides' });
  }
};

// Middleware de protection CSRF basique
const csrfProtection = (req, res, next) => {
  // Vérifier l'origine de la requête
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  
  // Autoriser les requêtes sans origine (applications natives, tests)
  if (!origin && !referer) {
    return next();
  }

  // Vérifier que l'origine correspond aux domaines autorisés
  const allowedOrigins = (process.env.FRONTEND_URL || "https://chatrooms-five.vercel.app").split(",");
  
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`🚫 Tentative d'accès CSRF depuis: ${origin}`);
    return res.status(403).json({ error: 'Origine non autorisée' });
  }

  next();
};

// Middleware de validation des types de fichiers
const validateFileType = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const allowedMimes = [
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
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    console.warn(`🚫 Type de fichier non autorisé: ${req.file.mimetype}`);
    return res.status(400).json({ 
      error: 'Type de fichier non autorisé',
      allowedTypes: allowedMimes
    });
  }

  // Vérifier la taille du fichier (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    console.warn(`🚫 Fichier trop volumineux: ${req.file.size} bytes`);
    return res.status(400).json({ 
      error: 'Fichier trop volumineux',
      maxSize: '10MB'
    });
  }

  next();
};

// Middleware de logging de sécurité
const securityLogger = (req, res, next) => {
  const securityEvents = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  };

  // Détecter les activités suspectes
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // XSS
    /union\s+select/i, // SQL Injection
    /drop\s+table/i, // SQL Injection
    /exec\s*\(/i, // Command Injection
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
  );

  if (isSuspicious) {
    console.warn(`🚨 Activité suspecte détectée:`, securityEvents);
  }

  // Log toutes les requêtes d'authentification
  if (req.url.includes('/auth') && req.method === 'POST') {
    console.log(`🔐 Tentative d'authentification:`, {
      ip: req.ip,
      timestamp: securityEvents.timestamp
    });
  }

  next();
};

// Middleware de protection contre les attaques par énumération
const preventEnumeration = (req, res, next) => {
  // Pour les routes d'authentification, standardiser les temps de réponse
  if (req.url.includes('/auth')) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      // Standardiser le temps de réponse pour éviter l'énumération d'utilisateurs
      if (responseTime < 100) {
        setTimeout(() => {}, 100 - responseTime);
      }
    });
  }

  next();
};

// Middleware de validation des tokens JWT
const validateTokenFormat = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Vérifier le format du token JWT
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    
    if (!jwtPattern.test(token)) {
      console.warn(`🚫 Format de token JWT invalide depuis IP: ${req.ip}`);
      return res.status(401).json({ error: 'Token invalide' });
    }
  }

  next();
};

module.exports = {
  validateInput,
  csrfProtection,
  validateFileType,
  securityLogger,
  preventEnumeration,
  validateTokenFormat
};
