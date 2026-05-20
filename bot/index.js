const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/Team-MCD2/nyc-bot.git';
const APP_DIR = path.join(__dirname, 'nyc-bot-app');

console.log('==========================================');
console.log('🚀 Démarrage du Bootstrap NYC Cookies Bot');
console.log('==========================================\n');

// 1. Cloner ou mettre à jour le repository
if (!fs.existsSync(APP_DIR)) {
    console.log(`📥 [1/4] Clonage du dépôt GitHub...`);
    execSync(`git clone ${REPO_URL} ${APP_DIR}`, { stdio: 'inherit' });
} else {
    console.log('🔄 [1/4] Mise à jour du dépôt (git pull)...');
    try {
        execSync('git pull', { cwd: APP_DIR, stdio: 'inherit' });
    } catch (e) {
        console.log('⚠️ Impossible de faire git pull, le serveur va continuer avec la version actuelle.');
    }
}

// 2. Création et configuration automatique du fichier .env
console.log('⚙️ [2/4] Création du fichier .env automatique...');
const envPath = path.join(APP_DIR, '.env');
const envContent = `
# Variables configurées automatiquement par le bootstrap
SITE_API_SECRET=my-super-secret-nyc-2026
NEXT_PUBLIC_SITE_URL=https://nyc-cookies-casablanca.vercel.app
PORT=3057
`;
fs.writeFileSync(envPath, envContent.trim());
console.log('✅ Fichier .env créé avec succès.');

// 3. Installation des dépendances Node.js du bot
console.log('\n📦 [3/4] Installation des dépendances du bot (npm install)...');
try {
    execSync('npm install', { cwd: APP_DIR, stdio: 'inherit' });
} catch (err) {
    console.error('❌ Erreur lors de l\'installation des dépendances !');
    process.exit(1);
}

// 4. Lancement via PM2
// L'option --no-daemon est obligatoire sur Kermhosting (Pterodactyl) pour garder le processus en vie dans la console
console.log('\n🚀 [4/4] Lancement du bot via PM2...');
try {
    // On installe pm2 localement si besoin, et on le lance
    execSync('npx pm2 start index.js --name "nyc-bot" --no-daemon', { cwd: APP_DIR, stdio: 'inherit' });
} catch (error) {
    console.error('\n❌ Le processus PM2 a été arrêté ou a rencontré une erreur.');
}