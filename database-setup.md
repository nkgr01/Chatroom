# 🗄️ Configuration de la Base de Données de Production

## 📋 Options Recommandées

### 1. PlanetScale (Recommandé - Gratuit)
- **Avantages**: MySQL compatible, migrations automatiques, interface web
- **Limite gratuite**: 1 base de données, 1 milliard de requêtes/mois
- **URL**: [planetscale.com](https://planetscale.com)

### 2. Railway
- **Avantages**: Déploiement simple, MySQL et PostgreSQL
- **Limite gratuite**: $5 de crédit/mois
- **URL**: [railway.app](https://railway.app)

### 3. Supabase
- **Avantages**: PostgreSQL avec interface moderne
- **Limite gratuite**: 500MB, 50,000 requêtes/mois
- **URL**: [supabase.com](https://supabase.com)

## 🚀 Configuration avec PlanetScale

### Étape 1: Créer un compte
1. Allez sur [planetscale.com](https://planetscale.com)
2. Créez un compte avec GitHub
3. Vérifiez votre email

### Étape 2: Créer une base de données
1. Cliquez sur "New database"
2. Nom: `connectchat`
3. Region: Choisissez la plus proche de vos utilisateurs
4. Plan: `Hobby` (gratuit)

### Étape 3: Obtenir les informations de connexion
1. Cliquez sur votre base de données
2. Allez dans l'onglet "Connect"
3. Sélectionnez "Prisma"
4. Copiez l'URL de connexion

### Étape 4: Tester la connexion
```bash
cd backend
npx prisma db push --schema=prisma/schema.production.prisma
```

## 🔧 Variables d'Environnement

### Dans Render (Backend)
```env
DATABASE_URL="mysql://username:password@host:port/database"
NODE_ENV=production
JWT_SECRET=votre_secret_jwt_tres_securise
ENCRYPTION_KEY=votre_cle_de_chiffrement_32_caracteres
FRONTEND_URL=https://votre-app.vercel.app
```

### Dans Vercel (Frontend)
```env
VITE_API_URL=https://connectchat-backend.onrender.com/api
```

## 📊 Structure de la Base de Données

### Tables principales
- `users` - Utilisateurs de l'application
- `rooms` - Salles de chat
- `room_users` - Relation utilisateurs-salles
- `messages` - Messages (privés et de groupe)
- `shared_files` - Fichiers partagés
- `message_reactions` - Réactions aux messages

### Relations
- Un utilisateur peut être dans plusieurs salles
- Un message peut avoir un fichier attaché
- Un message peut avoir plusieurs réactions
- Un fichier peut être partagé dans une salle ou en privé

## 🔒 Sécurité

### Chiffrement
- Les mots de passe sont hashés avec bcrypt
- Les fichiers sont chiffrés avant stockage
- JWT pour l'authentification

### Permissions
- Vérification des rôles pour les actions sensibles
- Validation des entrées utilisateur
- Protection contre les injections SQL (Prisma)

## 📈 Monitoring

### Métriques à surveiller
- Nombre de connexions simultanées
- Temps de réponse des requêtes
- Utilisation de l'espace disque
- Nombre de requêtes par minute

### Logs
- Erreurs d'authentification
- Tentatives d'accès non autorisées
- Performance des requêtes

## 🚨 Dépannage

### Problème de connexion
```bash
# Tester la connexion
npx prisma db pull --schema=prisma/schema.production.prisma

# Vérifier le schéma
npx prisma validate --schema=prisma/schema.production.prisma
```

### Problème de migration
```bash
# Réinitialiser la base
npx prisma migrate reset --schema=prisma/schema.production.prisma

# Appliquer les migrations
npx prisma migrate deploy --schema=prisma/schema.production.prisma
```

### Problème de performance
- Vérifiez les index sur les colonnes fréquemment utilisées
- Optimisez les requêtes complexes
- Surveillez l'utilisation des ressources

## 🔄 Mises à jour

### Schéma de base de données
```bash
# Modifier le schéma
nano prisma/schema.production.prisma

# Appliquer les changements
npx prisma db push --schema=prisma/schema.production.prisma

# Générer le client Prisma
npx prisma generate
```

### Redéploiement
Après modification du schéma :
1. Committez les changements
2. Poussez vers GitHub
3. Render redéploiera automatiquement
4. Vérifiez que la base de données est à jour
