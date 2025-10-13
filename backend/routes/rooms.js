const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Créer une salle
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;
    const creatorId = req.user.id;

    // Vérifier si la salle existe déjà
    const existingRoom = await prisma.room.findUnique({ where: { name } });
    if (existingRoom) {
      return res.status(400).json({ message: 'Une salle avec ce nom existe déjà' });
    }

    // Créer la salle
    const room = await prisma.room.create({
      data: {
        name,
        description,
        type,
        creatorId
      }
    });

    // Ajouter le créateur comme admin de la salle
    await prisma.roomUser.create({
      data: {
        userId: creatorId,
        roomId: room.id,
        role: 'admin'
      }
    });

    res.status(201).json({ message: 'Salle créée avec succès', room });
  } catch (error) {
    console.error('Erreur création salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir toutes les salles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        users: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true, isOnline: true }
            }
          }
        },
        _count: { select: { users: true } }
      }
    });

    const roomsWithStats = rooms.map(room => ({
      ...room,
      userCount: room._count.users,
      onlineUsers: room.users.filter(ru => ru.user.isOnline).length
    }));

    res.json({ rooms: roomsWithStats });
  } catch (error) {
    console.error('Erreur récupération salles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les détails d'une salle
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        users: {
          include: {
            user: { select: { id: true, username: true, avatar: true, isOnline: true } }
          }
        },
        messages: {
          include: {
            sender: { select: { id: true, username: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Erreur récupération salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Rejoindre une salle
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    console.log(`Tentative de jointure: utilisateur ${userId} à la salle ${roomId}`);

    // Vérifier si l'utilisateur est déjà dans la salle
    const existingMember = await prisma.roomUser.findFirst({ where: { userId, roomId } });
    if (existingMember) {
      console.log(`Utilisateur ${userId} déjà membre de la salle ${roomId}`);
      return res.status(400).json({ message: 'Vous êtes déjà dans cette salle' });
    }

    // Vérifier si la salle existe
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      console.log(`Salle ${roomId} non trouvée`);
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    // Ajouter l'utilisateur à la salle
    await prisma.roomUser.create({
      data: { userId, roomId, role: 'member' }
    });

    console.log(`Utilisateur ${userId} a rejoint la salle ${roomId} avec succès`);
    res.json({ message: 'Vous avez rejoint la salle avec succès' });
  } catch (error) {
    console.error('Erreur rejoindre salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Quitter une salle
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    await prisma.roomUser.deleteMany({ where: { userId, roomId } });

    res.json({ message: 'Vous avez quitté la salle' });
  } catch (error) {
    console.error('Erreur quitter salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route temporaire pour ajouter l'utilisateur à une salle (pour corriger le problème)
router.post('/:id/fix-membership', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    // Vérifier si l'utilisateur est déjà dans la salle
    const existingMember = await prisma.roomUser.findFirst({ where: { userId, roomId } });
    if (existingMember) {
      return res.status(400).json({ message: 'Vous êtes déjà dans cette salle' });
    }

    // Vérifier si l'utilisateur est le créateur de la salle
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    const role = room.creatorId === userId ? 'admin' : 'member';

    // Ajouter l'utilisateur à la salle
    await prisma.roomUser.create({
      data: { userId, roomId, role }
    });

    res.json({ message: 'Vous avez été ajouté à la salle avec succès', role });
  } catch (error) {
    console.error('Erreur ajout à la salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier l'appartenance à une salle
router.get('/:id/check-membership', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    const membership = await prisma.roomUser.findFirst({
      where: { userId, roomId },
      include: {
        room: {
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (membership) {
      res.json({ 
        isMember: true, 
        role: membership.role,
        room: membership.room
      });
    } else {
      res.json({ 
        isMember: false,
        room: await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        })
      });
    }
  } catch (error) {
    console.error('Erreur vérification appartenance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une salle (admin uniquement)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    // Vérifier si l'utilisateur est admin de la salle
    const userRole = await prisma.roomUser.findFirst({
      where: { userId, roomId, role: 'admin' }
    });

    if (!userRole) {
      return res.status(403).json({ message: 'Vous n\'avez pas les permissions pour supprimer cette salle' });
    }

    // Supprimer la salle (cascade supprimera les messages et membres)
    await prisma.room.delete({ where: { id: roomId } });

    res.json({ message: 'Salle supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression salle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
