const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../utils/encryption');
const { extractLinks, getLinkPreview } = require('../utils/linkPreview');

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

    // Mettre à jour le statut en ligne avec retries en cas de conflit
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.user.update({
          where: { 
            id: socket.user.id,
            // Optimistic locking pour éviter les conflits
            isOnline: false 
          },
          data: { 
            isOnline: true,
            lastSeen: new Date()
          }
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Impossible de mettre à jour le statut en ligne:', error);
          socket.emit('error', { message: 'Erreur de connexion' });
        }
        // Petit délai avant retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Rejoindre les salles de l'utilisateur
    try {
      // 1. D'abord, récupérer les salles valides directement
      const userRooms = await prisma.room.findMany({
        where: {
          users: {
            some: {
              userId: socket.user.id
            }
          }
        },
        include: {
          users: {
            where: {
              userId: socket.user.id
            },
            select: {
              role: true
            }
          }
        }
      });
      
      // Log pour le debugging
      console.log(`Trouvé ${userRooms.length} salles valides pour ${socket.user.username}`);

      // 2. Nettoyer les RoomUser orphelins
      await prisma.roomUser.deleteMany({
        where: {
          userId: socket.user.id,
          roomId: null
        }
      });

      // 3. Rejoindre les salles valides
      userRooms.forEach(room => {
        socket.join(`room_${room.id}`);
        console.log(`Utilisateur ${socket.user.username} a rejoint la salle ${room.id}`);
      });

    } catch (error) {
      console.error('Erreur lors de la connexion aux salles:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion aux salles' });
    }

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
  socket.on("sendMessage", async ({ content, roomId, receiverId, isPrivate = false, sharedFile = null }) => {
    try {
      // Vérifier si l'utilisateur est connecté
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("messageError", "Non authentifié");
        return;
      }

      console.log('Tentative d\'envoi de message:', { content, receiverId, isPrivate, hasFile: !!sharedFile });

      // Extraire les liens du message
      const links = extractLinks(content);
      let linkPreviews = null;
      
      if (links.length > 0) {
        console.log('Liens détectés:', links);
        // Générer les previews pour les liens (limité aux 3 premiers)
        const previewPromises = links.slice(0, 3).map(link => getLinkPreview(link));
        linkPreviews = await Promise.all(previewPromises);
        console.log('Previews générées:', linkPreviews.length);
      }

      // Chiffrer le contenu du message si ce n'est pas déjà un JSON chiffré
      let messageContent;
      try {
        const encrypted = encrypt(content);
        messageContent = JSON.stringify(encrypted);
      } catch (error) {
        console.error('Erreur de chiffrement, utilisation du texte brut:', error);
        messageContent = content;
      }

      // Créer le message avec des types d'ID corrects pour MongoDB
      const messageData = {
        content: messageContent,
        senderId: userId.toString(), // Conversion explicite en string pour MongoDB
        isPrivate,
        ...(linkPreviews ? { linkPreviews: JSON.parse(JSON.stringify(linkPreviews)) } : {}),
        ...(isPrivate 
          ? { receiverId: receiverId.toString() } // Conversion explicite
          : { roomId: roomId.toString() }) // Conversion explicite
      };

      const message = await prisma.message.create({
        data: messageData,
        include: {
          sender: {
            select: { id: true, username: true, avatar: true }
          },
          receiver: receiverId ? {
            select: { id: true, username: true, avatar: true }
          } : undefined,
          room: true
        }
      });

      // Déchiffrer le message pour l'envoi
      const decrypted = decrypt(JSON.parse(message.content));

      const messageToSend = {
        ...message,
        content: decrypted,
        sharedFile: sharedFile,
        linkPreviews: message.linkPreviews ? JSON.parse(message.linkPreviews) : null
      };

      // Émettre le message aux destinataires appropriés
      if (isPrivate) {
        socket.emit('newMessage', messageToSend);
        socket.to(`user_${receiverId}`).emit('newMessage', messageToSend);
      } else {
        io.to(`room_${roomId}`).emit('newMessage', messageToSend);
        socket.emit('newMessage', messageToSend);
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
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.user.update({
          where: { 
            id: socket.user.id,
            // Optimistic locking pour éviter les conflits
            isOnline: true 
          },
          data: { 
            isOnline: false,
            lastSeen: new Date()
          }
        });
        socket.broadcast.emit('userOffline', {
          userId: socket.user.id,
          username: socket.user.username
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Impossible de mettre à jour le statut hors ligne:', error);
        }
        // Petit délai avant retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  });
  }
};


module.exports = {
  authenticateSocket,
  handleConnection
};
