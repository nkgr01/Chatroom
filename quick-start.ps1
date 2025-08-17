# 🚀 Script de Démarrage Rapide - ConnectChat (PowerShell)
# Ce script vous guide à travers les étapes essentielles du déploiement

Write-Host "🎉 Bienvenue dans le déploiement de ConnectChat !" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

# Vérifier Git
Write-Host "🔍 Vérification de Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git est installé: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    Write-Host "📥 Téléchargez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Vérifier le statut du repository
Write-Host "📁 Vérification du repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "❌ Ce dossier n'est pas un repository Git." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repository Git détecté" -ForegroundColor Green
Write-Host ""

# Afficher le statut actuel
Write-Host "📊 Statut actuel du repository:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Demander l'action à effectuer
Write-Host "🚀 Que souhaitez-vous faire ?" -ForegroundColor Cyan
Write-Host "1. Pousser vers GitHub (première fois)" -ForegroundColor White
Write-Host "2. Mettre à jour et pousser" -ForegroundColor White
Write-Host "3. Voir la documentation de déploiement" -ForegroundColor White
Write-Host "4. Quitter" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choisissez une option (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Configuration du repository GitHub..." -ForegroundColor Yellow
        Write-Host "1. Allez sur https://github.com" -ForegroundColor White
        Write-Host "2. Créez un nouveau repository nommé 'connectchat'" -ForegroundColor White
        Write-Host "3. Ne pas initialiser avec README (déjà créé)" -ForegroundColor White
        Write-Host "4. Copiez l'URL du repository" -ForegroundColor White
        Write-Host ""
        
        $github_url = Read-Host "Entrez l'URL de votre repository GitHub"
        
        if ($github_url) {
            Write-Host "🔗 Ajout du remote GitHub..." -ForegroundColor Yellow
            git remote add origin $github_url
            git branch -M main
            
            Write-Host "⬆️ Push vers GitHub..." -ForegroundColor Yellow
            git push -u origin main
            
            Write-Host ""
            Write-Host "✅ Repository poussé vers GitHub avec succès !" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 Prochaines étapes:" -ForegroundColor Cyan
            Write-Host "1. Déployez le backend sur Render" -ForegroundColor White
            Write-Host "2. Déployez le frontend sur Vercel" -ForegroundColor White
            Write-Host "3. Configurez la base de données" -ForegroundColor White
            Write-Host ""
            Write-Host "📚 Consultez 'manual-deploy.md' pour les détails" -ForegroundColor Yellow
        } else {
            Write-Host "❌ URL non fournie. Opération annulée." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "📝 Mise à jour du repository..." -ForegroundColor Yellow
        git add .
        
        $commit_msg = Read-Host "Entrez un message de commit"
        if (-not $commit_msg) {
            $commit_msg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        
        git commit -m $commit_msg
        git push origin main
        
        Write-Host ""
        Write-Host "✅ Mise à jour poussée vers GitHub !" -ForegroundColor Green
        Write-Host "🔄 Render et Vercel redéploieront automatiquement" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host ""
        Write-Host "📚 Documentation de déploiement disponible:" -ForegroundColor Cyan
        Write-Host "- 'manual-deploy.md' - Guide étape par étape" -ForegroundColor White
        Write-Host "- 'deploy.md' - Vue d'ensemble" -ForegroundColor White
        Write-Host "- 'database-setup.md' - Configuration DB" -ForegroundColor White
        Write-Host "- 'DEPLOYMENT-SUMMARY.md' - Résumé complet" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 Liens utiles:" -ForegroundColor Cyan
        Write-Host "- Render: https://render.com" -ForegroundColor White
        Write-Host "- Vercel: https://vercel.com" -ForegroundColor White
        Write-Host "- PlanetScale: https://planetscale.com" -ForegroundColor White
    }
    
    "4" {
        Write-Host "👋 Au revoir ! Bon déploiement !" -ForegroundColor Green
        exit 0
    }
    
    default {
        Write-Host "❌ Option invalide. Veuillez choisir 1, 2, 3 ou 4." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Pour continuer le déploiement, consultez 'manual-deploy.md'" -ForegroundColor Yellow
Write-Host "🚀 Bonne chance avec votre application ConnectChat !" -ForegroundColor Green
