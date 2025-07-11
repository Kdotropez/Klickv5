Set-Location -Path C:\Users\lefev\Projets\planning-app
# Nettoyer le cache de Vite
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
# Supprimer node_modules et package-lock.json pour éviter les problèmes de cache
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
# Réinstaller les dépendances
npm install
# Ajouter le fichier modifié à Git
git add src/components/planning/TimeSlotConfig.jsx
# Commettre les modifications
git commit -m "Fix validate button and ensure default values in TimeSlotConfig"
# Nettoyer le cache du navigateur (optionnel, manuel)
Write-Host "Veuillez vider le cache de votre navigateur (Ctrl+Shift+Suppr) et sélectionner 'Images et fichiers en cache'."
# Lancer le serveur de développement
npm run dev