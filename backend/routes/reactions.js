const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

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

// POST /api/reactions - Ajouter une réaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user.userId;

    if (!messageId || !emoji) {
      return res.status(400).json({
        success: false,
        message: 'Message ID et emoji sont requis'
      });
    }

    // Vérifier que le message existe
    const message = await prisma.message.findUnique({
      where: { id: parseInt(messageId) },
      include: {
        room: {
          include: {
            users: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier les permissions
    if (message.roomId) {
      // Message de salle - vérifier que l'utilisateur est membre
      if (message.room.users.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas membre de cette salle'
        });
      }
    } else {
      // Message privé - vérifier que l'utilisateur est impliqué
      if (message.senderId !== userId && message.receiverId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à ce message'
        });
      }
    }

    // Vérifier si la réaction existe déjà
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        userId: userId,
        messageId: parseInt(messageId),
        emoji: emoji
      }
    });

    if (existingReaction) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà réagi avec cet emoji'
      });
    }

    // Créer la réaction
    const reaction = await prisma.messageReaction.create({
      data: {
        userId: userId,
        messageId: parseInt(messageId),
        emoji: emoji
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    console.log(`👍 Réaction ajoutée: utilisateur ${userId} a réagi avec ${emoji} au message ${messageId}`);

    res.status(201).json({
      success: true,
      reaction
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réaction'
    });
  }
});

// DELETE /api/reactions/:messageId/:emoji - Supprimer une réaction
router.delete('/:messageId/:emoji', authenticateToken, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user.userId;

    // Vérifier que la réaction existe
    const reaction = await prisma.messageReaction.findFirst({
      where: {
        userId: userId,
        messageId: parseInt(messageId),
        emoji: emoji
      }
    });

    if (!reaction) {
      return res.status(404).json({
        success: false,
        message: 'Réaction non trouvée'
      });
    }

    // Supprimer la réaction
    await prisma.messageReaction.delete({
      where: { id: reaction.id }
    });

    console.log(`🗑️ Réaction supprimée: utilisateur ${userId} a supprimé sa réaction ${emoji} du message ${messageId}`);

    res.json({
      success: true,
      message: 'Réaction supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la réaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réaction'
    });
  }
});

// GET /api/reactions/:messageId - Obtenir les réactions d'un message
router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Vérifier que le message existe et que l'utilisateur y a accès
    const message = await prisma.message.findUnique({
      where: { id: parseInt(messageId) },
      include: {
        room: {
          include: {
            users: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier les permissions
    if (message.roomId) {
      if (message.room.users.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas membre de cette salle'
        });
      }
    } else {
      if (message.senderId !== userId && message.receiverId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à ce message'
        });
      }
    }

    // Récupérer toutes les réactions du message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: parseInt(messageId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Grouper les réactions par emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      if (reaction.user.id === userId) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      reactions: Object.values(groupedReactions)
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réactions'
    });
  }
});

// GET /api/reactions/popular - Obtenir les emojis populaires
router.get('/popular/emojis', authenticateToken, async (req, res) => {
  try {
    const popularEmojis = await prisma.messageReaction.groupBy({
      by: ['emoji'],
      _count: {
        emoji: true
      },
      orderBy: {
        _count: {
          emoji: 'desc'
        }
      },
      take: 10
    });

    const emojis = popularEmojis.map(item => ({
      emoji: item.emoji,
      count: item._count.emoji
    }));

    res.json({
      success: true,
      emojis
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des emojis populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des emojis populaires'
    });
  }
});

module.exports = router;

