const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// Rechercher des utilisateurs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, intentions, gender, page = 1, limit = 20 } = req.query;
    
    const where = {
      AND: [
        { id: { not: req.user.id } },
        { isBlocked: false }
      ]
    };

    if (q) {
      where.OR = [
        { username: { contains: q } },
        { interests: { contains: q } }
      ];
    }

    if (intentions) {
      where.intentions = intentions;
    }

    if (gender) {
      where.gender = gender;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        age: true,
        gender: true,
        interests: true,
        intentions: true,
        avatar: true,
        isOnline: true,
        lastSeen: true
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: [
        { isOnline: 'desc' },
        { lastSeen: 'desc' }
      ]
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un utilisateur spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        age: true,
        gender: true,
        interests: true,
        intentions: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier son profil
router.patch('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username, age, gender, interests, intentions, password } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (age) updateData.age = parseInt(age);
    if (gender) updateData.gender = gender;
    if (interests) updateData.interests = interests;
    if (intentions) updateData.intentions = intentions;
    if (req.file) updateData.avatar = req.file.filename;

    if (password && password.trim().length > 0) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        age: true,
        gender: true,
        interests: true,
        intentions: true,
        avatar: true
      }
    });

    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Bloquer un utilisateur
router.post('/:id/block', authenticateToken, async (req, res) => {
  try {
    const blockedId = parseInt(req.params.id);
    
    if (blockedId === req.user.id) {
      return res.status(400).json({ error: 'Impossible de se bloquer soi-même' });
    }

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: blockedId
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'Utilisateur déjà bloqué' });
    }

    await prisma.blockedUser.create({
      data: {
        blockerId: req.user.id,
        blockedId: blockedId
      }
    });

    res.json({ message: 'Utilisateur bloqué avec succès' });
  } catch (error) {
    console.error('Erreur lors du blocage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Utilisateurs en ligne
router.get('/online/list', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { 
        isOnline: true,
        id: { not: req.user.id }
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        intentions: true
      },
      take: 50
    });

    res.json({ users });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs en ligne:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
