const fs = require('fs');
const path = require('path');

// Chemin de base du dossier frontend/app
const BASE_DIR = path.join(__dirname, 'frontend', 'app');

// Liste des fichiers page.tsx qui DOIVENT exister (chemins relatifs depuis frontend/app)
const REQUIRED_PAGES = [
  'page.tsx',                                    // Page d'accueil (root)
  '[locale]/page.tsx',                          // Page d'accueil avec locale
  '[locale]/login/page.tsx',                    // Page de connexion
  '[locale]/dashboard/page.tsx',                // Tableau de bord principal
  '[locale]/dashboard/billing/page.tsx',        // Page de facturation
  '[locale]/billing/return/page.tsx',           // Page de retour de paiement
];

// Fonction pour scanner récursivement tous les page.tsx
function findAllPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      // Chemin relatif depuis BASE_DIR
      const relativePath = path.relative(BASE_DIR, filePath);
      fileList.push(relativePath);
    }
  }
  
  return fileList;
}

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  const fullPath = path.join(BASE_DIR, filePath);
  return fs.existsSync(fullPath);
}

// Fonction pour supprimer un fichier
function deleteFile(relativePath) {
  const fullPath = path.join(BASE_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✓ Supprimé: ${relativePath}`);
    return true;
  }
  return false;
}

// Fonction principale
function main() {
  console.log('🔍 Analyse des fichiers page.tsx...\n');
  
  // 1. Trouver tous les page.tsx existants
  const allPages = findAllPageFiles(BASE_DIR);
  console.log(`📁 Fichiers page.tsx trouvés: ${allPages.length}`);
  allPages.forEach(p => console.log(`   - ${p}`));
  console.log('');
  
  // 2. Vérifier les fichiers requis
  console.log('✅ Vérification des fichiers requis:');
  let missingFiles = [];
  REQUIRED_PAGES.forEach(page => {
    const exists = fileExists(page);
    if (exists) {
      console.log(`   ✓ ${page}`);
    } else {
      console.log(`   ✗ ${page} (MANQUANT)`);
      missingFiles.push(page);
    }
  });
  console.log('');
  
  // 3. Identifier et supprimer les fichiers non requis
  console.log('🗑️  Suppression des fichiers non requis:');
  let deletedCount = 0;
  allPages.forEach(page => {
    if (!REQUIRED_PAGES.includes(page)) {
      if (deleteFile(page)) {
        deletedCount++;
      }
    }
  });
  
  if (deletedCount === 0) {
    console.log('   Aucun fichier à supprimer.');
  }
  console.log('');
  
  // 4. Rapport final
  console.log('📊 Rapport final:');
  console.log(`   - Fichiers page.tsx restants: ${allPages.length - deletedCount}`);
  console.log(`   - Fichiers supprimés: ${deletedCount}`);
  console.log(`   - Fichiers manquants: ${missingFiles.length}`);
  
  if (missingFiles.length > 0) {
    console.log('\n️  Fichiers manquants à créer:');
    missingFiles.forEach(page => {
      console.log(`   - ${page}`);
    });
  }
  
  if (deletedCount > 0 || missingFiles.length > 0) {
    console.log('\n Action requise: Veuillez créer les fichiers manquants listés ci-dessus.');
  } else {
    console.log('\n✨ Tout est en ordre! Tous les fichiers requis sont présents.');
  }
}

// Exécuter le script
main();