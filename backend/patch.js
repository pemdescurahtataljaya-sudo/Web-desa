// PATCH FILE: Perbaikan APBDes save & Hero Slider save
// Tempelkan file ini di folder backend_app/ di cPanel
// Lalu tambahkan 1 baris di AKHIR server.js (SEBELUM app.listen):
//   require('./patch.js')(app, db);

module.exports = function(app, db) {
  console.log('[PATCH] Loading APBDes & Settings fixes...');

  // Fix: GET apbdes - ambil data terbaru (ORDER BY id DESC)
  app.get('/api/apbdes-fixed/:tahun', async (req, res) => {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    try {
      // Pastikan tabel ada
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS apbdes (
          id INT AUTO_INCREMENT PRIMARY KEY, tahun INT NOT NULL,
          data LONGTEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
      } catch(e) {}

      const [rows] = await db.query('SELECT * FROM apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
      if (rows.length > 0) {
        let parsedData;
        try { parsedData = JSON.parse(rows[0].data); } catch (e) { parsedData = null; }
        return res.json({ tahun, data: parsedData || defaultApbdesData() });
      }
      return res.json({ tahun, data: defaultApbdesData() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fix: PUT apbdes - cek dulu ada/tidak, lalu UPDATE atau INSERT
  app.put('/api/apbdes-fixed/:tahun', async (req, res) => {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data APBD Wajib diisi' });
    try {
      const dataStr = JSON.stringify(data);
      const [existing] = await db.query('SELECT id FROM apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
      if (existing.length > 0) {
        await db.query('UPDATE apbdes SET data = ? WHERE id = ?', [dataStr, existing[0].id]);
      } else {
        await db.query('INSERT INTO apbdes (tahun, data) VALUES (?, ?)', [tahun, dataStr]);
      }
      res.json({ message: `Data APBDes tahun ${tahun} berhasil disimpan.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fix: GET settings - parse hero_slider dari DB dengan benar
  app.get('/api/settings-fixed', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
      if (rows.length > 0) {
        const data = rows[0];
        // Parse JSON columns
        const jsonCols = ['contacts_data', 'hero_slider', 'profil_misi', 'profil_dusun',
          'profil_kades_history', 'profil_perangkat', 'profil_aparat', 'profil_bpd', 'profil_sarpras'];
        for (const col of jsonCols) {
          if (typeof data[col] === 'string') {
            try { data[col] = JSON.parse(data[col]); } catch (e) {}
          }
        }
        if (typeof data.profil_geografis === 'string' && data.profil_geografis.trim().startsWith('{')) {
          try { data.profil_geografis = JSON.parse(data.profil_geografis); } catch (e) {}
        }
        return res.json(data);
      }
      return res.json({ theme_color: '#10b981' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fix: PUT settings - update baris yang ada (bukan hardcode id=1)
  app.put('/api/settings-fixed', async (req, res) => {
    try {
      const s = req.body;
      const stringify = (v) => typeof v === 'object' ? JSON.stringify(v) : (v || '');

      // Cari ID baris yang ada
      const [existing] = await db.query('SELECT id FROM settings ORDER BY id ASC LIMIT 1');
      const targetId = existing.length > 0 ? existing[0].id : 1;
      if (existing.length === 0) {
        await db.query('INSERT INTO settings (id, theme_color) VALUES (1, "#10b981")');
      }

      // Pastikan kolom ada
      const cols = ['hero_slider', 'profil_visi', 'profil_tagline', 'profil_misi', 'profil_sejarah',
        'profil_geografis', 'profil_dusun', 'profil_kades_history', 'profil_perangkat',
        'profil_aparat', 'profil_bpd', 'profil_sarpras'];
      for (const col of cols) {
        try { await db.query(`ALTER TABLE settings ADD COLUMN ${col} TEXT`); } catch(e) {}
      }

      await db.query(
        `UPDATE settings SET
          theme_color = ?, footer_desc = ?, address = ?, email = ?,
          contacts_data = ?, hero_slider = ?,
          profil_visi = ?, profil_tagline = ?, profil_misi = ?, profil_sejarah = ?,
          profil_geografis = ?, profil_dusun = ?, profil_kades_history = ?,
          profil_perangkat = ?, profil_aparat = ?, profil_sarpras = ?
        WHERE id = ?`,
        [
          s.theme_color || '#10b981', s.footer_desc || '', s.address || '', s.email || '',
          stringify(s.contacts_data || []), stringify(s.hero_slider || []),
          s.profil_visi || '', s.profil_tagline || '', stringify(s.profil_misi || []),
          s.profil_sejarah || '', stringify(s.profil_geografis || ''),
          stringify(s.profil_dusun || []), stringify(s.profil_kades_history || []),
          stringify(s.profil_perangkat || []), stringify(s.profil_aparat || []),
          stringify(s.profil_sarpras || {}),
          targetId
        ]
      );
      res.json({ message: 'Pengaturan berhasil diperbarui' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fix: GET realisasi - ORDER BY id DESC
  app.get('/api/realisasi-fixed/:tahun', async (req, res) => {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    try {
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS realisasi_apbdes (
          id INT AUTO_INCREMENT PRIMARY KEY, tahun INT NOT NULL,
          data LONGTEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
      } catch(e) {}
      const [rows] = await db.query('SELECT * FROM realisasi_apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
      if (rows.length > 0) {
        let parsedData;
        try { parsedData = JSON.parse(rows[0].data); } catch (e) { parsedData = null; }
        return res.json({ tahun, data: parsedData || defaultRealisasiData() });
      }
      return res.json({ tahun, data: defaultRealisasiData() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fix: PUT realisasi
  app.put('/api/realisasi-fixed/:tahun', async (req, res) => {
    const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data wajib diisi' });
    try {
      const dataStr = JSON.stringify(data);
      const [existing] = await db.query('SELECT id FROM realisasi_apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
      if (existing.length > 0) {
        await db.query('UPDATE realisasi_apbdes SET data = ? WHERE id = ?', [dataStr, existing[0].id]);
      } else {
        await db.query('INSERT INTO realisasi_apbdes (tahun, data) VALUES (?, ?)', [tahun, dataStr]);
      }
      res.json({ message: `Data Realisasi tahun ${tahun} berhasil disimpan.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cleanup endpoint: hapus duplikat baris apbdes, simpan hanya yang terbaru
  app.get('/api/patch/cleanup-duplicates', async (req, res) => {
    try {
      const logs = [];
      // APBDes
      const [apbRows] = await db.query('SELECT tahun, COUNT(*) as cnt FROM apbdes GROUP BY tahun HAVING cnt > 1');
      for (const row of apbRows) {
        const [dupes] = await db.query('SELECT id FROM apbdes WHERE tahun = ? ORDER BY id ASC', [row.tahun]);
        const idsToDelete = dupes.slice(0, -1).map(d => d.id); // keep last one
        if (idsToDelete.length > 0) {
          await db.query(`DELETE FROM apbdes WHERE id IN (${idsToDelete.join(',')})`);
          logs.push(`Deleted ${idsToDelete.length} duplicate apbdes rows for tahun ${row.tahun}`);
        }
      }
      // Realisasi
      const [realRows] = await db.query('SELECT tahun, COUNT(*) as cnt FROM realisasi_apbdes GROUP BY tahun HAVING cnt > 1');
      for (const row of realRows) {
        const [dupes] = await db.query('SELECT id FROM realisasi_apbdes WHERE tahun = ? ORDER BY id ASC', [row.tahun]);
        const idsToDelete = dupes.slice(0, -1).map(d => d.id);
        if (idsToDelete.length > 0) {
          await db.query(`DELETE FROM realisasi_apbdes WHERE id IN (${idsToDelete.join(',')})`);
          logs.push(`Deleted ${idsToDelete.length} duplicate realisasi rows for tahun ${row.tahun}`);
        }
      }
      // Add UNIQUE index
      try { await db.query('ALTER TABLE apbdes ADD UNIQUE INDEX idx_tahun (tahun)'); logs.push('Added UNIQUE index to apbdes.tahun'); } catch(e) { logs.push('apbdes UNIQUE index: ' + e.message); }
      try { await db.query('ALTER TABLE realisasi_apbdes ADD UNIQUE INDEX idx_tahun (tahun)'); logs.push('Added UNIQUE index to realisasi_apbdes.tahun'); } catch(e) { logs.push('realisasi UNIQUE index: ' + e.message); }

      res.json({ message: 'Cleanup done', logs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Version endpoint
  app.get('/api/version', (req, res) => {
    res.json({ version: 'patch-v1', time: new Date().toISOString() });
  });

  console.log('[PATCH] Loaded: /api/apbdes-fixed, /api/settings-fixed, /api/realisasi-fixed, /api/patch/cleanup-duplicates, /api/version');

  function defaultApbdesData() {
    return {
      pendapatan: [
        { id: 'p1', nama: 'Pendapatan Asli Desa', jumlah: 0 },
        { id: 'p2', nama: 'Pendapatan Transfer', jumlah: 0 },
        { id: 'p3', nama: 'Lain Lain Pendapatan Yang Sah', jumlah: 0 }
      ],
      belanja: [
        { id: 'b1', nama: 'Bidang Penyelenggaraan Pemerintahan desa', jumlah: 0 },
        { id: 'b2', nama: 'Bidang Pelaksanaan Pembangunan Desa', jumlah: 0 },
        { id: 'b3', nama: 'Bidang Pembinaan Kemasyarakatan Desa', jumlah: 0 },
        { id: 'b4', nama: 'Bidang Pemberdayaan Masyarakat Desa', jumlah: 0 },
        { id: 'b5', nama: 'Bidang Penanggulangan Bencana, Desa Darurat Dan Mendesak Desa', jumlah: 0 }
      ],
      pembiayaan: [
        { id: 'f1', nama: 'Penerimaan Pembiayaan', jumlah: 0 },
        { id: 'f2', nama: 'Pengeluaran Pembiayaan', jumlah: 0 }
      ]
    };
  }

  function defaultRealisasiData() {
    return {
      pendapatan: [
        { id: 'rp1', nama: 'Pendapatan Asli Desa', anggaran: 0, realisasi: 0, subItems: [] },
        { id: 'rp2', nama: 'Pendapatan Transfer', anggaran: 0, realisasi: 0, subItems: [] },
        { id: 'rp3', nama: 'Pendapatan Lain Lain', anggaran: 0, realisasi: 0, subItems: [] }
      ],
      belanja: [], pembiayaan: [], dokumentasi: []
    };
  }
};
