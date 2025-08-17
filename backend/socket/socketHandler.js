const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../utils/encryption');

const prisma = new PrismaClient();

// Middleware d'authentification Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token manquant'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, avatar: true, isOnline: true }
    });

    if (!user) return next(new Error('Utilisateur non trouvé'));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Token invalide'));
  }
};

// Gestionnaire principal des sockets
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`Utilisateur connecté: ${socket.user.username}`);

    // Mettre à jour le statut en ligne
    await prisma.user.update({
      where: { id: socket.user.id },
      data: { isOnline: true }
    });

    // Rejoindre les salles de l'utilisateur
    const userRooms = await prisma.roomUser.findMany({
      where: { userId: socket.user.id },
      include: { room: true }
    });

    userRooms.forEach(roomUser => {
      socket.join(`room_${roomUser.room.id}`);
    });

    // Notifier les autres utilisateurs
    socket.broadcast.emit('userOnline', {
      userId: socket.user.id,
      username: socket.user.username,
      avatar: socket.user.avatar
    });

    // Gérer les messages de salle
    socket.on('joinRoom', async (roomId) => {
      try {
        const membership = await prisma.roomUser.findFirst({ where: { userId: socket.user.id, roomId } });
        if (membership) {
          socket.join(`room_${roomId}`);
          socket.emit('joinedRoom', roomId);
          socket.to(`room_${roomId}`).emit('userJoinedRoom', {
            userId: socket.user.id,
            username: socket.user.username,
            avatar: socket.user.avatar,
            roomId
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la connexion à la salle' });
      }
    });

    // Gérer l'envoi de messages
    socket.on('sendMessage', async (data) => {
      try {
        console.log('Tentative d\'envoi de message:', data);
        const { content, roomId, receiverId, isPrivate = false } = data;
        const encrypted = encrypt(content);
        console.log('Message chiffré:', encrypted);

        const message = await prisma.message.create({
          data: {
            content: JSON.stringify(encrypted),
            isPrivate,
            senderId: socket.user.id,
            roomId: roomId || null,
            receiverId: receiverId || null
          },
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
            receiver: receiverId ? { select: { id: true, username: true, avatar: true } } : undefined
          }
        });

        console.log('Message enregistré en base:', message.id);

        const responseMessage = {
          ...message,
          content: (() => {
          try {
            return decrypt(JSON.parse(message.content));
          } catch (error) {
            console.error('Erreur déchiffrement message socket:', error);
            return '[Message non déchiffrable]';
          }
        })()
        };

        console.log('Message déchiffré pour envoi:', responseMessage.content);

        if (roomId) {
          console.log('Envoi du message à la salle:', roomId);
          io.to(`room_${roomId}`).emit('newMessage', responseMessage);
        } else if (receiverId) {
          const receiverSockets = await io.fetchSockets();
          const receiverSocket = receiverSockets.find(s => s.user.id === receiverId);
          if (receiverSocket) receiverSocket.emit('newPrivateMessage', responseMessage);
          socket.emit('newPrivateMessage', responseMessage);
        }

        // Émettre un événement pour les notifications
        const notificationData = {
          ...responseMessage,
          room: roomId ? await prisma.room.findUnique({ where: { id: roomId } }) : null
        };
        
        if (roomId) {
          socket.to(`room_${roomId}`).emit('notification', {
            type: 'newMessage',
            data: notificationData
          });
        } else if (receiverId) {
          socket.to(`user_${receiverId}`).emit('notification', {
            type: 'newPrivateMessage',
            data: notificationData
          });
        }
      } catch (error) {
        console.error('Erreur envoi message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Gérer la frappe en cours
    socket.on('typing', (data) => {
      const { roomId, receiverId } = data;
      if (roomId) {
        socket.to(`room_${roomId}`).emit('userTyping', {
          userId: socket.user.id,
          username: socket.user.username,
          roomId
        });
      } else if (receiverId) {
        socket.to(`user_${receiverId}`).emit('userTyping', {
          userId: socket.user.id,
          username: socket.user.username
        });
      }
    });

    // Gérer l'arrêt de frappe
    socket.on('stopTyping', (data) => {
      const { roomId, receiverId } = data;
      if (roomId) {
        socket.to(`room_${roomId}`).emit('userStoppedTyping', {
          userId: socket.user.id,
          roomId
        });
      } else if (receiverId) {
        socket.to(`user_${receiverId}`).emit('userStoppedTyping', {
          userId: socket.user.id
        });
      }
    });

    // Gérer les conversations privées
    socket.on('joinPrivateChat', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Gérer la déconnexion
    socket.on('disconnect', async () => {
      console.log(`Utilisateur déconnecté: ${socket.user.username}`);
      await prisma.user.update({
        where: { id: socket.user.id },
        data: { isOnline: false }
      });
      socket.broadcast.emit('userOffline', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
  };
};

module.exports = {
  authenticateSocket,
  handleConnection
};
