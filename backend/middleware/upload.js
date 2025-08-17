const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nom de fichier sécurisé avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtres pour les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/avi',
    'video/mov',
    'video/mkv',
    'video/flv',
    'video/wmv',
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ];

  // Vérifier le type MIME
  if (!allowedMimes.includes(file.mimetype)) {
    console.warn(`🚫 Type de fichier non autorisé: ${file.mimetype} (${file.originalname})`);
    return cb(new Error('Type de fichier non autorisé'), false);
  }

  // Vérifier l'extension du fichier
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    '.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv',
    '.mp3', '.wav', '.flac', '.aac', '.ogg',
    '.pdf', '.doc', '.docx', '.txt', '.rtf'
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    console.warn(`🚫 Extension de fichier non autorisée: ${fileExtension} (${file.originalname})`);
    return cb(new Error('Extension de fichier non autorisée'), false);
  }

  // Vérifier le nom du fichier pour les caractères dangereux
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(file.originalname)) {
    console.warn(`🚫 Nom de fichier dangereux: ${file.originalname}`);
    return cb(new Error('Nom de fichier non autorisé'), false);
  }

  console.log(`✅ Fichier validé: ${file.originalname} (${file.mimetype})`);
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

module.exports = upload;
