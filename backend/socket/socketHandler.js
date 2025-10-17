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
      where: {
        userId: socket.user.id
      },
      include: {
        room: true
      }
    });

    // Filtrer les salles valides et rejoindre les salles
    const validUserRooms = userRooms.filter(roomUser => roomUser.room !== null);
    
    // Gérer les RoomUser orphelins (optionnel)
    const orphanedRoomUsers = userRooms.filter(roomUser => roomUser.room === null);
    if (orphanedRoomUsers.length > 0) {
      console.warn(`Trouvé ${orphanedRoomUsers.length} RoomUser orphelins pour l'utilisateur ${socket.user.username}`);
      // Optionnellement supprimer les RoomUser orphelins
      // await prisma.roomUser.deleteMany({
      //   where: {
      //     id: { in: orphanedRoomUsers.map(ru => ru.id) }
      //   }
      // });
    }

    validUserRooms.forEach(roomUser => {
      socket.join(`room_${roomUser.room.id}`);
      console.log(`Utilisateur ${socket.user.username} a rejoint la salle ${roomUser.room.id}`);
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
  socket.on("sendMessage", async ({ content, roomId, receiverId, isPrivate = false }) => {
    try {
      // Vérifier si l'utilisateur est connecté
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("messageError", "Non authentifié");
        return;
      }

      console.log('Tentative d\'envoi de message:', { content, receiverId, isPrivate });

      // Chiffrer le contenu du message
      const encrypted = encrypt(content);
      console.log('Message chiffré:', encrypted);

      // Créer le message avec des types d'ID corrects pour MongoDB
      const messageData = {
        content: encrypted.iv + ':' + encrypted.encrypted,
        senderId: userId,
        isPrivate,
        // Conversion des IDs en string pour MongoDB
        ...(isPrivate 
          ? { receiverId: receiverId.toString() } 
          : { roomId: roomId.toString() })
      };

      const message = await prisma.message.create({
        data: messageData,
        include: {
          sender: true,
          receiver: true,
          room: true
        }
      });

      // Déchiffrer le message pour l'envoi
      const decrypted = decrypt({
        iv: encrypted.iv,
        encrypted: encrypted.encrypted
      });

      const messageToSend = {
        ...message,
        content: decrypted
      };

      // Émettre le message aux destinataires appropriés
      if (isPrivate) {
        socket.emit('newMessage', messageToSend);
        socket.to(`user_${receiverId}`).emit('newMessage', messageToSend);
      } else {
        socket.to(`room_${roomId}`).emit('newMessage', messageToSend);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      socket.emit('messageError', 'Erreur lors de l\'envoi du message');
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
  }
};


module.exports = {
  authenticateSocket,
  handleConnection
};
