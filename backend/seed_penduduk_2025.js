const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePenduduk() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'curahtatal_db'
    });

    console.log('Terhubung ke database MySQL...');

    const umur_data = {
      laki_laki: [
        { range: '0-19', count: 875 },
        { range: '20-39', count: 1360 },
        { range: '40-59', count: 847 },
        { range: '60-79', count: 1036 },
        { range: '80-99', count: 24 },
        { range: '100+', count: 6 }
      ],
      perempuan: [
        { range: '0-19', count: 1017 },
        { range: '20-39', count: 1420 },
        { range: '40-59', count: 887 },
        { range: '60-79', count: 1066 },
        { range: '80-99', count: 34 },
        { range: '100+', count: 3 }
      ]
    };

    const pekerjaan_data = [
      { nama: 'Petani', jumlah: 3739 },
      { nama: 'Belum Bekerja', jumlah: 1365 },
      { nama: 'Pelajar', jumlah: 1130 },
      { nama: 'Buruh Tani', jumlah: 1024 },
      { nama: 'Ibu Rumah Tangga', jumlah: 668 },
      { nama: 'Wiraswasta', jumlah: 250 },
      { nama: 'Pedagang Keliling', jumlah: 38 },
      { nama: 'Guru Swasta', jumlah: 28 },
      { nama: 'Peternak', jumlah: 23 },
      { nama: 'Perangkat Desa', jumlah: 18 }
    ];

    const pendidikan_data = [
      { tingkat: 'Tamat SD / Sederajat', jumlah: 2751 },
      { tingkat: 'Tamat SMP / Sederajat', jumlah: 905 },
      { tingkat: 'Tamat SMA / Sederajat', jumlah: 323 },
      { tingkat: 'Tamat S-1 / Sederajat', jumlah: 53 },
      { tingkat: 'Tamat D-3 / Sederajat', jumlah: 4 },
      { tingkat: 'Tamat S-2 / Sederajat', jumlah: 1 },
      { tingkat: 'Tidak / Belum Tamat SD', jumlah: 643 },
      { tingkat: 'Belum Sekolah (3-6 thn)', jumlah: 3895 }
    ];

    try { await connection.query('ALTER TABLE penduduk ADD COLUMN umur_data TEXT;'); } catch (e) {}
    try { await connection.query('ALTER TABLE penduduk ADD COLUMN pekerjaan_data TEXT;'); } catch (e) {}
    try { await connection.query('ALTER TABLE penduduk ADD COLUMN pendidikan_data TEXT;'); } catch (e) {}

    const umurStr = JSON.stringify(umur_data);
    const pekerjaanStr = JSON.stringify(pekerjaan_data);
    const pendidikanStr = JSON.stringify(pendidikan_data);

    await connection.query(
      `INSERT INTO penduduk (id, total_penduduk, kepala_keluarga, laki_laki, perempuan, umur_data, pekerjaan_data, pendidikan_data)
       VALUES (1, 8575, 3419, 4148, 4427, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         total_penduduk = VALUES(total_penduduk),
         kepala_keluarga = VALUES(kepala_keluarga),
         laki_laki = VALUES(laki_laki),
         perempuan = VALUES(perempuan),
         umur_data = VALUES(umur_data),
         pekerjaan_data = VALUES(pekerjaan_data),
         pendidikan_data = VALUES(pendidikan_data)`,
      [umurStr, pekerjaanStr, pendidikanStr]
    );

    console.log('🎉 SUKSES! Data Penduduk Prodeskel 2025 telah berhasil di-update di database MySQL!');
    await connection.end();
  } catch (err) {
    console.error('Error updating database:', err.message);
  }
}

updatePenduduk();
