# 🚀 Guide de Déploiement - ConnectChat

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Render (gratuit)
- Base de données MySQL en ligne (PlanetScale, Railway, ou similaire)

## 🔄 Étape 1: Push sur GitHub

### 1.1 Créer un repository sur GitHub
- Allez sur [github.com](https://github.com)
- Cliquez sur "New repository"
- Nom: `connectchat`
- Description: "Application de chat en temps réel avec partage de fichiers"
- Public ou Private selon votre choix
- Ne pas initialiser avec README (déjà créé)

### 1.2 Connecter votre repository local
```bash
git remote add origin https://github.com/VOTRE_USERNAME/connectchat.git
git branch -M main
git push -u origin main
```

## 🌐 Étape 2: Déploiement du Backend sur Render

### 2.1 Créer un compte Render
- Allez sur [render.com](https://render.com)
- Créez un compte avec GitHub

### 2.2 Créer un nouveau Web Service
- Cliquez sur "New +" → "Web Service"
- Connectez votre repository GitHub
- Sélectionnez le repository `connectchat`

### 2.3 Configuration du service
- **Name**: `connectchat-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 2.4 Variables d'environnement
Ajoutez ces variables dans Render :

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://username:password@host:port/database
JWT_SECRET=votre_secret_jwt_tres_securise
FRONTEND_URL=https://votre-app.vercel.app
ENCRYPTION_KEY=votre_cle_de_chiffrement_32_caracteres
```

### 2.5 Déployer
- Cliquez sur "Create Web Service"
- Attendez que le déploiement se termine
- Notez l'URL du service (ex: `https://connectchat-backend.onrender.com`)

## 🎨 Étape 3: Déploiement du Frontend sur Vercel

### 3.1 Créer un compte Vercel
- Allez sur [vercel.com](https://vercel.com)
- Créez un compte avec GitHub

### 3.2 Importer le projet
- Cliquez sur "New Project"
- Importez votre repository GitHub `connectchat`
- Sélectionnez le dossier `frontend`

### 3.3 Configuration du projet
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Variables d'environnement
Ajoutez cette variable :

```env
VITE_API_URL=https://connectchat-backend.onrender.com/api
```

### 3.5 Déployer
- Cliquez sur "Deploy"
- Attendez que le déploiement se termine
- Votre app sera accessible sur `https://votre-app.vercel.app`

## 🗄️ Étape 4: Configuration de la Base de Données

### 4.1 PlanetScale (Recommandé)
- Allez sur [planetscale.com](https://planetscale.com)
- Créez un compte
- Créez un nouveau database
- Notez les informations de connexion

### 4.2 Mise à jour du schéma Prisma
```bash
cd backend
npx prisma db push
```

### 4.3 Variables d'environnement
Mettez à jour `DATABASE_URL` dans Render avec votre nouvelle base de données.

## 🔧 Étape 5: Configuration Finale

### 5.1 Mettre à jour CORS
Dans `backend/server.js`, assurez-vous que CORS pointe vers votre domaine Vercel :

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://votre-app.vercel.app',
  credentials: true
}));
```

### 5.2 Redéployer le backend
- Faites un commit et push sur GitHub
- Render redéploiera automatiquement

### 5.3 Tester l'application
- Testez la connexion
- Testez l'envoi de messages
- Testez le partage de fichiers

## 🚨 Dépannage

### Problème de CORS
- Vérifiez que `FRONTEND_URL` est correct dans Render
- Assurez-vous que le protocole est `https://`

### Problème de base de données
- Vérifiez `DATABASE_URL` dans Render
- Testez la connexion localement

### Problème de build
- Vérifiez les logs de build dans Vercel/Render
- Assurez-vous que toutes les dépendances sont installées

## 📱 URLs Finales

- **Frontend**: `https://votre-app.vercel.app`
- **Backend**: `https://connectchat-backend.onrender.com`
- **API**: `https://connectchat-backend.onrender.com/api`

## 🔄 Mises à jour

Pour mettre à jour l'application :
```bash
git add .
git commit -m "Update message"
git push origin main
```

Vercel et Render redéploieront automatiquement !
