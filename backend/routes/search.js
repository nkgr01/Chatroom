const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { decrypt } = require('../utils/encryption');
const { PrismaClient } = require('@prisma/client');

// Initialisation de Prisma
const prisma = new PrismaClient();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// GET /api/search/global - Recherche globale
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query, type = 'all', limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La requête de recherche doit contenir au moins 2 caractères'
      });
    }

    const searchQuery = query.trim().toLowerCase();
    const results = {
      messages: [],
      users: [],
      rooms: []
    };

    // 1. Recherche dans les messages
    if (type === 'all' || type === 'messages') {
      // Messages dans les salles où l'utilisateur est membre
      const roomMessages = await prisma.message.findMany({
        where: {
          AND: [
            {
              room: {
                users: {
                  some: {
                    userId: userId
                  }
                }
              }
            },
            {
              OR: [
                {
                  content: {
                    contains: searchQuery
                  }
                }
              ]
            }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          room: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit)
      });

      // Messages privés
      const privateMessages = await prisma.message.findMany({
        where: {
          AND: [
            {
              OR: [
                { senderId: userId, isPrivate: true },
                { receiverId: userId, isPrivate: true }
              ]
            },
            {
              content: {
                contains: searchQuery
              }
            }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit)
      });

      // Déchiffrer et formater les messages
      const allMessages = [...roomMessages, ...privateMessages];
      results.messages = allMessages.map(message => {
        let decryptedContent;
        try {
          decryptedContent = decrypt(JSON.parse(message.content));
        } catch (error) {
          decryptedContent = '[Message non déchiffrable]';
        }

        return {
          ...message,
          content: decryptedContent,
          type: message.roomId ? 'room' : 'private',
          context: message.roomId ? message.room.name : 
            (message.senderId === userId ? message.receiver.username : message.sender.username)
        };
      }).slice(0, parseInt(limit));
    }

    // 2. Recherche d'utilisateurs
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } }, // Exclure l'utilisateur actuel
            {
              OR: [
                { username: { contains: searchQuery } },
                { interests: { contains: searchQuery } }
              ]
            }
          ]
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          isOnline: true,
          interests: true,
          age: true,
          gender: true
        },
        orderBy: {
          isOnline: 'desc',
          username: 'asc'
        },
        take: parseInt(limit)
      });

      results.users = users;
    }

    // 3. Recherche de salles
    if (type === 'all' || type === 'rooms') {
      const rooms = await prisma.room.findMany({
        where: {
          AND: [
            {
              users: {
                some: {
                  userId: userId
                }
              }
            },
            {
              OR: [
                                 { name: { contains: searchQuery } },
                 { description: { contains: searchQuery } }
              ]
            }
          ]
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isOnline: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: parseInt(limit)
      });

      results.rooms = rooms.map(room => ({
        ...room,
        userCount: room.users.length,
        messageCount: room._count.messages,
        onlineCount: room.users.filter(u => u.user.isOnline).length
      }));
    }

    // Statistiques de recherche
    const stats = {
      total: results.messages.length + results.users.length + results.rooms.length,
      messages: results.messages.length,
      users: results.users.length,
      rooms: results.rooms.length
    };

    console.log(`🔍 Recherche globale pour l'utilisateur ${userId}: "${searchQuery}" - ${stats.total} résultats`);

    res.json({
      success: true,
      query: searchQuery,
      results,
      stats
    });

  } catch (error) {
    console.error('Erreur lors de la recherche globale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

// GET /api/search/suggestions - Suggestions de recherche
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const searchQuery = query.trim().toLowerCase();
    const suggestions = [];

    // Suggestions d'utilisateurs
    const userSuggestions = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
                     { username: { contains: searchQuery } }
        ]
      },
      select: {
        id: true,
        username: true,
        avatar: true
      },
      take: 5
    });

    suggestions.push(...userSuggestions.map(user => ({
      type: 'user',
      id: user.id,
      text: user.username,
      avatar: user.avatar
    })));

    // Suggestions de salles
    const roomSuggestions = await prisma.room.findMany({
      where: {
        AND: [
          {
            users: {
              some: {
                userId: userId
              }
            }
          },
                     { name: { contains: searchQuery } }
        ]
      },
      select: {
        id: true,
        name: true,
        icon: true
      },
      take: 3
    });

    suggestions.push(...roomSuggestions.map(room => ({
      type: 'room',
      id: room.id,
      text: room.name,
      icon: room.icon
    })));

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 8)
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suggestions'
    });
  }
});

module.exports = router;

