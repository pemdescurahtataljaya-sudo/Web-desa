const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const AdmZip = require('adm-zip');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Multer disk storage for attachments (PDF, DOCX, XLSX, ZIP, HTML, Images)
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});
const uploadDoc = multer({ storage: docStorage });

// Rute untuk mendapatkan semua post berdasarkan kategori
app.get('/api/posts', async (req, res) => {
  const { kategori } = req.query;
  try {
    let query = 'SELECT * FROM posts';
    let params = [];
    if (kategori) {
      query += ' WHERE kategori = ?';
      params.push(kategori);
    }
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rute mendapatkan detail post beserta dokumentasi
app.get('/api/posts/:id', async (req, res) => {
  try {
    const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (post.length === 0) return res.status(404).json({ message: 'Post tidak ditemukan' });
    
    const [dokumentasi] = await db.query('SELECT image_url FROM post_dokumentasi WHERE post_id = ?', [req.params.id]);
    
    res.json({
      ...post[0],
      dokumentasi: dokumentasi.map(d => d.image_url)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fungsi memproses gambar (Diset ultra-cepat & teroptimasi)
async function processImage(file) {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const filepath = path.join(uploadDir, filename);
  try {
    await sharp(file.buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75, effort: 2 })
      .toFile(filepath);
  } catch (e) {
    fs.writeFileSync(filepath, file.buffer);
  }
  return filename;
}

// Rute membuat post baru
app.post('/api/posts', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'dokumentasi', maxCount: 10 }]), async (req, res) => {
  const { kategori, judul, deskripsi } = req.body;
  
  if (!kategori || !judul) {
    return res.status(400).json({ error: 'Kategori dan Judul wajib diisi' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let thumbnailUrl = null;
    if (req.files['thumbnail']) {
      thumbnailUrl = await processImage(req.files['thumbnail'][0]);
    }

    const [result] = await connection.query(
      'INSERT INTO posts (kategori, judul, deskripsi, thumbnail) VALUES (?, ?, ?, ?)',
      [kategori, judul, deskripsi, thumbnailUrl]
    );

    const postId = result.insertId;

    if (req.files['dokumentasi'] && req.files['dokumentasi'].length > 0) {
      const docUrls = await Promise.all(
        req.files['dokumentasi'].map(file => processImage(file))
      );
      for (const docUrl of docUrls) {
        await connection.query(
          'INSERT INTO post_dokumentasi (post_id, image_url) VALUES (?, ?)',
          [postId, docUrl]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Post berhasil ditambahkan', id: postId });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

app.put('/api/posts/:id', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'dokumentasi', maxCount: 10 }]), async (req, res) => {
  const { judul, deskripsi } = req.body;
  const postId = req.params.id;
  
  if (!judul) {
    return res.status(400).json({ error: 'Judul wajib diisi' });
  }

  try {
    let query = 'UPDATE posts SET judul = ?, deskripsi = ?';
    let params = [judul, deskripsi];

    if (req.files && req.files['thumbnail']) {
      const thumbnailUrl = await processImage(req.files['thumbnail'][0]);
      query += ', thumbnail = ?';
      params.push(thumbnailUrl);
    }

    query += ' WHERE id = ?';
    params.push(postId);

    await db.query(query, params);

    // Jika ada upload dokumentasi tambahan saat Edit, tambahkan ke tabel secara paralel
    if (req.files && req.files['dokumentasi'] && req.files['dokumentasi'].length > 0) {
      const docUrls = await Promise.all(
        req.files['dokumentasi'].map(file => processImage(file))
      );
      for (const docUrl of docUrls) {
        await db.query(
          'INSERT INTO post_dokumentasi (post_id, image_url) VALUES (?, ?)',
          [postId, docUrl]
        );
      }
    }

    // Jika ada foto dokumentasi lama yang dihapus
    if (req.body.deletedDokumentasi) {
      try {
        const deletedDocs = JSON.parse(req.body.deletedDokumentasi);
        if (Array.isArray(deletedDocs) && deletedDocs.length > 0) {
          const placeholders = deletedDocs.map(() => '?').join(',');
          await db.query(
            `DELETE FROM post_dokumentasi WHERE post_id = ? AND image_url IN (${placeholders})`,
            [postId, ...deletedDocs]
          );
        }
      } catch (e) {
        console.error('Gagal memproses deletedDokumentasi', e);
      }
    }

    res.json({ message: 'Post berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post terhapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Penduduk
app.get('/api/penduduk', async (req, res) => {
  try {
    try { await db.query('ALTER TABLE penduduk ADD COLUMN dokumen TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE penduduk ADD COLUMN pendidikan_data TEXT'); } catch(e) {}
    const [rows] = await db.query('SELECT * FROM penduduk ORDER BY id ASC LIMIT 1');
    if (rows.length === 0) {
      return res.json({ 
        total_penduduk: 8575, kepala_keluarga: 3419, laki_laki: 4148, perempuan: 4427,
        umur_data: null, pekerjaan_data: null, pendidikan_data: null, dokumen: []
      });
    }
    const data = rows[0];
    try { data.umur_data = JSON.parse(data.umur_data); } catch (e) { data.umur_data = null; }
    try { data.pekerjaan_data = JSON.parse(data.pekerjaan_data); } catch (e) { data.pekerjaan_data = null; }
    try { data.pendidikan_data = JSON.parse(data.pendidikan_data); } catch (e) { data.pendidikan_data = null; }
    try { data.dokumen = JSON.parse(data.dokumen); } catch (e) { data.dokumen = []; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/penduduk', async (req, res) => {
  const { total_penduduk, kepala_keluarga, laki_laki, perempuan, umur_data, pekerjaan_data, pendidikan_data, dokumen } = req.body;
  try {
    try { await db.query('ALTER TABLE penduduk ADD COLUMN dokumen TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE penduduk ADD COLUMN pendidikan_data TEXT'); } catch(e) {}
    const umurStr = umur_data ? JSON.stringify(umur_data) : null;
    const pekerjaanStr = pekerjaan_data ? JSON.stringify(pekerjaan_data) : null;
    const pendidikanStr = pendidikan_data ? JSON.stringify(pendidikan_data) : null;
    const dokumenStr = Array.isArray(dokumen) ? JSON.stringify(dokumen) : '[]';

    const [existingPen] = await db.query('SELECT id FROM penduduk ORDER BY id ASC LIMIT 1');
    const penTargetId = existingPen.length > 0 ? existingPen[0].id : 1;
    if (existingPen.length === 0) {
      await db.query('INSERT INTO penduduk (id, total_penduduk, kepala_keluarga, laki_laki, perempuan, umur_data, pekerjaan_data, pendidikan_data, dokumen) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
        [total_penduduk || 0, kepala_keluarga || 0, laki_laki || 0, perempuan || 0, umurStr, pekerjaanStr, pendidikanStr, dokumenStr]);
    } else {
      await db.query(
        'UPDATE penduduk SET total_penduduk = ?, kepala_keluarga = ?, laki_laki = ?, perempuan = ?, umur_data = ?, pekerjaan_data = ?, pendidikan_data = ?, dokumen = ? WHERE id = ?',
        [total_penduduk || 0, kepala_keluarga || 0, laki_laki || 0, perempuan || 0, umurStr, pekerjaanStr, pendidikanStr, dokumenStr, penTargetId]
      );
    }
    res.json({ message: 'Data penduduk berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload dokumen Penduduk (.pdf, .html, .xlsx, .doc, dll)
app.post('/api/penduduk/upload-doc', uploadDoc.array('documents', 10), (req, res) => {
  try {
    const files = req.files || [];
    const result = files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype
    }));
    res.json({ files: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Default data dari dokumen RPJM Desa & Visi Misi
const defaultVisi = "Gotong Royong Membangun Desa Curah Tatal Sejahtera dan Berdaya (Curah Tatal JAYA)";
const defaultMisi = [
  "Optimalisasi Peran dan tugas serta tanggung jawab Pemerintah Desa Curah Tatal dalam memberikan pelayanan kepada Masyarakat.",
  "Mewujudkan pemerintah desa yang jujur, adil, dan bermartabat dengan pengambilan keputusan yang cepat dan tepat.",
  "Pemerataan pembangunan desa Curah Tatal, baik fisik dan Pembangunan Sumber Daya Manusia.",
  "Mengembangkan perekonomian masyarakat Desa Curah Tatal melalui pemanfaatan potensi desa yang ada.",
  "Mengedepankan musyawarah mufakat dalam setiap mendengar aspirasi maupun usulan dari warga Curah Tatal.",
  "Meningkatkan keamanan, ketertiban, dan ketentraman Warga Desa Curah Tatal.",
  "Mengaktifkan kegiatan-kegiatan kelembagaan desa baik Kepemudaan dengan bidang Olahraga maupun pemberdayaan terhadap perempuan.",
  "Mewujudkan mutu kesejahteraan masyarakat untuk mencapai taraf kehidupan yang lebih baik dan memperhatikan pentingnya pendidikan generasi warga Curah Tatal."
];

const defaultSejarah = "Sekitar tahun 1821, daerah yang sekarang bernama Desa Curah Tatal masih merupakan hutan belukar dengan sedikit penduduk yang bermata pencaharian berburu dan bercocok tanam. Pembuka hutan pertama yang dikenal masyarakat adalah Kembeng Pote, tokoh asal Pulau Madura. Untuk menghormati jasanya, setiap tahun masyarakat mengadakan upacara selamatan tradisional di Makam Kembeng Pote.\n\nDalam membuka hutan, Kembeng Pote dibantu 6 tokoh pendatang baru asal Madura (di antaranya Jujuk Dulhafi). Sebelum bernama Curah Tatal, desa ini awalnya dinamakan Desa Baru (karena banyaknya pohon Baru). Perubahan nama menjadi DESA CURAH TATAL bermula saat terjadi banjir besar yang airnya memenuhi aliran curah (sungai). Banjir tersebut menghanyutkan banyak potongan kayu yang dalam bahasa lokal disebut 'Tatal'. Aliran curah tersebut melintasi perbatasan barat desa yang kini menjadi batas wilayah antara Desa Curah Tatal (Kab. Situbondo) dan Desa Bercak, Kladi, serta Solor (Kab. Bondowoso).\n\nSeiring berkembangnya zaman, Desa Curah Tatal tumbuh pesat menjadi 10 Dusun dan 25 RT dengan kepemimpinan berkelanjutan yang selalu mengedepankan gotong royong dan kebersamaan warga.";

const defaultGeografis = "Desa Curah Tatal terletak di Kecamatan Arjasa, Kabupaten Situbondo dengan luas wilayah administrasi 42,56 km² (15.663,1 Ha). Desa ini berada di kawasan dataran tinggi perbukitan dengan ketinggian rata-rata 20,5 mdpl.\n\nBatas-Batas Wilayah:\n• Utara: Desa Jatisari & Desa Kandang (Kec. Arjasa)\n• Timur: Desa Jatisari & Desa Kayumas (Kec. Arjasa)\n• Selatan: Desa Kayumas & Desa Kampung Waru / Kawasan Wisata Ijen (Kab. Bondowoso)\n• Barat: Desa Bercak Asri, Desa Kladi, & Desa Solor (Kec. Cermee, Kab. Bondowoso)\n\nOrbitasi & Jarak:\n• Jarak ke Ibu Kota Kecamatan Arjasa: 7 - 11 KM\n• Jarak ke Ibu Kota Kabupaten Situbondo: 19 - 25 KM";

const defaultDusun = [
  { nama: "Krajan", rt: "4 RT", kasun: "SAMITO" },
  { nama: "Barutengah", rt: "2 RT", kasun: "SAYYIWAKI" },
  { nama: "Cangkring", rt: "3 RT", kasun: "KUSWANDI" },
  { nama: "Dergung", rt: "3 RT", kasun: "ANSORI" },
  { nama: "Telagasari", rt: "3 RT", kasun: "AINUR RIDWAN" },
  { nama: "Mindi", rt: "2 RT", kasun: "RUKYANTO" },
  { nama: "Cobbuk", rt: "2 RT", kasun: "ARTODI" },
  { nama: "Batellok", rt: "2 RT", kasun: "SUGIYANTO" },
  { nama: "Kacep", rt: "2 RT", kasun: "BUYANTO" },
  { nama: "Tamanrejo", rt: "2 RT", kasun: "MULYADI" }
];

const defaultKadesHistory = [
  { kades: "Jujuk Dulhafi", periode: "1872 - 1921" },
  { kades: "Bapak Sohaban", periode: "1921 - 1930" },
  { kades: "Bapak Monayye", periode: "1930 - 1940" },
  { kades: "Bapak Joyo Asmoro", periode: "1940 - 1975" },
  { kades: "Bapak S. Budiono", periode: "1975 - 2000" },
  { kades: "Bapak Amiredjo", periode: "2000 - 2008" },
  { kades: "Bapak Sumito (Pj)", periode: "2008" },
  { kades: "Bapak Amiredjo", periode: "2008 - 2014" },
  { kades: "Bapak Suswadi (Pj)", periode: "2014 - 2016" },
  { kades: "Ibu Arwiyatin, S.Ag", periode: "2016 - 2022" },
  { kades: "Bapak Suswanto, S.Sos", periode: "2022 - 2028" }
];

const defaultPerangkat = [
  { id: 'kades', jabatan: 'Kepala Desa', nama: 'SUSWANTO, S.Sos.', type: 'kades' },
  { id: 'sekdes', jabatan: 'Sekretaris Desa', nama: 'SUPANDI, S.Pd', type: 'sekdes' },
  
  { id: 'kasi_pem', jabatan: 'Kasi Pemerintahan', nama: 'JAMILULLOH, S.Pd.I', staf: 'YUDA', type: 'kasi' },
  { id: 'kasi_kesra', jabatan: 'Kasi Kesejahteraan', nama: 'ANDREYAN', staf: '', type: 'kasi' },
  { id: 'kasi_pel', jabatan: 'Kasi Pelayanan', nama: 'VERA SUCI IRMAWATI', staf: 'PUTRI', type: 'kasi' },
  
  { id: 'kaur_tu', jabatan: 'Kaur Tata Usaha/Umum', nama: 'SAYYI WAKI', staf: '', type: 'kaur' },
  { id: 'kaur_keu', jabatan: 'Kaur Keuangan', nama: 'HALIFA', staf: '', type: 'kaur' },
  { id: 'kaur_ren', jabatan: 'Kaur Perencanaan', nama: 'YONGKI MARDIWINATA', staf: 'YOGA', type: 'kaur' }
];

const defaultAparat = [
  { nama: 'SUSWANTO, S.Sos.', jabatan: 'Kepala Desa', foto: '', wa: '6281234567890', email: 'kades@curahtatal.desa.id' },
  { nama: 'SUPANDI, S.Pd', jabatan: 'Sekretaris Desa', foto: '', wa: '6281234567891', email: 'sekdes@curahtatal.desa.id' },
  { nama: 'JAMILULLOH, S.Pd.I', jabatan: 'Kasi Pemerintahan', foto: '', wa: '', email: '' },
  { nama: 'ANDREYAN', jabatan: 'Kasi Kesejahteraan', foto: '', wa: '', email: '' },
  { nama: 'VERA SUCI IRMAWATI', jabatan: 'Kasi Pelayanan', foto: '', wa: '', email: '' },
  { nama: 'SAYYI WAKI', jabatan: 'Kaur Tata Usaha / Umum', foto: '', wa: '', email: '' },
  { nama: 'HALIFA', jabatan: 'Kaur Keuangan', foto: '', wa: '', email: '' },
  { nama: 'YONGKI MARDIWINATA', jabatan: 'Kaur Perencanaan', foto: '', wa: '', email: '' }
];

const defaultBpd = [
  { nama: "MISADI", jabatan: "Ketua BPD" },
  { nama: "DARMIATIN", jabatan: "Wakil Ketua BPD" },
  { nama: "SUGIYANTO", jabatan: "Sekretaris BPD" },
  { nama: "ABDUL", jabatan: "Anggota" },
  { nama: "MISYONO", jabatan: "Anggota" },
  { nama: "SUSILAWATI", jabatan: "Anggota" },
  { nama: "TARIJO", jabatan: "Anggota" },
  { nama: "ANGWARI", jabatan: "Anggota" },
  { nama: "SUBROTO", jabatan: "Anggota" }
];

const defaultSarpras = {
  jalan_hotmix: "24 Km",
  jalan_aspal: "6,55 Km",
  jalan_makadam: "15 Km",
  jalan_tanah: "12 Km",
  jalan_paving: "2,8 Km",
  jalan_rabat: "0,6 Km",
  poskesdes: "2 Unit",
  posyandu: "14 Unit (3 Bidan, 74 Kader)",
  masjid: "15 Buah",
  mushalla: "44 Buah",
  sd: "7 Unit",
  smp: "1 Unit",
  tk_paud: "6 Unit",
  listrik_pln: "1.900 Rumah Tangga"
};

const defaultHeroSlider = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80'
];

// API Settings (Tema & Web & Profil)
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    if (rows.length > 0) {
      const data = rows[0];
      try { data.contacts_data = JSON.parse(data.contacts_data); } catch (e) { data.contacts_data = []; }
      while (typeof data.hero_slider === 'string') {
        try { data.hero_slider = JSON.parse(data.hero_slider); } catch (e) { break; }
      }
      if (!Array.isArray(data.hero_slider) || data.hero_slider.length === 0) {
        data.hero_slider = defaultHeroSlider;
      }
      try { data.profil_misi = JSON.parse(data.profil_misi) || defaultMisi; } catch (e) { data.profil_misi = defaultMisi; }
      try { data.profil_dusun = JSON.parse(data.profil_dusun) || defaultDusun; } catch (e) { data.profil_dusun = defaultDusun; }
      try { data.profil_kades_history = JSON.parse(data.profil_kades_history) || defaultKadesHistory; } catch (e) { data.profil_kades_history = defaultKadesHistory; }
      try { data.profil_perangkat = JSON.parse(data.profil_perangkat) || defaultPerangkat; } catch (e) { data.profil_perangkat = defaultPerangkat; }
      try { data.profil_aparat = JSON.parse(data.profil_aparat) || defaultAparat; } catch (e) { data.profil_aparat = defaultAparat; }
      try { 
        if (typeof data.profil_geografis === 'string' && data.profil_geografis.trim().startsWith('{')) {
          data.profil_geografis = JSON.parse(data.profil_geografis);
        }
      } catch (e) { data.profil_geografis = defaultGeografis; }
      try {
        if (typeof data.profil_sarpras === 'string' && data.profil_sarpras.trim().startsWith('{')) {
          data.profil_sarpras = JSON.parse(data.profil_sarpras);
        }
      } catch(e) { data.profil_sarpras = defaultSarpras; }

      if (!data.profil_visi) data.profil_visi = defaultVisi;
      if (!data.profil_tagline) data.profil_tagline = '#CurahTatalJAYA';
      if (!data.profil_sejarah) data.profil_sejarah = defaultSejarah;
      if (!data.profil_geografis) data.profil_geografis = defaultGeografis;

      res.json(data);
    } else {
      res.json({ 
        theme_color: '#10b981', 
        footer_desc: 'Membangun desa wisata yang lestari, berdaya saing, dan sejahtera.', 
        address: 'Kec. Arjasa, Situbondo 68371', 
        email: 'pemdes@curahtatal.desa.id', 
        contacts_data: [],
        hero_slider: defaultHeroSlider,
        profil_visi: defaultVisi, 
        profil_misi: defaultMisi, 
        profil_sejarah: defaultSejarah, 
        profil_geografis: defaultGeografis, 
        profil_dusun: defaultDusun,
        profil_kades_history: defaultKadesHistory,
        profil_perangkat: defaultPerangkat,
        profil_aparat: defaultAparat,
        profil_bpd: defaultBpd,
        profil_sarpras: defaultSarpras
      });
    }
  } catch (err) {
    res.json({ 
      theme_color: '#10b981', 
      contacts_data: [],
      hero_slider: defaultHeroSlider,
      profil_visi: defaultVisi, 
      profil_misi: defaultMisi, 
      profil_sejarah: defaultSejarah, 
      profil_geografis: defaultGeografis, 
      profil_dusun: defaultDusun,
      profil_kades_history: defaultKadesHistory,
      profil_perangkat: defaultPerangkat,
      profil_aparat: defaultAparat,
      profil_bpd: defaultBpd,
      profil_sarpras: defaultSarpras
    });
  }
});

app.put('/api/settings', async (req, res) => {
  const { 
    theme_color, footer_desc, address, email, contacts_data, hero_slider,
    profil_visi, profil_tagline, profil_misi, profil_sejarah, profil_geografis, profil_dusun,
    profil_kades_history, profil_perangkat, profil_aparat, profil_bpd, profil_sarpras
  } = req.body;
  try {
    const contactsStr = contacts_data ? JSON.stringify(contacts_data) : '[]';
    const sliderStr = hero_slider ? JSON.stringify(hero_slider) : JSON.stringify(defaultHeroSlider);
    const misiStr = profil_misi ? JSON.stringify(profil_misi) : JSON.stringify(defaultMisi);
    const dusunStr = profil_dusun ? JSON.stringify(profil_dusun) : JSON.stringify(defaultDusun);
    const kadesStr = profil_kades_history ? JSON.stringify(profil_kades_history) : JSON.stringify(defaultKadesHistory);
    const perangkatStr = profil_perangkat ? JSON.stringify(profil_perangkat) : JSON.stringify(defaultPerangkat);
    const aparatStr = profil_aparat ? JSON.stringify(profil_aparat) : JSON.stringify(defaultAparat);
    const bpdStr = profil_bpd ? JSON.stringify(profil_bpd) : JSON.stringify(defaultBpd);
    const sarprasStr = profil_sarpras ? JSON.stringify(profil_sarpras) : JSON.stringify(defaultSarpras);
    
    // Pastikan tabel dan row ada
    await db.query('CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, theme_color VARCHAR(50) DEFAULT "#10b981", footer_desc TEXT, address VARCHAR(255), email VARCHAR(100), contacts_data LONGTEXT)');
    
    // Ensure contacts_data column exists and is large enough
    try { await db.query('ALTER TABLE settings ADD COLUMN contacts_data LONGTEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings MODIFY COLUMN contacts_data LONGTEXT'); } catch(e) {}
    // Alter table jika kolom belum ada
    try { await db.query('ALTER TABLE settings ADD COLUMN hero_slider TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_visi TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_tagline VARCHAR(255)'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_misi TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_sejarah TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_geografis TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_dusun TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_kades_history TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_perangkat TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_aparat TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_bpd TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_sarpras TEXT'); } catch(e) {}

    const [existingSettings] = await db.query('SELECT id FROM settings ORDER BY id ASC LIMIT 1');
    const settingsTargetId = existingSettings.length > 0 ? existingSettings[0].id : 1;
    if (existingSettings.length === 0) {
      await db.query('INSERT INTO settings (id, theme_color) VALUES (1, "#10b981")');
    }
    
    await db.query(
      `UPDATE settings SET 
        theme_color = ?, footer_desc = ?, address = ?, email = ?, contacts_data = ?, hero_slider = ?,
        profil_visi = ?, profil_tagline = ?, profil_misi = ?, profil_sejarah = ?, profil_geografis = ?, 
        profil_dusun = ?, profil_kades_history = ?, profil_perangkat = ?, profil_aparat = ?, profil_sarpras = ?
       WHERE id = ?`,
      [
        theme_color || '#10b981', footer_desc || '', address || '', email || '', contactsStr, sliderStr,
        profil_visi || '', profil_tagline || '#CurahTatalJAYA', misiStr, profil_sejarah || '', 
        typeof profil_geografis === 'object' ? JSON.stringify(profil_geografis) : (profil_geografis || ''), 
        dusunStr, kadesStr, perangkatStr, aparatStr, 
        typeof profil_sarpras === 'object' ? JSON.stringify(profil_sarpras) : (profil_sarpras || ''),
        settingsTargetId
      ]
    );
    res.json({ message: 'Pengaturan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper ensure admin_users table exists
async function ensureAdminUsersTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_users');
    if (rows[0].count === 0) {
      await db.query('INSERT INTO admin_users (username, password) VALUES (?, ?)', ['admin', 'password']);
    }
  } catch (err) {
    console.error('Error creating admin_users table:', err);
  }
}

// =========================================================================
// KREDENSIAL ADMIN UTAMA (BISA DI-EDIT MANUAL DI CPANEL: backend_app/server.js)
// =========================================================================
const CPANEL_ADMIN_USERNAME = 'admin';
const CPANEL_ADMIN_PASSWORD = 'password';

// Endpoint Login Admin
app.post('/api/login', async (req, res) => {
  await ensureAdminUsersTable();
  const { username, password } = req.body;

  // 1. Cek Kredensial Manual yang di-set di server.js (Bisa di-edit via cPanel File Manager)
  if (username === CPANEL_ADMIN_USERNAME && password === CPANEL_ADMIN_PASSWORD) {
    return res.json({ success: true, token: 'token_' + Date.now(), username: CPANEL_ADMIN_USERNAME });
  }

  // 2. Cek Kredensial dari Database MySQL
  try {
    const [rows] = await db.query('SELECT * FROM admin_users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      res.json({ success: true, token: 'token_' + Date.now(), username: rows[0].username });
    } else {
      res.status(401).json({ error: 'Username atau Password salah!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Ganti Password / Username Admin
app.post('/api/change-password', async (req, res) => {
  await ensureAdminUsersTable();
  const { currentPassword, newUsername, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admin_users WHERE password = ? ORDER BY id ASC LIMIT 1', [currentPassword]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Password lama Anda salah!' });
    }
    const targetUser = newUsername && newUsername.trim() ? newUsername.trim() : rows[0].username;
    await db.query('UPDATE admin_users SET username = ?, password = ? WHERE id = ?', [targetUser, newPassword, rows[0].id]);
    res.json({ message: 'Username dan Password admin berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function ensureApbdesTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS apbdes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT UNIQUE NOT NULL,
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error creating apbdes table:', err);
  }
}

async function ensureRealisasiTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS realisasi_apbdes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT UNIQUE NOT NULL,
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error creating realisasi_apbdes table:', err);
  }
}

// API APBDes per Tahun
const defaultApbdesData = {
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

app.get('/api/apbdes/:tahun', async (req, res) => {
  await ensureApbdesTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  try {
    const [rows] = await db.query('SELECT * FROM apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
    if (rows.length > 0) {
      let parsedData = rows[0].data;
      while (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          break;
        }
      }
      if (!parsedData || typeof parsedData !== 'object') {
        parsedData = defaultApbdesData;
      }
      return res.json({ tahun, data: parsedData });
    } else {
      return res.json({ tahun, data: defaultApbdesData });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/apbdes/:tahun', async (req, res) => {
  await ensureApbdesTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data APBD Wajib diisi' });
  }
  try {
    const dataStr = JSON.stringify(data);
    const [existingApb] = await db.query('SELECT id FROM apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
    if (existingApb.length > 0) {
      await db.query('UPDATE apbdes SET data = ? WHERE id = ?', [dataStr, existingApb[0].id]);
    } else {
      await db.query('INSERT INTO apbdes (tahun, data) VALUES (?, ?)', [tahun, dataStr]);
    }
    res.json({ message: `Data APBDes tahun ${tahun} berhasil disimpan.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload gambar dokumentasi APBD Desa (Max 10)
app.post('/api/apbdes/upload', upload.array('images', 10), async (req, res) => {
  try {
    const filenames = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fn = await processImage(file);
        filenames.push(fn);
      }
    }
    res.json({ filenames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Laporan Realisasi per Tahun
const defaultRealisasiData = {
  pendapatan: [
    { id: 'rp1', nama: 'Pendapatan Asli Desa', anggaran: 0, realisasi: 0, subItems: [] },
    { 
      id: 'rp2', 
      nama: 'Pendapatan Transfer', 
      anggaran: 0, 
      realisasi: 0,
      subItems: [
        { id: 'sub_rp2_1', nama: 'Dana Desa', anggaran: 0, realisasi: 0 },
        { id: 'sub_rp2_2', nama: 'Bagi Hasil Pajak Dan Retribusi', anggaran: 0, realisasi: 0 },
        { id: 'sub_rp2_3', nama: 'Alokasi Dana Desa', anggaran: 0, realisasi: 0 }
      ] 
    },
    { id: 'rp3', nama: 'Pendapatan Lain Lain', anggaran: 0, realisasi: 0, subItems: [] }
  ],
  belanja: [
    { id: 'rb1', nama: 'BIDANG PENYELENGGARAAN PEMERINTAHAN DESA', anggaran: 0, realisasi: 0, subItems: [] },
    { id: 'rb2', nama: 'BIDANG PELAKSANAAN PEMBANGUNAN DESA', anggaran: 0, realisasi: 0, subItems: [] },
    { id: 'rb3', nama: 'BIDANG PEMBINAAN KEMASYARAKATAN', anggaran: 0, realisasi: 0, subItems: [] },
    { id: 'rb4', nama: 'BIDANG PEMBERDAYAAN MASYARAKAT', anggaran: 0, realisasi: 0, subItems: [] },
    { id: 'rb5', nama: 'BIDANG PENANGGULANGAN BENCANA, DARURAT DAN MENDESAK DESA', anggaran: 0, realisasi: 0, subItems: [] }
  ],
  pembiayaan: [
    { id: 'rf1', nama: 'Penerimaan Pembiayaan', anggaran: 0, realisasi: 0, subItems: [] },
    { id: 'rf2', nama: 'Pengeluaran Pembiayaan', anggaran: 0, realisasi: 0, subItems: [] }
  ],
  dokumentasi: []
};

app.get('/api/realisasi/:tahun', async (req, res) => {
  await ensureRealisasiTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  try {
    const [rows] = await db.query('SELECT * FROM realisasi_apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
    if (rows.length > 0) {
      let parsedData = rows[0].data;
      while (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          break;
        }
      }
      if (!parsedData || typeof parsedData !== 'object') {
        parsedData = defaultRealisasiData;
      }
      return res.json({ tahun, data: parsedData });
    } else {
      return res.json({ tahun, data: defaultRealisasiData });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/realisasi/:tahun', async (req, res) => {
  await ensureRealisasiTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data Realisasi Wajib diisi' });
  }
  try {
    const dataStr = JSON.stringify(data);
    const [existingReal] = await db.query('SELECT id FROM realisasi_apbdes WHERE tahun = ? ORDER BY id DESC LIMIT 1', [tahun]);
    if (existingReal.length > 0) {
      await db.query('UPDATE realisasi_apbdes SET data = ? WHERE id = ?', [dataStr, existingReal[0].id]);
    } else {
      await db.query('INSERT INTO realisasi_apbdes (tahun, data) VALUES (?, ?)', [tahun, dataStr]);
    }
    res.json({ message: `Data Laporan Realisasi tahun ${tahun} berhasil disimpan.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/realisasi/upload', upload.any(), async (req, res) => {
  try {
    const filenames = [];
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) {
      for (const file of files) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const filePath = path.join(uploadDir, filename);
        if (file.buffer) {
          try {
            await sharp(file.buffer).webp({ quality: 80 }).toFile(filePath);
          } catch(e) {
            fs.writeFileSync(filePath, file.buffer);
          }
        }
        filenames.push(filename);
      }
    }
    res.json({ filenames, urls: filenames.map(f => `/uploads/${f}`) });
  } catch (err) {
    console.error('Upload realisasi/gallery error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper ensure rkp_desa table exists
async function ensureRkpTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS rkp_desa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT UNIQUE NOT NULL,
        judul VARCHAR(255) NOT NULL,
        narasi LONGTEXT,
        dokumen LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error creating rkp_desa table:', err);
  }
}

// RKP Attachment Handler

app.post('/api/rkp/upload-doc', uploadDoc.array('documents', 10), (req, res) => {
  try {
    const files = req.files || [];
    const result = files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype
    }));
    res.json({ files: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rkp/:tahun', async (req, res) => {
  await ensureRkpTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  try {
    const [rows] = await db.query('SELECT * FROM rkp_desa WHERE tahun = ?', [tahun]);
    if (rows.length > 0) {
      let parsedDokumen = [];
      try {
        parsedDokumen = JSON.parse(rows[0].dokumen) || [];
      } catch (e) {
        parsedDokumen = [];
      }
      return res.json({
        tahun,
        judul: rows[0].judul || `Rencana Kerja Pemerintah Desa (RKP) Tahun ${tahun}`,
        narasi: rows[0].narasi || '',
        dokumen: parsedDokumen
      });
    } else {
      return res.json({
        tahun,
        judul: `Rencana Kerja Pemerintah Desa (RKP) Tahun ${tahun}`,
        narasi: '',
        dokumen: []
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rkp/:tahun', async (req, res) => {
  await ensureRkpTable();
  const tahun = parseInt(req.params.tahun) || new Date().getFullYear();
  const { judul, narasi, dokumen } = req.body;
  try {
    const dokumenStr = Array.isArray(dokumen) ? JSON.stringify(dokumen) : '[]';
    await db.query(
      `INSERT INTO rkp_desa (tahun, judul, narasi, dokumen) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         judul = VALUES(judul), 
         narasi = VALUES(narasi), 
         dokumen = VALUES(dokumen)`,
      [tahun, judul || `Rencana Kerja Pemerintah Desa (RKP) Tahun ${tahun}`, narasi || '', dokumenStr]
    );
    res.json({ message: `Data RKP Desa tahun ${tahun} berhasil disimpan.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Upload single file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }
    const fileUrl = await processImage(req.file);
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper ensure locations table exists
async function ensureLocationsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        link_street_view TEXT,
        link_rute TEXT,
        foto TEXT,
        galeri LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist on existing table
    try { await db.query('ALTER TABLE locations ADD COLUMN galeri LONGTEXT;'); } catch(e) {}
    try { await db.query('ALTER TABLE locations ADD COLUMN link_street_view TEXT;'); } catch(e) {}
    try { await db.query('ALTER TABLE locations ADD COLUMN link_rute TEXT;'); } catch(e) {}
    try { await db.query('ALTER TABLE locations ADD COLUMN foto TEXT;'); } catch(e) {}

    // Insert default locations if empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM locations');
    if (rows[0].count === 0) {
      const defaultLocations = [
        {
          nama: 'Kantor Desa Curah Tatal',
          deskripsi: 'Pusat pelayanan administrasi dan pemerintahan Desa Curah Tatal, Kecamatan Arjasa, Kabupaten Situbondo.',
          link_street_view: 'https://www.google.com/maps/place/Curah+Tatal,+Kec.+Arjasa,+Kabupaten+Situbondo,+Jawa+Timur/@-7.7790311,114.0774927,3a,75y,7.36h,71.78t/data=!3m7!1e1!3m5!1sMK_dw5fzbtwe2z-vaD339A!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D18.221291667172082%26panoid%3DMK_dw5fzbtwe2z-vaD339A%26yaw%3D7.363238598044637!7i16384!8i8192!4m6!3m5!1s0x2dd6d2fdedcba31f:0xb172edf8f603e68e!8m2!3d-7.7791533!4d114.0785439!16s%2Fg%2F12lnht3wc?entry=tts',
          link_rute: 'https://www.google.com/maps/dir/?api=1&destination=Balai+Desa+Curah+Tata,+Arjasa,+Situbondo',
          foto: '',
          galeri: '[]'
        },
        {
          nama: 'Kumpul Dusun Atas',
          deskripsi: 'Lokasi tempat berkumpul dan kegiatan warga di wilayah Dusun Atas, Desa Curah Tatal.',
          link_street_view: 'https://maps.app.goo.gl/2JQtmRqQpw9eubR59',
          link_rute: 'https://maps.app.goo.gl/2JQtmRqQpw9eubR59',
          foto: '',
          galeri: '[]'
        }
      ];
      for (const loc of defaultLocations) {
        await db.query(
          'INSERT INTO locations (nama, deskripsi, link_street_view, link_rute, foto, galeri) VALUES (?, ?, ?, ?, ?, ?)',
          [loc.nama, loc.deskripsi, loc.link_street_view, loc.link_rute, loc.foto, loc.galeri]
        );
      }
    }
  } catch (err) {
    console.error('Error creating locations table:', err);
  }
}

// API Locations (Peta Desa)
app.get('/api/locations', async (req, res) => {
  await ensureLocationsTable();
  try {
    const [rows] = await db.query('SELECT * FROM locations ORDER BY id ASC');
    const parsedRows = rows.map(r => {
      let galeriParsed = [];
      try { galeriParsed = JSON.parse(r.galeri) || []; } catch (e) { galeriParsed = []; }
      return { ...r, galeri: galeriParsed };
    });
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/locations', async (req, res) => {
  await ensureLocationsTable();
  const { nama, deskripsi, link_street_view, link_rute, foto, galeri } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama lokasi wajib diisi' });

  try {
    const galeriStr = Array.isArray(galeri) ? JSON.stringify(galeri) : '[]';
    const [result] = await db.query(
      'INSERT INTO locations (nama, deskripsi, link_street_view, link_rute, foto, galeri) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, deskripsi || '', link_street_view || '', link_rute || '', foto || '', galeriStr]
    );
    res.json({ id: result.insertId, message: 'Lokasi berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/locations/:id', async (req, res) => {
  await ensureLocationsTable();
  const id = parseInt(req.params.id);
  const { nama, deskripsi, link_street_view, link_rute, foto, galeri } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama lokasi wajib diisi' });

  try {
    const galeriStr = Array.isArray(galeri) ? JSON.stringify(galeri) : '[]';
    await db.query(
      'UPDATE locations SET nama = ?, deskripsi = ?, link_street_view = ?, link_rute = ?, foto = ?, galeri = ? WHERE id = ?',
      [nama, deskripsi || '', link_street_view || '', link_rute || '', foto || '', galeriStr, id]
    );
    res.json({ message: 'Data lokasi berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  await ensureLocationsTable();
  const id = parseInt(req.params.id);
  try {
    await db.query('DELETE FROM locations WHERE id = ?', [id]);
    res.json({ message: 'Lokasi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTE BACKUP & RESTORE (EXPORT & IMPORT TOTAL)
// ==========================================

// 1. Export Data Total (DB Dump JSON + Folder Uploads ke file ZIP)
app.get('/api/backup/export', async (req, res) => {
  try {
    await ensureLocationsTable();
    await ensureRkpTable();
    await ensureRealisasiTable();

    const safeQueryTable = async (tableName) => {
      try {
        const [rows] = await db.query(`SELECT * FROM ${tableName}`);
        return rows || [];
      } catch (e) {
        return [];
      }
    };

    const posts = await safeQueryTable('posts');
    const post_dokumentasi = await safeQueryTable('post_dokumentasi');
    const penduduk = await safeQueryTable('penduduk');
    const settings = await safeQueryTable('settings');
    const apbdes = await safeQueryTable('apbdes');
    const realisasi_apbdes = await safeQueryTable('realisasi_apbdes');
    const rkp_desa = await safeQueryTable('rkp_desa');
    const locations = await safeQueryTable('locations');

    const dumpData = cleanDataObj({
      version: '1.0',
      exported_at: new Date().toISOString(),
      app_name: 'Desa Curah Tatal System Backup',
      tables: {
        posts,
        post_dokumentasi,
        penduduk,
        settings,
        apbdes,
        realisasi_apbdes,
        rkp_desa,
        locations
      }
    });

    const zip = new AdmZip();

    // 1. Tambahkan dump database JSON
    zip.addFile('database_dump.json', Buffer.from(JSON.stringify(dumpData, null, 2)));

    // 2. Tambahkan seluruh berkas media dari folder uploads
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        if (fs.statSync(filePath).isFile()) {
          zip.addLocalFile(filePath, 'uploads');
        }
      });
    }

    const zipBuffer = zip.toBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `backup_curahtatal_${dateStr}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length
    });

    res.send(zipBuffer);
  } catch (err) {
    console.error('Export Backup Error:', err);
    res.status(500).json({ error: 'Gagal mengekspor data backup: ' + err.message });
  }
});

// 2. Import Data Total (Menerima file ZIP, Memulihkan DB & File Uploads)
app.post('/api/backup/import', uploadDoc.single('backupZip'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File backup .zip wajib diunggah' });
  }

  const zipPath = req.file.path;
  let connection;

  try {
    const zip = new AdmZip(zipPath);
    const dumpEntry = zip.getEntry('database_dump.json');

    if (!dumpEntry) {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      return res.status(400).json({ error: 'File ZIP tidak valid (database_dump.json tidak ditemukan)' });
    }

    const dumpText = zip.readAsText(dumpEntry);
    const dump = JSON.parse(dumpText);
    const tables = dump.tables || {};

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Memastikan tabel tersedia
    await ensureLocationsTable();
    await ensureRkpTable();
    await ensureRealisasiTable();

    const formatDateForMySQL = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const cleanUrl = (val) => {
      if (typeof val !== 'string') return val;
      return val.replace(/https?:\/\/[^\/]+\/uploads\//gi, '/uploads/');
    };

    const cleanDataObj = (obj) => {
      if (!obj) return obj;
      if (typeof obj === 'string') return cleanUrl(obj);
      if (Array.isArray(obj)) return obj.map(cleanDataObj);
      if (typeof obj === 'object') {
        const res = {};
        for (const k in obj) {
          res[k] = cleanDataObj(obj[k]);
        }
        return res;
      }
      return obj;
    };

    // --- A. PEMULIHAN DATABASE ---

    // 1. Posts & Post Dokumentasi
    if (Array.isArray(tables.posts)) {
      try { await connection.query('ALTER TABLE posts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;'); } catch (e) {}
      await connection.query('DELETE FROM post_dokumentasi');
      await connection.query('DELETE FROM posts');
      for (const p of tables.posts) {
        await connection.query(
          'INSERT INTO posts (id, kategori, judul, deskripsi, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.kategori, p.judul, p.deskripsi, p.thumbnail || null, formatDateForMySQL(p.created_at), formatDateForMySQL(p.updated_at)]
        );
      }
    }

    if (Array.isArray(tables.post_dokumentasi)) {
      try { await connection.query('ALTER TABLE post_dokumentasi ADD COLUMN image_url VARCHAR(255);'); } catch (e) {}
      for (const pd of tables.post_dokumentasi) {
        const imgUrl = pd.image_url || pd.url || '';
        await connection.query(
          'INSERT INTO post_dokumentasi (id, post_id, image_url) VALUES (?, ?, ?)',
          [pd.id, pd.post_id, imgUrl]
        );
      }
    }

    // 2. Penduduk
    if (Array.isArray(tables.penduduk) && tables.penduduk.length > 0) {
      try { await connection.query('ALTER TABLE penduduk ADD COLUMN umur_data TEXT;'); } catch (e) {}
      try { await connection.query('ALTER TABLE penduduk ADD COLUMN pekerjaan_data TEXT;'); } catch (e) {}
      try { await connection.query('ALTER TABLE penduduk ADD COLUMN pendidikan_data TEXT;'); } catch (e) {}
      try { await connection.query('ALTER TABLE penduduk ADD COLUMN dokumen TEXT;'); } catch (e) {}
      await connection.query('DELETE FROM penduduk');
      for (const pen of tables.penduduk) {
        await connection.query(
          'INSERT INTO penduduk (id, total_penduduk, kepala_keluarga, laki_laki, perempuan, umur_data, pekerjaan_data, dokumen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            pen.id,
            pen.total_penduduk || 0,
            pen.kepala_keluarga || 0,
            pen.laki_laki || 0,
            pen.perempuan || 0,
            typeof pen.umur_data === 'object' ? JSON.stringify(pen.umur_data) : (pen.umur_data || ''),
            typeof pen.pekerjaan_data === 'object' ? JSON.stringify(pen.pekerjaan_data) : (pen.pekerjaan_data || ''),
            typeof pen.dokumen === 'object' ? JSON.stringify(pen.dokumen) : (pen.dokumen || '')
          ]
        );
      }
    }

    // 3. Settings / Profil / Tema
    if (Array.isArray(tables.settings) && tables.settings.length > 0) {
      try { await connection.query('ALTER TABLE settings ADD COLUMN hero_slider TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_visi TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_tagline VARCHAR(255);'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_misi TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_sejarah TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_geografis TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_dusun TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_kades_history TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_perangkat TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_aparat TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_bpd TEXT;'); } catch(e) {}
      try { await connection.query('ALTER TABLE settings ADD COLUMN profil_sarpras TEXT;'); } catch(e) {}

      await connection.query('DELETE FROM settings');
      for (let s of tables.settings) {
        s = cleanDataObj(s);
        await connection.query(
          'INSERT INTO settings (id, theme_color, footer_desc, address, email, contacts_data, profil_visi, profil_tagline, profil_misi, profil_sejarah, profil_geografis, profil_dusun, profil_kades_history, profil_perangkat, profil_aparat, profil_sarpras, hero_slider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            s.id,
            s.theme_color || '#10b981',
            s.footer_desc || '',
            s.address || '',
            s.email || '',
            typeof s.contacts_data === 'object' ? JSON.stringify(s.contacts_data) : (s.contacts_data || '[]'),
            s.profil_visi || '',
            s.profil_tagline || '',
            typeof s.profil_misi === 'object' ? JSON.stringify(s.profil_misi) : (s.profil_misi || '[]'),
            s.profil_sejarah || '',
            typeof s.profil_geografis === 'object' ? JSON.stringify(s.profil_geografis) : (s.profil_geografis || '{}'),
            typeof s.profil_dusun === 'object' ? JSON.stringify(s.profil_dusun) : (s.profil_dusun || '[]'),
            typeof s.profil_kades_history === 'object' ? JSON.stringify(s.profil_kades_history) : (s.profil_kades_history || '[]'),
            typeof s.profil_perangkat === 'object' ? JSON.stringify(s.profil_perangkat) : (s.profil_perangkat || '[]'),
            typeof s.profil_aparat === 'object' ? JSON.stringify(s.profil_aparat) : (s.profil_aparat || '[]'),
            typeof s.profil_sarpras === 'object' ? JSON.stringify(s.profil_sarpras) : (s.profil_sarpras || '{}'),
            typeof s.hero_slider === 'object' ? JSON.stringify(s.hero_slider) : (s.hero_slider || '[]')
          ]
        );
      }
    }

    // 4. APBDES
    if (Array.isArray(tables.apbdes)) {
      try { await connection.query('ALTER TABLE apbdes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE apbdes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;'); } catch (e) {}
      await connection.query('DELETE FROM apbdes');
      for (const a of tables.apbdes) {
        let apData = a.data;
        if (typeof apData === 'string') {
          try { apData = JSON.parse(apData); } catch (e) {}
        }
        apData = cleanDataObj(apData);
        await connection.query(
          'INSERT INTO apbdes (id, tahun, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [a.id, a.tahun, typeof apData === 'object' ? JSON.stringify(apData) : apData, formatDateForMySQL(a.created_at), formatDateForMySQL(a.updated_at)]
        );
      }
    }

    // 5. Realisasi (nama tabel di database: realisasi_apbdes)
    const realisasiList = tables.realisasi_apbdes || tables.realisasi;
    if (Array.isArray(realisasiList)) {
      try { await connection.query('ALTER TABLE realisasi_apbdes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE realisasi_apbdes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;'); } catch (e) {}
      await connection.query('DELETE FROM realisasi_apbdes');
      for (const r of realisasiList) {
        let rData = r.data;
        if (typeof rData === 'string') {
          try { rData = JSON.parse(rData); } catch (e) {}
        }
        rData = cleanDataObj(rData);
        await connection.query(
          'INSERT INTO realisasi_apbdes (id, tahun, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [r.id, r.tahun, typeof rData === 'object' ? JSON.stringify(rData) : rData, formatDateForMySQL(r.created_at), formatDateForMySQL(r.updated_at)]
        );
      }
    }

    // 6. RKP (nama tabel di database: rkp_desa)
    const rkpList = tables.rkp_desa || tables.rkp;
    if (Array.isArray(rkpList)) {
      try { await connection.query('ALTER TABLE rkp_desa ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE rkp_desa ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;'); } catch (e) {}
      await connection.query('DELETE FROM rkp_desa');
      for (const rk of rkpList) {
        let rkDoc = rk.dokumen;
        if (typeof rkDoc === 'string') {
          try { rkDoc = JSON.parse(rkDoc); } catch (e) {}
        }
        rkDoc = cleanDataObj(rkDoc);
        await connection.query(
          'INSERT INTO rkp_desa (id, tahun, judul, narasi, dokumen, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [rk.id, rk.tahun, rk.judul, rk.narasi, typeof rkDoc === 'object' ? JSON.stringify(rkDoc) : rkDoc, formatDateForMySQL(rk.created_at), formatDateForMySQL(rk.updated_at)]
        );
      }
    }

    // 7. Locations (Peta)
    if (Array.isArray(tables.locations)) {
      try { await connection.query('ALTER TABLE locations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE locations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;'); } catch (e) {}
      try { await connection.query('ALTER TABLE locations ADD COLUMN link_street_view TEXT;'); } catch (e) {}
      try { await connection.query('ALTER TABLE locations ADD COLUMN link_rute TEXT;'); } catch (e) {}
      await connection.query('DELETE FROM locations');
      for (const loc of tables.locations) {
        let galeriData = loc.galeri;
        if (typeof galeriData === 'string') {
          try { galeriData = JSON.parse(galeriData); } catch (e) {}
        }
        galeriData = cleanDataObj(galeriData);
        await connection.query(
          'INSERT INTO locations (id, nama, deskripsi, link_street_view, link_rute, foto, galeri) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            loc.id,
            loc.nama,
            loc.deskripsi || '',
            loc.link_street_view || '',
            loc.link_rute || '',
            cleanUrl(loc.foto) || '',
            typeof galeriData === 'object' ? JSON.stringify(galeriData) : (galeriData || '[]')
          ]
        );
      }
    }

    await connection.commit();

    // --- B. PEMULIHAN BERKAS MEDIA (UPLOADS) ---
    const entries = zip.getEntries();
    entries.forEach(entry => {
      if (!entry.isDirectory && (entry.entryName.startsWith('uploads/') || entry.entryName.startsWith('uploads\\'))) {
        const fileName = path.basename(entry.entryName);
        if (fileName && fileName !== 'database_dump.json') {
          const targetPath = path.join(uploadDir, fileName);
          fs.writeFileSync(targetPath, entry.getData());
        }
      }
    });

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    res.json({ message: 'Seluruh data dan berkas media desa berhasil dipulihkan secara total!' });

  } catch (err) {
    if (connection) await connection.rollback();
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    console.error('Import Backup Error:', err);
    res.status(500).json({ error: 'Gagal mengimpor data backup: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================
// API TITIK LOKASI PETA DESA (/api/locations)
// =====================================

app.get('/api/locations', async (req, res) => {
  try {
    await ensureLocationsTable();
    const [rows] = await db.query('SELECT * FROM locations ORDER BY id ASC');
    const formatted = rows.map(r => {
      let galeri = r.galeri;
      while (typeof galeri === 'string') {
        try { galeri = JSON.parse(galeri); } catch(e) { break; }
      }
      return {
        ...r,
        galeri: Array.isArray(galeri) ? galeri : []
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/locations', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) console.error('Multer post location error:', err);
    next();
  });
}, async (req, res) => {
  try {
    await ensureLocationsTable();
    const { nama, deskripsi, link_street_view, link_rute, foto, galeri } = req.body;
    let mainFoto = foto || '';

    const files = req.files || [];
    const fotoFiles = files.filter(f => f.fieldname === 'fotoFile' || f.fieldname === 'foto');
    const galeriFiles = files.filter(f => f.fieldname === 'galeriFiles' || f.fieldname === 'galeri' || f.fieldname === 'images' || f.fieldname === 'dokumentasi');

    if (fotoFiles.length > 0) {
      const imgName = await processImage(fotoFiles[0]);
      mainFoto = `/uploads/${imgName}`;
    }

    const galeriList = [];
    if (galeriFiles.length > 0) {
      for (const file of galeriFiles) {
        const imgName = await processImage(file);
        galeriList.push(`/uploads/${imgName}`);
      }
    }

    if (galeri) {
      try {
        const parsed = typeof galeri === 'string' ? JSON.parse(galeri) : galeri;
        if (Array.isArray(parsed)) {
          parsed.forEach(u => { if (u && !galeriList.includes(u)) galeriList.push(u); });
        }
      } catch(e) {}
    }

    const galeriStr = JSON.stringify(galeriList);
    try {
      const [result] = await db.query(
        'INSERT INTO locations (nama, deskripsi, link_street_view, link_rute, foto, galeri) VALUES (?, ?, ?, ?, ?, ?)',
        [nama || '', deskripsi || '', link_street_view || '', link_rute || '', mainFoto, galeriStr]
      );
      res.json({ id: result.insertId, message: 'Lokasi berhasil ditambahkan.' });
    } catch (sqlErr) {
      if (sqlErr.code === 'ER_BAD_FIELD_ERROR' || (sqlErr.message && sqlErr.message.includes('Unknown column'))) {
        try { await db.query('ALTER TABLE locations ADD COLUMN galeri LONGTEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN link_street_view TEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN link_rute TEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN foto TEXT;'); } catch(e) {}
        const [result] = await db.query(
          'INSERT INTO locations (nama, deskripsi, link_street_view, link_rute, foto, galeri) VALUES (?, ?, ?, ?, ?, ?)',
          [nama || '', deskripsi || '', link_street_view || '', link_rute || '', mainFoto, galeriStr]
        );
        res.json({ id: result.insertId, message: 'Lokasi berhasil ditambahkan.' });
      } else {
        throw sqlErr;
      }
    }
  } catch (err) {
    console.error('Post location error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/locations/:id', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) console.error('Multer put location error:', err);
    next();
  });
}, async (req, res) => {
  try {
    await ensureLocationsTable();
    const { id } = req.params;
    const { nama, deskripsi, link_street_view, link_rute, foto, existingGaleri } = req.body;

    let mainFoto = foto || '';
    const files = req.files || [];
    const fotoFiles = files.filter(f => f.fieldname === 'fotoFile' || f.fieldname === 'foto');
    const galeriFiles = files.filter(f => f.fieldname === 'galeriFiles' || f.fieldname === 'galeri' || f.fieldname === 'images' || f.fieldname === 'dokumentasi');

    if (fotoFiles.length > 0) {
      const imgName = await processImage(fotoFiles[0]);
      mainFoto = `/uploads/${imgName}`;
    }

    let currentGaleri = [];
    if (existingGaleri) {
      try {
        currentGaleri = typeof existingGaleri === 'string' ? JSON.parse(existingGaleri) : (Array.isArray(existingGaleri) ? existingGaleri : []);
      } catch(e) { currentGaleri = []; }
    }

    if (galeriFiles.length > 0) {
      for (const file of galeriFiles) {
        const imgName = await processImage(file);
        currentGaleri.push(`/uploads/${imgName}`);
      }
    }

    const galeriStr = JSON.stringify(currentGaleri);
    try {
      await db.query(
        'UPDATE locations SET nama=?, deskripsi=?, link_street_view=?, link_rute=?, foto=?, galeri=? WHERE id=?',
        [nama || '', deskripsi || '', link_street_view || '', link_rute || '', mainFoto, galeriStr, id]
      );
    } catch (sqlErr) {
      if (sqlErr.code === 'ER_BAD_FIELD_ERROR' || (sqlErr.message && sqlErr.message.includes('Unknown column'))) {
        try { await db.query('ALTER TABLE locations ADD COLUMN galeri LONGTEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN link_street_view TEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN link_rute TEXT;'); } catch(e) {}
        try { await db.query('ALTER TABLE locations ADD COLUMN foto TEXT;'); } catch(e) {}
        await db.query(
          'UPDATE locations SET nama=?, deskripsi=?, link_street_view=?, link_rute=?, foto=?, galeri=? WHERE id=?',
          [nama || '', deskripsi || '', link_street_view || '', link_rute || '', mainFoto, galeriStr, id]
        );
      } else {
        throw sqlErr;
      }
    }
    res.json({ message: 'Lokasi berhasil diperbarui.' });
  } catch (err) {
    console.error('Put location error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    await ensureLocationsTable();
    const { id } = req.params;
    await db.query('DELETE FROM locations WHERE id = ?', [id]);
    res.json({ message: 'Lokasi berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend API berjalan di http://localhost:${port}`);
});
