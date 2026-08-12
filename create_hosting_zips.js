const path = require('path');
const fs = require('fs');
const AdmZip = require(path.join(__dirname, 'backend', 'node_modules', 'adm-zip'));

const rootDir = __dirname;
const outputDir = path.join(rootDir, 'SIAP_UPLOAD_HOSTING');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📦 Membuat file ZIP untuk hosting...');

// 1. Zip public-web/dist
try {
  const zipPublic = new AdmZip();
  zipPublic.addLocalFolder(path.join(rootDir, 'public-web', 'dist'));
  zipPublic.writeZip(path.join(outputDir, '1_public_web_dist.zip'));
  console.log('✅ 1_public_web_dist.zip selesai!');
} catch (e) {
  console.error('❌ Gagal zip public-web:', e.message);
}

// 2. Zip admin-web/dist
try {
  const zipAdmin = new AdmZip();
  zipAdmin.addLocalFolder(path.join(rootDir, 'admin-web', 'dist'));
  zipAdmin.writeZip(path.join(outputDir, '2_admin_web_dist.zip'));
  console.log('✅ 2_admin_web_dist.zip selesai!');
} catch (e) {
  console.error('❌ Gagal zip admin-web:', e.message);
}

// 3. Zip backend (tanpa node_modules)
try {
  const zipBackend = new AdmZip();
  const backendDir = path.join(rootDir, 'backend');
  
  const files = fs.readdirSync(backendDir);
  for (const file of files) {
    if (file === 'node_modules') continue;
    const fullPath = path.join(backendDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      zipBackend.addLocalFolder(fullPath, file);
    } else {
      zipBackend.addLocalFile(fullPath);
    }
  }
  zipBackend.writeZip(path.join(outputDir, '3_backend.zip'));
  console.log('✅ 3_backend.zip selesai!');
} catch (e) {
  console.error('❌ Gagal zip backend:', e.message);
}

console.log(`\n🎉 SEMUA FILE TERBUNGKUS RAPI DI FOLDER: ${outputDir}`);
