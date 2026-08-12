import { useState, useEffect } from 'react';
import { History, Map as MapIcon, ShieldCheck, Users, Building, Landmark, ChevronRight, Award, Truck, HeartPulse, GraduationCap, Home, Phone, Mail, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import './Profil.css';
import TypewriterText from '../components/TypewriterText';
import { getUploadUrl } from '../utils/url';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

const parseSafeArray = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return fallback;
};

const parseSafeObj = (val) => {
  let result = {};
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    result = { ...val };
  } else if (typeof val === 'string' && val.trim().startsWith('{')) {
    try {
      result = JSON.parse(val);
    } catch(e) {}
  } else if (typeof val === 'string') {
    result = { deskripsi: val };
  }

  if (typeof result.deskripsi === 'object' && result.deskripsi !== null) {
    result.deskripsi = typeof result.deskripsi.deskripsi === 'string' ? result.deskripsi.deskripsi : '';
  }
  if (!result.deskripsi || typeof result.deskripsi !== 'string' || result.deskripsi.includes('[object Object]')) {
    result.deskripsi = "Desa Curah Tatal terletak di Kecamatan Arjasa, Kabupaten Situbondo dengan luas wilayah administrasi 42,56 km² (15.663,1 Ha). Desa ini berada di kawasan dataran tinggi perbukitan dengan ketinggian rata-rata 20,5 mdpl.\n\nMemiliki tanah subur yang didominasi oleh lahan pertanian & perkebunan (padi, jagung, tebu, kopi, jahe) dengan sistem pengairan irigasi dan tadah hujan.";
  }
  return result;
};

