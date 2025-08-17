#!/bin/bash

# Script de déploiement automatique pour ConnectChat
# Usage: ./deploy.sh [commit_message]

echo "🚀 Déploiement de ConnectChat..."

# Vérifier si un message de commit est fourni
if [ -z "$1" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo "📝 Message de commit: $COMMIT_MSG"

# Vérifier le statut Git
echo "🔍 Vérification du statut Git..."
git status

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers..."
git add .

# Créer le commit
echo "💾 Création du commit..."
git commit -m "$COMMIT_MSG"

# Pousser vers GitHub
echo "⬆️ Push vers GitHub..."
git push origin main

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifiez que le code est bien sur GitHub"
echo "2. Render redéploiera automatiquement le backend"
echo "3. Vercel redéploiera automatiquement le frontend"
echo ""
echo "🌐 URLs:"
echo "- GitHub: https://github.com/VOTRE_USERNAME/connectchat"
echo "- Backend: https://connectchat-backend.onrender.com"
echo "- Frontend: https://votre-app.vercel.app"
