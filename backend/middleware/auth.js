const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Tentative d\'authentification:', {
      path: req.path,
      method: req.method,
      headers: req.headers.authorization ? 'Token présent' : 'Pas de token'
    });
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        gender: true,
        interests: true,
        intentions: true,
        avatar: true,
        isOnline: true,
        isBlocked: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Compte bloqué' });
    }

    console.log('✅ Authentification réussie:', {
      userId: user.id,
      username: user.username,
      path: req.path
    });
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

module.exports = authenticateToken;
