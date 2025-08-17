const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();
const prisma = new PrismaClient();

// Vérifier la connexion Prisma
prisma.$connect()
  .then(() => {
    console.log('✅ Connexion Prisma établie avec succès dans messages.js');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion Prisma dans messages.js:', error);
  });

// Envoyer un message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { content, roomId, receiverId, isPrivate = false } = req.body;
    const senderId = req.user.id;

    if (!roomId && !receiverId) {
      return res.status(400).json({ message: 'roomId ou receiverId requis' });
    }

    // Chiffrer le message
    const encrypted = encrypt(content);

    const message = await prisma.message.create({
      data: {
        content: JSON.stringify(encrypted),
        isPrivate,
        senderId,
        roomId: roomId || null,
        receiverId: receiverId || null
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: receiverId ? { select: { id: true, username: true, avatar: true } } : undefined
      }
    });

    // Déchiffrer pour la réponse
    const responseMessage = {
      ...message,
      content: decrypt(JSON.parse(message.content))
    };

    res.status(201).json({ message: 'Message envoyé', data: responseMessage });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un message pour moi uniquement
router.post('/:id/delete-for-me', authMiddleware, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id;

    // Vérifier que le message existe
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier si déjà supprimé pour cet utilisateur
    const alreadyDeleted = await prisma.deletedMessageUser.findUnique({
      where: { userId_messageId: { userId, messageId } }
    });
    if (alreadyDeleted) {
      return res.status(200).json({ message: 'Déjà supprimé pour cet utilisateur' });
    }

    await prisma.deletedMessageUser.create({ data: { userId, messageId } });
    res.json({ message: 'Message supprimé pour vous uniquement' });
  } catch (error) {
    console.error('Erreur suppression pour moi:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les messages d'une salle
router.get('/room/:roomId', authMiddleware, async (req, res) => {
  try {
    // Vérifier que Prisma est disponible
    if (!prisma) {
      console.error('❌ Prisma n\'est pas initialisé');
      return res.status(500).json({ message: 'Erreur de base de données' });
    }

    const roomId = parseInt(req.params.roomId);
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    console.log('Récupération messages salle:', roomId, 'pour utilisateur:', userId);
    console.log('Prisma disponible:', !!prisma);

    // Vérifier si l'utilisateur est membre de la salle
    const membership = await prisma.roomUser.findFirst({ 
      where: { userId, roomId },
      include: { room: true }
    });
    console.log('Membre de la salle:', !!membership);
    console.log('Détails membership:', membership);
    
    if (!membership) {
      console.log('Utilisateur non membre, retour 403');
      return res.status(403).json({ message: 'Vous n\'êtes pas membre de cette salle' });
    }

    // Vérifier que la salle existe
    if (!membership.room) {
      console.log('Salle non trouvée');
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    console.log('Utilisateur membre, récupération des messages...');

    // Récupérer les messages supprimés pour cet utilisateur (avec gestion d'erreur)
    let deletedIds = [];
    try {
      if (prisma && prisma.deletedMessageUser) {
        const deletedMessages = await prisma.deletedMessageUser.findMany({
          where: { userId },
          select: { messageId: true }
        });
        deletedIds = deletedMessages.map(d => d.messageId);
        console.log('Messages supprimés pour cet utilisateur:', deletedIds.length);
      } else {
        console.log('⚠️ Modèle deletedMessageUser non disponible, continuation sans filtrage');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages supprimés:', error);
      console.log('⚠️ Continuation sans filtrage des messages supprimés');
    }

    // Récupérer les messages de la salle (avec gestion d'erreur)
    let messages = [];
    try {
      if (prisma && prisma.message) {
        const whereClause = { roomId };
        if (deletedIds.length > 0) {
          whereClause.id = { notIn: deletedIds };
        }
        
        messages = await prisma.message.findMany({
          where: whereClause,
          include: { sender: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: parseInt(limit)
        });
        console.log('Messages trouvés en base:', messages.length);
      } else {
        console.error('❌ Prisma ou prisma.message n\'est pas disponible');
        return res.status(500).json({ message: 'Erreur de base de données' });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return res.status(500).json({ message: 'Erreur de base de données' });
    }

    console.log('Messages trouvés en base:', messages.length);

    const decryptedMessages = messages.map(msg => {
      try {
        return {
          ...msg,
          content: decrypt(JSON.parse(msg.content))
        };
      } catch (error) {
        console.error('Erreur déchiffrement message ID:', msg.id, error);
        return {
          ...msg,
          content: '[Message non déchiffrable]'
        };
      }
    });

    console.log('Messages déchiffrés avec succès:', decryptedMessages.length);

    res.json({ messages: decryptedMessages.reverse() });
  } catch (error) {
    console.error('Erreur récupération messages salle:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Obtenir toutes les conversations privées de l'utilisateur connecté
router.get('/private', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Récupérer toutes les conversations privées distinctes
    const privateConversations = await prisma.$queryRaw`
      SELECT DISTINCT 
        CASE 
          WHEN m.senderId = ${currentUserId} THEN m.receiverId
          ELSE m.senderId
        END as userId,
        CASE 
          WHEN m.senderId = ${currentUserId} THEN m.receiverId
          ELSE m.senderId
        END as id,
        u.username,
        u.avatar,
        u.isOnline,
        (
          SELECT m2.content 
          FROM messages m2 
          WHERE (m2.senderId = ${currentUserId} AND m2.receiverId = u.id) 
             OR (m2.senderId = u.id AND m2.receiverId = ${currentUserId})
          ORDER BY m2.createdAt DESC 
          LIMIT 1
        ) as lastMessage,
        (
          SELECT m2.createdAt 
          FROM messages m2 
          WHERE (m2.senderId = ${currentUserId} AND m2.receiverId = u.id) 
             OR (m2.senderId = u.id AND m2.receiverId = ${currentUserId})
          ORDER BY m2.createdAt DESC 
          LIMIT 1
        ) as lastMessageTime
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.senderId = ${currentUserId} THEN m.receiverId
          ELSE m.senderId
        END = u.id
      )
      WHERE m.isPrivate = true 
        AND (m.senderId = ${currentUserId} OR m.receiverId = ${currentUserId})
        AND u.id != ${currentUserId}
      ORDER BY lastMessageTime DESC
    `;

    // Traiter les conversations pour déchiffrer le dernier message
    const processedConversations = privateConversations.map(conv => {
      let decryptedLastMessage = null;
      if (conv.lastMessage) {
        try {
          decryptedLastMessage = decrypt(JSON.parse(conv.lastMessage));
        } catch (error) {
          decryptedLastMessage = '[Message non déchiffrable]';
        }
      }

      return {
        id: conv.userId,
        username: conv.username,
        avatar: conv.avatar,
        isOnline: conv.isOnline,
        lastMessage: decryptedLastMessage,
        lastMessageTime: conv.lastMessageTime
      };
    });

    res.json({ conversations: processedConversations });
  } catch (error) {
    console.error('Erreur récupération conversations privées:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les messages privés avec un utilisateur spécifique
router.get('/private/:userId', authMiddleware, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Vérifier si l'utilisateur n'est pas bloqué
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: currentUserId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ message: 'Conversation bloquée' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const decryptedMessages = messages.map(msg => {
      try {
        return {
          ...msg,
          content: decrypt(JSON.parse(msg.content))
        };
      } catch (error) {
        console.error('Erreur déchiffrement message:', error);
        return {
          ...msg,
          content: '[Message non déchiffrable]'
        };
      }
    });

    res.json({ messages: decryptedMessages.reverse() });
  } catch (error) {
    console.error('Erreur récupération messages privés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un message (admin ou auteur)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            users: {
              where: { userId, isAdmin: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier les permissions
    const canDelete = message.senderId === userId || (message.room && message.room.users.length > 0);

    if (!canDelete) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    await prisma.message.delete({ where: { id: messageId } });

    res.json({ message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
