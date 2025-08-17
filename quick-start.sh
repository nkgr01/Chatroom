#!/bin/bash

# 🚀 Script de Démarrage Rapide - ConnectChat
# Ce script vous guide à travers les étapes essentielles du déploiement

echo "🎉 Bienvenue dans le déploiement de ConnectChat !"
echo "=================================================="
echo ""

# Vérifier Git
echo "🔍 Vérification de Git..."
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Git est installé"
echo ""

# Vérifier le statut du repository
echo "📁 Vérification du repository..."
if [ ! -d ".git" ]; then
    echo "❌ Ce dossier n'est pas un repository Git."
    exit 1
fi

echo "✅ Repository Git détecté"
echo ""

# Afficher le statut actuel
echo "📊 Statut actuel du repository:"
git status --short
echo ""

# Demander l'action à effectuer
echo "🚀 Que souhaitez-vous faire ?"
echo "1. Pousser vers GitHub (première fois)"
echo "2. Mettre à jour et pousser"
echo "3. Voir la documentation de déploiement"
echo "4. Quitter"
echo ""

read -p "Choisissez une option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Configuration du repository GitHub..."
        echo "1. Allez sur https://github.com"
        echo "2. Créez un nouveau repository nommé 'connectchat'"
        echo "3. Ne pas initialiser avec README (déjà créé)"
        echo "4. Copiez l'URL du repository"
        echo ""
        
        read -p "Entrez l'URL de votre repository GitHub: " github_url
        
        if [ -n "$github_url" ]; then
            echo "🔗 Ajout du remote GitHub..."
            git remote add origin "$github_url"
            git branch -M main
            
            echo "⬆️ Push vers GitHub..."
            git push -u origin main
            
            echo ""
            echo "✅ Repository poussé vers GitHub avec succès !"
            echo ""
            echo "🌐 Prochaines étapes:"
            echo "1. Déployez le backend sur Render"
            echo "2. Déployez le frontend sur Vercel"
            echo "3. Configurez la base de données"
            echo ""
            echo "📚 Consultez 'manual-deploy.md' pour les détails"
        else
            echo "❌ URL non fournie. Opération annulée."
        fi
        ;;
        
    2)
        echo ""
        echo "📝 Mise à jour du repository..."
        git add .
        
        read -p "Entrez un message de commit: " commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        git commit -m "$commit_msg"
        git push origin main
        
        echo ""
        echo "✅ Mise à jour poussée vers GitHub !"
        echo "🔄 Render et Vercel redéploieront automatiquement"
        ;;
        
    3)
        echo ""
        echo "📚 Documentation de déploiement disponible:"
        echo "- 'manual-deploy.md' - Guide étape par étape"
        echo "- 'deploy.md' - Vue d'ensemble"
        echo "- 'database-setup.md' - Configuration DB"
        echo "- 'DEPLOYMENT-SUMMARY.md' - Résumé complet"
        echo ""
        echo "🌐 Liens utiles:"
        echo "- Render: https://render.com"
        echo "- Vercel: https://vercel.com"
        echo "- PlanetScale: https://planetscale.com"
        ;;
        
    4)
        echo "👋 Au revoir ! Bon déploiement !"
        exit 0
        ;;
        
    *)
        echo "❌ Option invalide. Veuillez choisir 1, 2, 3 ou 4."
        ;;
esac

echo ""
echo "🎯 Pour continuer le déploiement, consultez 'manual-deploy.md'"
echo "🚀 Bonne chance avec votre application ConnectChat !"