const Profil = () => {
  const [profilData, setProfilData] = useState(null);
  const [orgZoom, setOrgZoom] = useState(1);
  const [touchState, setTouchState] = useState({ initialDist: 0, initialZoom: 1 });

  const handleZoomIn = () => setOrgZoom(prev => Math.min(2.2, parseFloat((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setOrgZoom(prev => Math.max(0.4, parseFloat((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setOrgZoom(1);

  // Touch Pinch Gesture (2 Jari di HP)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchState({ initialDist: dist, initialZoom: orgZoom });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchState.initialDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchState.initialDist;
      const targetZoom = Math.min(2.2, Math.max(0.4, parseFloat((touchState.initialZoom * factor).toFixed(2))));
      setOrgZoom(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    setTouchState({ initialDist: 0, initialZoom: 1 });
  };

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        const data = await res.json();
        setProfilData(data);
      } catch (err) {
        console.error('Error fetching profil data:', err);
      }
    };
    fetchProfil();
    window.addEventListener('focus', fetchProfil);
    const intervalId = setInterval(fetchProfil, 30000);
    return () => {
      window.removeEventListener('focus', fetchProfil);
      clearInterval(intervalId);
    };
  }, []);

  const misiList = parseSafeArray(profilData?.profil_misi);
  const dusunList = parseSafeArray(profilData?.profil_dusun);
  const kadesList = parseSafeArray(profilData?.profil_kades_history, defaultKadesHistory);
  const perangkatList = parseSafeArray(profilData?.profil_perangkat);
  const geoObj = parseSafeObj(profilData?.profil_geografis);

  const sarprasObj = parseSafeObj(profilData?.profil_sarpras);

  return (
    <div className="profil-page">
      {/* HEADER HERO */}
      <div className="profil-header">
        <div className="container">
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', backdropFilter: 'blur(4px)' }}>
            Kecamatan Arjasa • Kabupaten Situbondo
          </span>
          <h1><TypewriterText text="Profil Desa Curah Tatal" /></h1>
          <p>Mengenal Lebih Dekat Sejarah, Visi Misi, Wilayah Dusun, Perangkat Desa & Potensi Desa Kami</p>
        </div>
      </div>

      <div className="container profil-content">

        {/* 1. VISI & MISI DESA */}
        <section className="profil-section glass fade-in" style={{ borderLeft: '6px solid var(--primary-color)' }}>
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Visi & Misi Pembangunan Desa</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Arah & Komitmen Pelayanan Pemerintah Desa Curah Tatal</span>
            </div>
          </div>

          <div className="visi-misi-grid mt-4">
            <div className="visi" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={20} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Visi Utama</h3>
              </div>
              <p style={{ fontSize: '1.15rem', fontStyle: 'italic', fontWeight: '700', color: '#0f172a', lineHeight: '1.7', margin: 0 }}>
                "{profilData?.profil_visi || 'Gotong Royong Membangun Desa Curah Tatal Sejahtera dan Berdaya (Curah Tatal JAYA)'}"
              </p>
              <div style={{ marginTop: '16px', display: 'inline-block', background: 'var(--primary-color)', color: 'var(--text-on-primary, #ffffff)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800' }}>
                {profilData?.profil_tagline || '#CurahTatalJAYA'}
              </div>
            </div>

            <div className="misi">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={20} style={{ color: 'var(--primary-color)' }} /> Poin Misi Strategis
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {misiList.length > 0 ? (
                  misiList.map((misi, idx) => (
                    <li key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6' }}>
                      <span style={{ background: 'var(--primary-color)', color: 'var(--text-on-primary, #ffffff)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>
                        {idx + 1}
                      </span>
                      <span>{misi}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>Memuat Misi Desa...</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* 2. SEJARAH DESA & TIMELINE KEPEMIMPINAN */}
        <section className="profil-section fade-in delay-1">
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <History size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Sejarah & Asal Usul Nama Desa</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kisah Perjalanan Pembukaan Hutan 1821 Hingga Kepemimpinan Desa Saat Ini</span>
            </div>
          </div>

          <div style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.85', marginBottom: '30px' }}>
            {typeof profilData?.profil_sejarah === 'string' && profilData.profil_sejarah.trim() !== '' ? (
              profilData.profil_sejarah.split('\n').map((paragraph, idx) => (
                <p key={idx} style={{ marginBottom: '14px' }}>{paragraph}</p>
              ))
            ) : (
              <p>Sekitar tahun 1821 daerah ini masih berupa hutan belukar. Pembuka hutan pertama bernama Kembeng Pote asal Madura bersama 6 tokoh lainnya...</p>
            )}
          </div>

          {/* TIMELINE KEPEMIMPINAN KADES */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={20} style={{ color: 'var(--primary-color)' }} /> Sejarah Kepemimpinan (Urutan Kepala Desa)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {kadesList.map((item, idx) => (
                <div key={idx} style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: idx === kadesList.length - 1 ? 'var(--primary-color)' : '#e2e8f0', color: idx === kadesList.length - 1 ? 'var(--text-on-primary, #ffffff)' : '#475569', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{item.kades}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Periode: {item.periode}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. KONDISI GEOGRAFIS, BATAS WILAYAH & ORBITASI */}
        <section className="profil-section fade-in delay-2">
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapIcon size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Kondisi Geografis & Batas Wilayah</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Letak Administrasi, Topografi Dataran Tinggi & Orbitasi Jarak</span>
            </div>
          </div>

          {/* STATS BADGES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Luas Wilayah</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{geoObj.luas_wilayah || '42,56 km²'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>({geoObj.luas_hektar || '15.663,1 Ha'})</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Ketinggian</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{geoObj.ketinggian || '20,5 mdpl'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{geoObj.topografi || 'Dataran Tinggi / Perbukitan'}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Jarak ke Kecamatan</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{geoObj.jarak_kecamatan || '7 - 11 KM'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Kecamatan Arjasa</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Jarak ke Kabupaten</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{geoObj.jarak_kabupaten || '19 - 25 KM'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Kabupaten Situbondo</div>
            </div>
          </div>

          <div style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.8', marginBottom: '25px' }}>
            {typeof geoObj.deskripsi === 'string' && geoObj.deskripsi.trim() !== '' ? (
              geoObj.deskripsi.split('\n').map((paragraph, idx) => (
                <p key={idx} style={{ marginBottom: '12px' }}>{paragraph}</p>
              ))
            ) : (
              <p>Desa Curah Tatal terletak di Kecamatan Arjasa, Kabupaten Situbondo...</p>
            )}
          </div>

          {/* BATAS WILAYAH GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'white', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>SEBELAH UTARA</span>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>{geoObj.batas_utara || 'Desa Jatisari & Desa Kandang'}</div>
            </div>
            <div style={{ background: 'white', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>SEBELAH TIMUR</span>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>{geoObj.batas_timur || 'Desa Jatisari & Desa Kayumas'}</div>
            </div>
            <div style={{ background: 'white', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>SEBELAH SELATAN</span>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>{geoObj.batas_selatan || 'Desa Kayumas & Kp. Waru (Ijen)'}</div>
            </div>
            <div style={{ background: 'white', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>SEBELAH BARAT</span>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>{geoObj.batas_barat || 'Desa Bercak Asri, Kladi, Solor'}</div>
            </div>
          </div>
        </section>

        {/* 4. WILAYAH DUSUN (10 DUSUN GRID) */}
        <section className="profil-section fade-in">
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>10 Wilayah Dusun & Kepala Dusun</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Pembagian Wilayah Administrasi Pemerintahan Desa Curah Tatal (10 Dusun, 10 RW, 25 RT)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {dusunList.map((dusun, idx) => {
              const isObj = typeof dusun === 'object' && dusun !== null;
              const namaDusun = isObj ? dusun.nama : dusun;
              const rtInfo = isObj && dusun.rt ? dusun.rt : 'Wilayah RT';
              const kasunNama = isObj && dusun.kasun ? dusun.kasun : '-';

              return (
                <div key={idx} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ background: 'var(--primary-color)', color: 'var(--text-on-primary, #ffffff)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Dusun {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>{rtInfo}</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                    Dusun {namaDusun}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                    <Users size={15} style={{ color: 'var(--primary-color)' }} />
                    <span>Kepala Dusun: <strong style={{ color: '#0f172a' }}>{kasunNama}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. STRUKTUR PERANGKAT DESA */}
        <section className="profil-section fade-in">
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Struktur Organisasi Pemerintah Desa</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Bagan Hirarki Pemerintahan Desa Curah Tatal Kecamatan Arjasa</span>
            </div>
          </div>

          {/* CONTROL BAR ZOOM ORGANIGRAM */}
          <div className="org-zoom-bar">
            <div className="org-zoom-hint">
              💡 <b>Petunjuk HP:</b> Cubit 2 jari (pinch zoom) atau tekan tombol zoom
            </div>

            <div className="org-zoom-buttons">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={orgZoom <= 0.4}
                className="zoom-btn"
                title="Perkecil Ukuran (Zoom Out)"
              >
                <ZoomOut size={15} /> −
              </button>

              <span className="zoom-badge">
                {Math.round(orgZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={orgZoom >= 2.2}
                className="zoom-btn"
                title="Perbesar Ukuran (Zoom In)"
              >
                <ZoomIn size={15} /> +
              </button>

              {orgZoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="reset-btn"
                  title="Reset 100%"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {(() => {
            const getPerangkat = (jabatanKey, defaultNama, defaultStaf = '') => {
              const found = perangkatList.find(p => p.jabatan && p.jabatan.toLowerCase().includes(jabatanKey.toLowerCase()));
              if (!found) {
                return { nama: defaultNama, jabatan: jabatanKey, staf: defaultStaf };
              }
              return {
                nama: found.nama !== undefined ? found.nama : defaultNama,
                jabatan: found.jabatan || jabatanKey,
                staf: found.staf !== undefined ? found.staf : defaultStaf
              };
            };

            const kades = getPerangkat('Kepala Desa', 'SUSWANTO, S.Sos.');
            const sekdes = getPerangkat('Sekretaris Desa', 'SUPANDI, S.Pd');
            
            const kasiPem = getPerangkat('Pemerintahan', 'JAMILULLOH, S.Pd.I', 'YUDA');
            const kasiKesra = getPerangkat('Kesejahteraan', 'ANDREYAN', '');
            const kasiPel = getPerangkat('Pelayanan', 'VERA SUCI IRMAWATI', 'PUTRI');
            
            const kaurTu = getPerangkat('Tata Usaha', 'SAYYI WAKI', '');
            const kaurKeu = getPerangkat('Keuangan', 'HALIFA', '');
            const kaurRen = getPerangkat('Perencanaan', 'YONGKI MARDIWINATA', 'YOGA');

            return (
              <div 
                className="org-chart-wrapper" 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '30px' }}
              >
                <div 
                  className="org-tree"
                  style={{
                    zoom: orgZoom,
                    WebkitZoom: orgZoom,
                    minWidth: `${Math.round(960 * Math.max(0.6, orgZoom))}px`,
                    transformOrigin: 'top center',
                    transition: 'all 0.2s ease-out'
                  }}
                >

                  {/* 1. KEPALA DESA */}
                  <div className="org-card-green" style={{ minWidth: '240px', padding: '16px 24px', zIndex: 2 }}>
                    <div className="org-card-name" style={{ fontSize: '1.15rem' }}>{kades.nama}</div>
                    <div className="org-card-title">{kades.jabatan}</div>
                  </div>

                  {/* 2. SEKDES BRANCH CONTAINER (SEAMLESS FLUSH LINES) */}
                  <div style={{ position: 'relative', width: '100%', height: '110px' }}>
                    {/* Main vertical line straight down center (full height 110px) */}
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', background: '#475569', transform: 'translateX(-50%)' }}></div>
                    
                    {/* Horizontal line extending right to Sekdes */}
                    <div style={{ position: 'absolute', left: '50%', top: '30px', width: '180px', height: '3px', background: '#475569' }}></div>
                    
                    {/* Vertical line dropping to Sekdes card */}
                    <div style={{ position: 'absolute', left: 'calc(50% + 180px)', top: '30px', height: '20px', width: '3px', background: '#475569' }}></div>
                    
                    {/* Sekdes Card */}
                    <div style={{ position: 'absolute', left: 'calc(50% + 180px)', top: '50px', transform: 'translateX(-50%)', zIndex: 3 }}>
                      <div className="org-card-green" style={{ minWidth: '210px', padding: '12px 20px' }}>
                        <div className="org-card-name" style={{ fontSize: '1.05rem' }}>{sekdes.nama}</div>
                        <div className="org-card-title">{sekdes.jabatan}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. UNDER SEKDES CONNECTOR */}
                  <div style={{ position: 'relative', width: '100%', height: '40px' }}>
                    {/* Center main line continuing down */}
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', background: '#475569', transform: 'translateX(-50%)' }}></div>
                    
                    {/* Sekdes vertical drop line connecting from Sekdes card bottom to horizontal bar */}
                    <div style={{ position: 'absolute', left: 'calc(50% + 180px)', top: 0, bottom: 0, width: '3px', background: '#475569' }}></div>
                  </div>

                  {/* 4. MAIN HORIZONTAL CONNECTOR BAR FOR 6 KASI & KAUR */}
                  <div style={{ width: '95%', height: '3px', background: '#475569' }}></div>

                  {/* 6 Vertical Drop Lines */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', width: '95%', height: '25px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} style={{ width: '3px', height: '100%', background: '#475569', margin: '0 auto' }}></div>
                    ))}
                  </div>

                  {/* 5. 6 KASI & KAUR CARDS + STAF BRANCHES */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', width: '100%', textAlign: 'center' }}>
                    {/* KASI PEMERINTAHAN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kasiPem.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kasiPem.jabatan}</div>
                      </div>
                      {kasiPem.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kasiPem.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf Pemerintahan</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* KASI KESEJAHTERAAN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kasiKesra.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kasiKesra.jabatan}</div>
                      </div>
                      {kasiKesra.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kasiKesra.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf Kesejahteraan</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* KASI PELAYANAN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kasiPel.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kasiPel.jabatan}</div>
                      </div>
                      {kasiPel.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kasiPel.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf Pelayanan</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* KAUR TU / UMUM */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kaurTu.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kaurTu.jabatan}</div>
                      </div>
                      {kaurTu.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kaurTu.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf TU & Umum</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* KAUR KEUANGAN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kaurKeu.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kaurKeu.jabatan}</div>
                      </div>
                      {kaurKeu.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kaurKeu.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf Keuangan</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* KAUR PERENCANAAN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-card-green" style={{ width: '100%', padding: '10px 6px' }}>
                        <div className="org-card-name" style={{ fontSize: '0.82rem' }}>{kaurRen.nama}</div>
                        <div className="org-card-title" style={{ fontSize: '0.72rem' }}>{kaurRen.jabatan}</div>
                      </div>
                      {kaurRen.staf && (
                        <>
                          <div style={{ width: '3px', height: '20px', background: '#475569' }}></div>
                          <div className="org-card-staf" style={{ width: '95%', padding: '8px 4px' }}>
                            <div className="org-card-name" style={{ fontSize: '0.8rem' }}>{kaurRen.staf}</div>
                            <div className="org-card-title" style={{ fontSize: '0.7rem' }}>Staf Perencanaan</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 6. CONNECTOR DOWN TO 10 KEPALA DUSUN */}
                  <div style={{ width: '3px', height: '35px', background: '#475569', marginTop: '15px' }}></div>
                  <div style={{ width: '92%', height: '3px', background: '#475569' }}></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', width: '92%', height: '20px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ width: '3px', height: '100%', background: '#475569', margin: '0 auto' }}></div>
                    ))}
                  </div>

                  {/* 7. 10 KEPALA DUSUN CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', width: '100%', marginTop: '5px' }}>
                    {dusunList.map((dusun, idx) => {
                      const isObj = typeof dusun === 'object' && dusun !== null;
                      const namaDusun = isObj ? dusun.nama : dusun;
                      const kasunNama = isObj && dusun.kasun ? dusun.kasun : '-';

                      return (
                        <div key={idx} className="org-card-green" style={{ padding: '10px 6px', textAlign: 'center' }}>
                          <div className="org-card-name" style={{ fontSize: '0.85rem' }}>{kasunNama}</div>
                          <div className="org-card-title" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>Kadus {namaDusun}</div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })()}
        </section>

        {/* 6. APARAT PEMERINTAH DESA (KARTU FOTO 3x4, WA & EMAIL) */}
        {(() => {
          const aparatList = parseSafeArray(profilData?.profil_aparat);
          if (aparatList.length === 0) return null;

          return (
            <section className="profil-section fade-in">
              <div className="section-title">
                <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Pemerintah Desa</h2>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Aparatur & Pelayanan Pemerintah Desa Curah Tatal</span>
                </div>
              </div>

              <div className="aparat-grid">
                {aparatList.map((item, idx) => {
                  const waNumber = item.wa ? item.wa.replace(/[^0-9]/g, '') : '';
                  const waUrl = waNumber ? `https://wa.me/${waNumber}` : null;
                  const emailUrl = item.email ? `mailto:${item.email}` : null;

                  return (
                    <div key={idx} className="aparat-card">
                      {/* FOTO 3:4 PORTRAIT CONTAINER */}
                      <div className="aparat-foto-container">
                        {item.foto ? (
                          <img src={getUploadUrl(item.foto)} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                            <Users size={32} />
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', marginTop: '4px' }}>Foto 3x4</span>
                          </div>
                        )}
                      </div>

                      {/* NAMA & JABATAN */}
                      <h4 className="aparat-nama">
                        {item.nama}
                      </h4>
                      <div className="aparat-jabatan">
                        {item.jabatan}
                      </div>

                      {/* ACTION BUTTONS (WA & EMAIL) */}
                      <div className="aparat-actions">
                        {waUrl ? (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title={`Chat WhatsApp (${item.wa})`}
                            className="aparat-btn wa-btn"
                          >
                            <Phone size={16} />
                          </a>
                        ) : (
                          <div className="aparat-btn disabled-btn" title="No. WA tidak tersedia">
                            <Phone size={16} />
                          </div>
                        )}

                        {emailUrl ? (
                          <a 
                            href={emailUrl} 
                            title={`Kirim Email (${item.email})`}
                            className="aparat-btn email-btn"
                          >
                            <Mail size={16} />
                          </a>
                        ) : (
                          <div className="aparat-btn disabled-btn" title="Email tidak tersedia">
                            <Mail size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 7. SARANA, PRASARANA & POTENSI DESA */}
        <section className="profil-section fade-in">
          <div className="section-title">
            <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={22} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Sarana, Prasarana & Fasilitas Desa</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Fasilitas Kesehatan, Pendidikan, Keagamaan & Akses Jalan Desa</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* JALAN DESA */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} style={{ color: 'var(--primary-color)' }} /> Infrastruktur Jalan
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jalan Hotmix:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.jalan_hotmix || '24 Km'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jalan Aspal:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.jalan_aspal || '6,55 Km'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jalan Makadam:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.jalan_makadam || '15 Km'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jalan Tanah / Paving:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.jalan_paving || '14,8 Km'}</strong></li>
              </ul>
            </div>

            {/* KESEHATAN */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={18} style={{ color: '#dc2626' }} /> Layanan Kesehatan
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Poskesdes:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.poskesdes || '2 Unit Gedung'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Posyandu:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.posyandu || '14 Unit Posyandu'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tenaga Kesehatan:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.tenaga_kesehatan || '3 Bidan & 74 Kader'}</strong></li>
              </ul>
            </div>

            {/* PENDIDIKAN & RELIGI */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} style={{ color: '#2563eb' }} /> Pendidikan & Keagamaan
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sekolah SD / SMP / PAUD:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.sekolah || '14 Sekolah'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Masjid & Mushalla:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.tempat_ibadah || '15 Masjid, 44 Mushalla'}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Jaringan Listrik PLN:</span><strong style={{ color: '#0f172a' }}>{sarprasObj.listrik_pln || '1.900 Rumah Tangga'}</strong></li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Profil;
