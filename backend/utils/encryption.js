const crypto = require('crypto');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default_secret_key_for_development';
const ALGORITHM = 'aes-256-cbc';

// Fonction pour chiffrer les messages
const encrypt = (text) => {
  try {
    const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encrypted: encrypted
    };
  } catch (error) {
    console.error('Erreur de chiffrement:', error);
    throw new Error('Erreur lors du chiffrement');
  }
};

// Fonction pour déchiffrer les messages
const decrypt = (encryptedData) => {
  try {
    const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    throw new Error('Erreur lors du déchiffrement');
  }
};

module.exports = { encrypt, decrypt };
