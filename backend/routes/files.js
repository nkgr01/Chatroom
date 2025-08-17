const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();
const prisma = new PrismaClient();

// Upload de fichier (avec chiffrement)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { roomId, receiverId, isPrivate } = req.body;
    const senderId = req.user.id;

    console.log('📁 Upload de fichier:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      roomId,
      receiverId,
      senderId
    });

    // Déterminer le type de fichier
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) fileType = 'image';
    else if (['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'].includes(ext)) fileType = 'video';
    else if (['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(ext)) fileType = 'audio';
    else if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) fileType = 'document';

    // Lire le fichier uploadé
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    console.log('🔐 Chiffrement du fichier...');
    
    // Chiffrer le contenu du fichier
    const fileBase64 = fileBuffer.toString('base64');
    const encrypted = encrypt(fileBase64);

    console.log('💾 Sauvegarde du fichier chiffré...');

    // Sauvegarder le fichier chiffré (on écrase l'original)
    fs.writeFileSync(filePath, JSON.stringify(encrypted));

    console.log('💾 Enregistrement en base de données...');
    
    // Enregistrer le fichier en base
    const sharedFile = await prisma.sharedFile.create({
      data: {
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        filePath: req.file.filename,
        fileType,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        roomId: roomId ? parseInt(roomId) : null,
        receiverId: receiverId ? parseInt(receiverId) : null,
        senderId
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      }
    });

    console.log('✅ Fichier uploadé avec succès:', {
      id: sharedFile.id,
      fileName: sharedFile.fileName,
      fileType: sharedFile.fileType,
      size: sharedFile.fileSize
    });

    res.status(201).json({ 
      message: 'Fichier uploadé avec succès', 
      file: sharedFile 
    });
  } catch (error) {
    console.error('❌ Erreur upload fichier:', error);
    
    // Nettoyer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Fichier temporaire supprimé après erreur');
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      message: 'Erreur lors de l\'upload du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtenir les fichiers d'une salle
router.get('/room/:roomId', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);

    // Vérifier l'accès à la salle
    const membership = await prisma.roomUser.findFirst({ where: { userId: req.user.id, roomId } });
    if (!membership) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const files = await prisma.sharedFile.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ files });
  } catch (error) {
    console.error('Erreur récupération fichiers:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les fichiers privés entre deux utilisateurs
router.get('/private/:userId', authMiddleware, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;

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
      return res.status(403).json({ message: 'Vous ne pouvez pas accéder à cette conversation' });
    }

    // Récupérer les fichiers privés entre les deux utilisateurs
    const files = await prisma.sharedFile.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ],
        roomId: null // Seulement les fichiers privés
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ files });
  } catch (error) {
    console.error('Erreur récupération fichiers privés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Servir les fichiers uploadés (avec déchiffrement)
router.get('/serve/:filename', authMiddleware, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    // Récupérer les informations du fichier depuis la base de données
    const fileInfo = await prisma.sharedFile.findFirst({
      where: { filePath: filename },
      include: { sender: true }
    });

    if (!fileInfo) {
      return res.status(404).json({ message: 'Fichier non trouvé en base' });
    }

    // Vérifier les permissions d'accès
    const currentUserId = req.user.id;
    
    // Si c'est un fichier de salle, vérifier l'appartenance
    if (fileInfo.roomId) {
      const membership = await prisma.roomUser.findFirst({
        where: { userId: currentUserId, roomId: fileInfo.roomId }
      });
      if (!membership) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }
    
    // Si c'est un fichier privé, vérifier que l'utilisateur est le destinataire ou l'expéditeur
    if (fileInfo.receiverId) {
      if (fileInfo.senderId !== currentUserId && fileInfo.receiverId !== currentUserId) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    console.log('🔓 Déchiffrement du fichier:', filename);
    
    // Lire et déchiffrer le fichier
    const encryptedData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const decryptedBase64 = decrypt(encryptedData);
    const fileBuffer = Buffer.from(decryptedBase64, 'base64');

    console.log('✅ Fichier déchiffré avec succès:', {
      originalName: fileInfo.originalName,
      size: fileBuffer.length,
      mimeType: fileInfo.mimeType
    });

    // Définir les en-têtes appropriés
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    // Envoyer le fichier déchiffré
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Erreur service fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors du service du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route de test pour vérifier le chiffrement (à supprimer en production)
router.get('/test-encryption', authMiddleware, (req, res) => {
  try {
    const testData = "Test de chiffrement des fichiers";
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    res.json({
      original: testData,
      encrypted: encrypted,
      decrypted: decrypted,
      success: testData === decrypted
    });
  } catch (error) {
    console.error('Erreur test chiffrement:', error);
    res.status(500).json({ message: 'Erreur test chiffrement' });
  }
});

module.exports = router;
