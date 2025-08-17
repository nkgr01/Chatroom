# ConnectChat - Plateforme de Chat en Temps Réel

Une application de chat moderne et sécurisée avec support des conversations privées et de groupe, partage de fichiers, et notifications en temps réel.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Chat en temps réel** avec Socket.IO
- **Conversations privées** entre utilisateurs
- **Salles de groupe** avec système de rôles
- **Partage de fichiers** (images, vidéos, audio, documents)
- **Prévisualisation des médias** avant envoi
- **Recherche globale** dans les messages, utilisateurs et salles
- **Notifications en temps réel**
- **Interface responsive** inspirée de WhatsApp/Telegram
- **PWA** avec support hors ligne

## 🛠️ Technologies

### Frontend
- React 18 + Vite
- Socket.IO Client
- Axios pour les API
- CSS moderne avec variables CSS

### Backend
- Node.js + Express
- Socket.IO pour le temps réel
- Prisma ORM avec MySQL
- JWT pour l'authentification
- Multer pour les uploads de fichiers
- Chiffrement des fichiers

## 📁 Structure du Projet

```
connectChat/
├── frontend/          # Application React
├── backend/           # Serveur Node.js
├── prisma/           # Schéma de base de données
└── docs/             # Documentation
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Déploiement

### Frontend (Vercel)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_URL`

### Backend (Render)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, etc.

## 🔧 Configuration

Créez un fichier `.env` dans le dossier backend :

```env
DATABASE_URL="mysql://user:password@localhost:3306/connectchat"
JWT_SECRET="votre_secret_jwt"
PORT=5001
```

## 📱 PWA

L'application est configurée comme une PWA avec :
- Service Worker pour le cache
- Manifest pour l'installation
- Support hors ligne

## 🔒 Sécurité

- Authentification JWT
- Validation des entrées
- Chiffrement des fichiers
- Protection CSRF
- Rate limiting (optionnel)

## 📄 Licence

MIT License
