# 🚀 Déploiement Manuel de ConnectChat

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Render (gratuit)
- Base de données MySQL en ligne

## 🔄 Étape 1: Push sur GitHub

### 1.1 Créer un repository sur GitHub
1. Allez sur [github.com](https://github.com)
2. Cliquez sur "New repository"
3. Nom: `connectchat`
4. Description: "Application de chat en temps réel avec partage de fichiers"
5. Public ou Private selon votre choix
6. **Ne pas** initialiser avec README (déjà créé)
7. Cliquez sur "Create repository"

### 1.2 Connecter votre repository local
```bash
# Remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/connectchat.git
git branch -M main
git push -u origin main
```

## 🌐 Étape 2: Déploiement du Backend sur Render

### 2.1 Créer un compte Render
1. Allez sur [render.com](https://render.com)
2. Cliquez sur "Get Started"
3. Créez un compte avec GitHub
4. Vérifiez votre email

### 2.2 Créer un nouveau Web Service
1. Dans le dashboard Render, cliquez sur "New +"
2. Sélectionnez "Web Service"
3. Cliquez sur "Connect" à côté de GitHub
4. Autorisez Render à accéder à vos repositories
5. Sélectionnez le repository `connectchat`

### 2.3 Configuration du service
- **Name**: `connectchat-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 2.4 Variables d'environnement
Cliquez sur "Environment" et ajoutez ces variables :

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=votre_secret_jwt_tres_securise_et_long_au_moins_32_caracteres
ENCRYPTION_KEY=votre_cle_de_chiffrement_32_caracteres_exactement
FRONTEND_URL=https://votre-app.vercel.app
```

**Note**: Pour `DATABASE_URL`, attendez d'avoir créé votre base de données.

### 2.5 Déployer
1. Cliquez sur "Create Web Service"
2. Attendez que le déploiement se termine (5-10 minutes)
3. Notez l'URL du service (ex: `https://connectchat-backend.onrender.com`)

## 🎨 Étape 3: Déploiement du Frontend sur Vercel

### 3.1 Créer un compte Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Continue with GitHub"
3. Autorisez Vercel à accéder à vos repositories

### 3.2 Importer le projet
1. Cliquez sur "New Project"
2. Dans la liste des repositories, trouvez `connectchat`
3. Cliquez sur "Import"
4. Sélectionnez le dossier `frontend` comme "Root Directory"

### 3.3 Configuration du projet
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Variables d'environnement
Cliquez sur "Environment Variables" et ajoutez :

```env
VITE_API_URL=https://connectchat-backend.onrender.com/api
```

### 3.5 Déployer
1. Cliquez sur "Deploy"
2. Attendez que le déploiement se termine (2-3 minutes)
3. Votre app sera accessible sur `https://votre-app.vercel.app`

## 🗄️ Étape 4: Configuration de la Base de Données

### 4.1 PlanetScale (Recommandé)
1. Allez sur [planetscale.com](https://planetscale.com)
2. Créez un compte avec GitHub
3. Vérifiez votre email

### 4.2 Créer une base de données
1. Cliquez sur "New database"
2. Nom: `connectchat`
3. Region: Choisissez la plus proche de vos utilisateurs
4. Plan: `Hobby` (gratuit)
5. Cliquez sur "Create database"

### 4.3 Obtenir les informations de connexion
1. Cliquez sur votre base de données
2. Allez dans l'onglet "Connect"
3. Sélectionnez "Prisma"
4. Copiez l'URL de connexion

### 4.4 Mettre à jour Render
1. Retournez sur Render
2. Allez dans votre service `connectchat-backend`
3. Cliquez sur "Environment"
4. Ajoutez/modifiez `DATABASE_URL` avec l'URL de PlanetScale
5. Cliquez sur "Save Changes"
6. Render redéploiera automatiquement

### 4.5 Initialiser la base de données
```bash
# Localement ou sur Render
cd backend
npx prisma db push --schema=prisma/schema.production.prisma
```

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
1. Faites un commit et push sur GitHub
2. Render redéploiera automatiquement

### 5.3 Tester l'application
1. Testez la connexion sur votre app Vercel
2. Testez l'envoi de messages
3. Testez le partage de fichiers

## 🚨 Dépannage

### Problème de CORS
- Vérifiez que `FRONTEND_URL` est correct dans Render
- Assurez-vous que le protocole est `https://`
- Vérifiez que l'URL correspond exactement à votre domaine Vercel

### Problème de base de données
- Vérifiez `DATABASE_URL` dans Render
- Testez la connexion localement
- Vérifiez que la base de données est accessible depuis l'extérieur

### Problème de build
- Vérifiez les logs de build dans Vercel/Render
- Assurez-vous que toutes les dépendances sont installées
- Vérifiez que Node.js 18+ est utilisé

## 📱 URLs Finales

- **Frontend**: `https://votre-app.vercel.app`
- **Backend**: `https://connectchat-backend.onrender.com`
- **API**: `https://connectchat-backend.onrender.com/api`
- **GitHub**: `https://github.com/VOTRE_USERNAME/connectchat`

## 🔄 Mises à jour

Pour mettre à jour l'application :
```bash
git add .
git commit -m "Update message"
git push origin main
```

Vercel et Render redéploieront automatiquement !

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Render et Vercel
2. Consultez la documentation de chaque plateforme
3. Vérifiez que toutes les variables d'environnement sont correctes
4. Testez localement avant de déployer
