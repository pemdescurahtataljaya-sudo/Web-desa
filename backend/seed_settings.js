const db = require('./db');

const defaultVisi = "Gotong Royong Membangun Desa Curah Tatal Sejahtera dan Berdaya (Curah Tatal JAYA)";
const defaultTagline = "#CurahTatalJAYA";

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

const defaultGeografis = {
  deskripsi: "Desa Curah Tatal terletak di Kecamatan Arjasa, Kabupaten Situbondo dengan luas wilayah administrasi 42,56 km² (15.663,1 Ha). Desa ini berada di kawasan dataran tinggi perbukitan dengan ketinggian rata-rata 20,5 mdpl.\n\nMemiliki tanah subur yang didominasi oleh lahan pertanian & perkebunan (padi, jagung, tebu, kopi, jahe) dengan sistem pengairan irigasi dan tadah hujan.",
  luas_wilayah: "42,56 km²",
  luas_hektar: "15.663,1 Ha",
  ketinggian: "20,5 mdpl",
  topografi: "Dataran Tinggi / Perbukitan",
  jarak_kecamatan: "7 - 11 KM",
  jarak_kabupaten: "19 - 25 KM",
  batas_utara: "Desa Jatisari & Desa Kandang (Kec. Arjasa)",
  batas_timur: "Desa Jatisari & Desa Kayumas (Kec. Arjasa)",
  batas_selatan: "Desa Kayumas & Kp. Waru (Wisata Ijen, Bondowoso)",
  batas_barat: "Desa Bercak Asri, Desa Kladi, & Desa Solor (Bondowoso)"
};

const defaultDusun = [
  { nama: "Krajan", rt: "4 RT", kasun: "MISWANDI" },
  { nama: "Barutengah", rt: "2 RT", kasun: "MOH. YANTO" },
  { nama: "Cangkring", rt: "3 RT", kasun: "KUSWANDI" },
  { nama: "Dergung", rt: "3 RT", kasun: "ANSORI" },
  { nama: "Telagasari", rt: "3 RT", kasun: "AINUR RIDWAN" },
  { nama: "Mindi", rt: "2 RT", kasun: "RUKYANTO" },
  { nama: "Cobbuk", rt: "2 RT", kasun: "ARTODI" },
  { nama: "Batellok", rt: "2 RT", kasun: "-" },
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

const defaultSarpras = {
  jalan_hotmix: "24 Km",
  jalan_aspal: "6,55 Km",
  jalan_makadam: "15 Km",
  jalan_paving: "14,8 Km",
  poskesdes: "2 Unit Gedung",
  posyandu: "14 Unit Posyandu",
  tenaga_kesehatan: "3 Bidan & 74 Kader",
  sekolah: "14 Sekolah (SD/SMP/PAUD)",
  tempat_ibadah: "15 Masjid, 44 Mushalla",
  listrik_pln: "1.900 Rumah Tangga"
};

const defaultHeroSlider = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80'
];

async function seed() {
  try {
    console.log("Ensuring database columns exist...");
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_visi TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_tagline VARCHAR(255)'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_misi TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_sejarah TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_geografis TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_dusun TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_kades_history TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_perangkat TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_aparat TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN profil_sarpras TEXT'); } catch(e) {}
    try { await db.query('ALTER TABLE settings ADD COLUMN hero_slider TEXT'); } catch(e) {}

    await db.query('INSERT IGNORE INTO settings (id, theme_color) VALUES (1, "#10b981")');

    await db.query(
      `UPDATE settings SET 
        profil_visi = ?, 
        profil_tagline = ?,
        profil_misi = ?, 
        profil_sejarah = ?, 
        profil_geografis = ?, 
        profil_dusun = ?, 
        profil_kades_history = ?, 
        profil_perangkat = ?,
        profil_aparat = ?,
        profil_sarpras = ?
       WHERE id = 1`,
      [
        defaultVisi,
        defaultTagline,
        JSON.stringify(defaultMisi),
        defaultSejarah,
        JSON.stringify(defaultGeografis),
        JSON.stringify(defaultDusun),
        JSON.stringify(defaultKadesHistory),
        JSON.stringify(defaultPerangkat),
        JSON.stringify(defaultAparat),
        JSON.stringify(defaultSarpras)
      ]
    );

    console.log("SEED_SUCCESS: Settings table populated with profil_aparat!");
    process.exit(0);
  } catch (err) {
    console.error("SEED_ERROR:", err);
    process.exit(1);
  }
}

seed();
