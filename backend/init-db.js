const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    console.log('Mencoba terhubung ke MySQL (pastikan XAMPP nyala)...');
    
    const dbName = process.env.DB_NAME || 'curahtatal_db';
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });

    console.log(`Terhubung ke database ${dbName}!`);
    console.log('Membuat tabel-tabel...');
    
    // Buat tabel posts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kategori ENUM('apbdes', 'realisasi', 'rkp', 'kegiatan') NOT NULL,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        thumbnail VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Buat tabel post_dokumentasi
    await connection.query(`
      CREATE TABLE IF NOT EXISTS post_dokumentasi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      );
    `);

    // Buat tabel penduduk
    await connection.query(`
      CREATE TABLE IF NOT EXISTS penduduk (
        id INT PRIMARY KEY,
        total_penduduk INT DEFAULT 0,
        kepala_keluarga INT DEFAULT 0,
        laki_laki INT DEFAULT 0,
        perempuan INT DEFAULT 0,
        umur_data TEXT,
        pekerjaan_data TEXT,
        pendidikan_data TEXT
      );
    `);

    // Buat tabel settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY,
        theme_color VARCHAR(50) DEFAULT '#10b981',
        footer_desc TEXT,
        address VARCHAR(255),
        email VARCHAR(100),
        contacts_data TEXT
      );
    `);

    // Buat tabel apbdes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS apbdes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT UNIQUE NOT NULL,
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Tambahkan data default settings jika kosong
    await connection.query(`
      INSERT IGNORE INTO settings (id, theme_color, footer_desc, address, email, contacts_data)
      VALUES (1, '#10b981', 'Membangun desa wisata yang lestari, berdaya saing, dan sejahtera.', 'Kec. Arjasa, Situbondo 68371', 'pemdes@curahtatal.desa.id', '[]');
    `);

    // Tambahkan kolom jika tabel sudah ada (Alter)
    try {
      await connection.query('ALTER TABLE penduduk ADD COLUMN umur_data TEXT;');
    } catch (e) { /* Abaikan jika sudah ada */ }
    try {
      await connection.query('ALTER TABLE penduduk ADD COLUMN pekerjaan_data TEXT;');
    } catch (e) { /* Abaikan jika sudah ada */ }

    // Masukkan data default penduduk jika kosong
    await connection.query(`
      INSERT IGNORE INTO penduduk (id, total_penduduk, kepala_keluarga, laki_laki, perempuan)
      VALUES (1, 0, 0, 0, 0);
    `);

    console.log('Semua persiapan Database MySQL selesai dengan sukses! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('GAGAL! Pastikan XAMPP MySQL Anda sudah "Start". Error detail:', err.message);
    process.exit(1);
  }
}

initDB();
