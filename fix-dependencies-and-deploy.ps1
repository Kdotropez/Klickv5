Set-Location -Path C:\Users\lefev\Projets\planning-app
# Supprimer les dépendances existantes et le cache
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
# Mettre à jour package.json
Set-Content -Path package.json -Value @"
{
  "name": "planning-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "date-fns": "^3.6.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-icons": "^5.2.1",
    "react-datepicker": "^7.5.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.9",
    "vite": "^5.4.1"
  }
}
"@
# Réinstaller les dépendances
npm install
# Vérifier le build en local
npm run build
# Ajouter les modifications à Git
git add .
git commit -m "Fix dependency conflict by downgrading react and react-dom to 18.3.1 and correct PowerShell syntax"
git push origin main
# Forcer un nouveau déploiement sur Vercel
vercel --force --prod