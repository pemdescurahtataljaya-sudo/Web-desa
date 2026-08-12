import React, { useState, useEffect, useMemo } from 'react';
import { Users, CreditCard, BarChart2, CheckSquare, Calendar, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Download, Image as ImageIcon, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import DataDesaPage from './DataDesaPage';
import './InfografisPage.css';
import TypewriterText from '../components/TypewriterText';
import { getUploadUrl } from '../utils/url';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const InfografisPage = () => {
  const [activeTab, setActiveTab] = useState('penduduk');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isFetchingApbdes, setIsFetchingApbdes] = useState(false);
  const [pendudukData, setPendudukData] = useState({
    total_penduduk: 8575,
    kepala_keluarga: 3419,
    laki_laki: 4148,
    perempuan: 4427,
    umur_data: {
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
    },
    pekerjaan_data: [
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
    ],
    pendidikan_data: [
      { tingkat: 'Tamat SD / Sederajat', jumlah: 2751 },
      { tingkat: 'Tamat SMP / Sederajat', jumlah: 905 },
      { tingkat: 'Tamat SMA / Sederajat', jumlah: 323 },
      { tingkat: 'Tamat S-1 / Sederajat', jumlah: 53 },
      { tingkat: 'Tamat D-3 / Sederajat', jumlah: 4 },
      { tingkat: 'Tamat S-2 / Sederajat', jumlah: 1 },
      { tingkat: 'Tidak / Belum Tamat SD', jumlah: 643 },
      { tingkat: 'Belum Sekolah (3-6 thn)', jumlah: 3895 }
    ]
  });

  // APBDes State & Year Range (2024 to Current Year + 1)
  const [apbdesYear, setApbdesYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: Math.max(1, (currentYear + 1) - 2024 + 1) }, (_, i) => 2024 + i).reverse();
  const [apbdesData, setApbdesData] = useState({
    pendapatan: [],
    belanja: [],
    pembiayaan: []
  });

  // Realisasi APBDes State
  const [realisasiYear, setRealisasiYear] = useState(new Date().getFullYear());
  const [realisasiData, setRealisasiData] = useState({
    pendapatan: [],
    belanja: [],
    pembiayaan: [],
    dokumentasi: []
  });
  const [isFetchingRealisasi, setIsFetchingRealisasi] = useState(false);

  // RKP State
  const [rkpYear, setRkpYear] = useState(new Date().getFullYear());
  const [rkpData, setRkpData] = useState({
    tahun: new Date().getFullYear(),
    judul: '',
    narasi: '',
    dokumen: []
  });
  const [isFetchingRkp, setIsFetchingRkp] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (activeTab === 'penduduk') {
      fetchPenduduk();
      const handleFocus = () => fetchPenduduk();
      window.addEventListener('focus', handleFocus);
      const intervalId = setInterval(handleFocus, 30000);
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    } else if (activeTab === 'apbdes') {
      fetchApbdes(apbdesYear, true);
      const handleFocus = () => fetchApbdes(apbdesYear, false);
      window.addEventListener('focus', handleFocus);
      const intervalId = setInterval(handleFocus, 30000);
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    } else if (activeTab === 'realisasi') {
      fetchRealisasi(realisasiYear, true);
      const handleFocus = () => fetchRealisasi(realisasiYear, false);
      window.addEventListener('focus', handleFocus);
      const intervalId = setInterval(handleFocus, 30000);
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    } else if (activeTab === 'rkp') {
      fetchRkp(rkpYear, true);
      const handleFocus = () => fetchRkp(rkpYear, false);
      window.addEventListener('focus', handleFocus);
      const intervalId = setInterval(handleFocus, 30000);
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    }
  }, [activeTab, apbdesYear, realisasiYear, rkpYear]);

  const fetchPenduduk = async () => {
    try {
      const response = await fetch(`${API_URL}/penduduk`);
      const data = await response.json();
      if (data) {
        setPendudukData(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data penduduk', err);
    }
  };

  const fetchApbdes = async (tahun, showLoading = true) => {
    if (showLoading) setIsFetchingApbdes(true);
    try {
      const response = await fetch(`${API_URL}/apbdes/${tahun}`);
      const json = await response.json();
      if (json && json.data) {
        setApbdesData(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data APBDes:', err);
    } finally {
      if (showLoading) setIsFetchingApbdes(false);
    }
  };

  const fetchRealisasi = async (tahun, showLoading = true) => {
    if (showLoading) setIsFetchingRealisasi(true);
    try {
      const response = await fetch(`${API_URL}/realisasi/${tahun}`);
      const json = await response.json();
      if (json && json.data) {
        setRealisasiData(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data Realisasi APBDes:', err);
    } finally {
      if (showLoading) setIsFetchingRealisasi(false);
    }
  };

  const fetchRkp = async (tahun, showLoading = true) => {
    if (showLoading) setIsFetchingRkp(true);
    try {
      const response = await fetch(`${API_URL}/rkp/${tahun}`);
      const json = await response.json();
      if (json) {
        setRkpData(json);
      }
    } catch (err) {
      console.error('Gagal mengambil data RKP Desa:', err);
    } finally {
      if (showLoading) setIsFetchingRkp(false);
    }
  };

  const tabs = [
    { id: 'penduduk', label: 'Penduduk', icon: <Users size={20} /> },
    { id: 'apbdes', label: 'APB Desa', icon: <CreditCard size={20} /> },
    { id: 'realisasi', label: 'Realisasi', icon: <CheckSquare size={20} /> },
    { id: 'rkp', label: 'RKP', icon: <BarChart2 size={20} /> }
  ];

  const { pieData, COLORS, barData, lakiData, perempuanData, pekerjaanData } = useMemo(() => {
    const pieData = [
      { name: 'Laki-Laki', value: parseInt(pendudukData.laki_laki) || 0 },
      { name: 'Perempuan', value: parseInt(pendudukData.perempuan) || 0 }
    ];
    const COLORS = ['#064E3B', '#10B981'];

    const lakiList = pendudukData?.umur_data?.laki_laki || [];
    const totalLaki = lakiList.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const maxLaki = lakiList.length > 0 ? [...lakiList].sort((a,b) => b.count - a.count)[0] : null;
    const minLaki = lakiList.length > 0 ? [...lakiList].sort((a,b) => a.count - b.count)[0] : null;

    const perempuanList = pendudukData?.umur_data?.perempuan || [];
    const totalPerempuan = perempuanList.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const maxPerempuan = perempuanList.length > 0 ? [...perempuanList].sort((a,b) => b.count - a.count)[0] : null;
    const minPerempuan = perempuanList.length > 0 ? [...perempuanList].sort((a,b) => a.count - b.count)[0] : null;

    const barData = lakiList.map((item, index) => ({
      name: item.range,
      'Laki-Laki': item.count || 0,
      'Perempuan': perempuanList[index]?.count || 0
    }));

    const pekerjaanList = pendudukData?.pekerjaan_data || [];
    const sortedPekerjaan = [...pekerjaanList].sort((a, b) => b.jumlah - a.jumlah);
    const top4Pekerjaan = sortedPekerjaan.slice(0, 4);
    const totalPekerja = pekerjaanList.reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0);
    const maxPekerjaan = sortedPekerjaan.length > 0 ? sortedPekerjaan[0] : null;
    const minPekerjaan = sortedPekerjaan.length > 0 ? sortedPekerjaan[sortedPekerjaan.length - 1] : null;

    return {
      pieData, COLORS, barData,
      lakiData: { totalLaki, maxLaki, minLaki },
      perempuanData: { totalPerempuan, maxPerempuan, minPerempuan },
      pekerjaanData: { sortedPekerjaan, top4Pekerjaan, totalPekerja, maxPekerjaan, minPekerjaan }
    };
  }, [pendudukData]);

  const apbdesCalc = useMemo(() => {
    const pendList = apbdesData.pendapatan || [];
    const belList = apbdesData.belanja || [];
    const pembList = apbdesData.pembiayaan || [];

    const totalPendapatan = pendList.reduce((acc, item) => acc + (parseFloat(item.jumlah) || 0), 0);
    const totalBelanja = belList.reduce((acc, item) => acc + (parseFloat(item.jumlah) || 0), 0);
    const surplusDefisit = totalPendapatan - totalBelanja;

    let penerimaan = 0;
    let pengeluaran = 0;
    pembList.forEach(item => {
      const val = parseFloat(item.jumlah) || 0;
      if (item.nama.toLowerCase().includes('pengeluaran')) {
        pengeluaran += val;
      } else {
        penerimaan += val;
      }
    });

    const selisihPembiayaan = penerimaan - pengeluaran;
    const silpa = surplusDefisit + selisihPembiayaan;

    const belanjaDonut = belList.map(b => ({
      name: b.nama,
      value: parseFloat(b.jumlah) || 0
    })).filter(b => b.value > 0);

    return {
      totalPendapatan,
      totalBelanja,
      surplusDefisit,
      penerimaan,
      pengeluaran,
      selisihPembiayaan,
      silpa,
      belanjaDonut
    };
  }, [apbdesData]);

  const formatRupiah = (num) => {
    const val = parseFloat(num) || 0;
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNeg ? `(${formatted})` : formatted;
  };

  const BELANJA_COLORS = ['#dc2626', '#ea580c', '#d97706', '#0284c7', '#4f46e5', '#16a34a', '#9333ea', '#db2777'];

  const renderContent = () => {
    if (activeTab === 'apbdes') {
      return (
        <div className="apbdes-section fade-in" style={{ padding: '20px 0' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderLeft: '5px solid var(--primary-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0 }}>Infografis APBD Desa Curah Tatal</h2>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Transparansi Anggaran Pendapatan dan Belanja Desa secara Terbuka & Akuntabel</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <div style={{ background: 'var(--primary-color)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
              </div>
              <label style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, fontSize: '0.95rem' }}>Tahun Anggaran:</label>
              <select
                value={apbdesYear}
                onChange={(e) => setApbdesYear(parseInt(e.target.value))}
                style={{ padding: '8px 14px', fontSize: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8', background: 'white', color: '#0f172a' }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ opacity: isFetchingApbdes ? 0.4 : 1, transition: 'opacity 0.3s ease-in-out', pointerEvents: isFetchingApbdes ? 'none' : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>PENDAPATAN DESA</span>
                  <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><TrendingUp size={20} /></div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>
                  Rp {formatRupiah(apbdesCalc.totalPendapatan)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tahun {apbdesYear}</span>
              </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>BELANJA DESA</span>
                <div style={{ background: '#ffe4e6', padding: '8px', borderRadius: '8px', color: '#e11d48' }}><TrendingDown size={20} /></div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e11d48' }}>
                Rp {formatRupiah(apbdesCalc.totalBelanja)}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tahun {apbdesYear}</span>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>SURPLUS / (DEFISIT)</span>
                <div style={{ background: apbdesCalc.surplusDefisit >= 0 ? '#dcfce7' : '#ffe4e6', padding: '8px', borderRadius: '8px', color: apbdesCalc.surplusDefisit >= 0 ? '#16a34a' : '#e11d48' }}><DollarSign size={20} /></div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: apbdesCalc.surplusDefisit >= 0 ? '#16a34a' : '#e11d48' }}>
                Rp {formatRupiah(apbdesCalc.surplusDefisit)}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pendapatan - Belanja</span>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>SILPA</span>
                <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '8px', color: '#0284c7' }}><PieIcon size={20} /></div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: apbdesCalc.silpa >= 0 ? '#0284c7' : '#e11d48' }}>
                Rp {formatRupiah(apbdesCalc.silpa)}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sisa Perhitungan Anggaran</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '20px', textAlign: 'center' }}>Proporsi Alokasi Belanja Desa</h3>
              <div style={{ width: '100%', height: '360px' }}>
                {apbdesCalc.belanjaDonut.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={apbdesCalc.belanjaDonut}
                        cx="50%"
                        cy="38%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {apbdesCalc.belanjaDonut.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BELANJA_COLORS[index % BELANJA_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `Rp ${formatRupiah(val)}`} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '15px', lineHeight: '1.4' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>Belum ada data belanja</div>
                )}
              </div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '20px', textAlign: 'center' }}>Perbandingan Pendapatan vs Belanja</h3>
              <div style={{ width: '100%', height: '360px' }}>
                <ResponsiveContainer>
                  <BarChart data={[{ name: `Tahun ${apbdesYear}`, Pendapatan: apbdesCalc.totalPendapatan, Belanja: apbdesCalc.totalBelanja }]} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis width={55} tickFormatter={(val) => `${(val / 1e6).toFixed(0)}Jt`} />
                    <RechartsTooltip formatter={(val) => `Rp ${formatRupiah(val)}`} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                    <Bar dataKey="Pendapatan" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Belanja" fill="#e11d48" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '30px 25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '2px solid #f59e0b', color: '#0f172a' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Rincian APBD Desa Curah Tatal</h2>
              <p style={{ fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0', fontSize: '1.1rem' }}>Tahun Anggaran {apbdesYear}</p>
            </div>
            <div style={{ marginBottom: '35px' }}>
              <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>PENDAPATAN DESA</div>
              <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px' }}>
                {(apbdesData.pendapatan || []).map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 0', fontSize: '1.05rem', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: '600', color: '#0f172a' }}>
                    <span style={{ flex: '1 1 200px', minWidth: '180px' }}>{String.fromCharCode(97 + idx)}. {item.nama}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>Rp {formatRupiah(item.jumlah)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 0 4px 0', marginTop: '8px', borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.15rem', color: '#0f172a' }}>
                  <span>JUMLAH PENDAPATAN</span>
                  <span style={{ fontFamily: 'monospace' }}>Rp {formatRupiah(apbdesCalc.totalPendapatan)}</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '35px' }}>
              <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>BELANJA</div>
              <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px' }}>
                {(apbdesData.belanja || []).map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 0', fontSize: '1.05rem', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: '600', color: '#0f172a' }}>
                    <span style={{ flex: '1 1 200px', minWidth: '180px' }}>{String.fromCharCode(97 + idx)}. {item.nama}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>Rp {formatRupiah(item.jumlah)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 0 4px 0', marginTop: '8px', borderTop: '2px solid #0f172a', fontWeight: '900', fontSize: '1.15rem', color: '#0f172a' }}>
                  <span>JUMLAH BELANJA</span>
                  <span style={{ fontFamily: 'monospace' }}>Rp {formatRupiah(apbdesCalc.totalBelanja)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 0 4px 0', borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.15rem', color: '#0f172a' }}>
                  <span>SURPLUS / (DEFISIT)</span>
                  <span style={{ fontFamily: 'monospace' }}>Rp {formatRupiah(apbdesCalc.surplusDefisit)}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>PEMBIAYAAN DESA</div>
              <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px' }}>
                {(apbdesData.pembiayaan || []).map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 0', fontSize: '1.05rem', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: '600', color: '#0f172a' }}>
                    <span style={{ flex: '1 1 200px', minWidth: '180px' }}>{String.fromCharCode(97 + idx)}. {item.nama}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>Rp {formatRupiah(item.jumlah)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '10px 0 4px 0', marginTop: '8px', borderTop: '2px solid #0f172a', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                  <span>Selisih Pembiayaan (a-b)</span>
                  <span style={{ fontFamily: 'monospace' }}>Rp {formatRupiah(apbdesCalc.selisihPembiayaan)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '8px 0 4px 0', borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.15rem', color: '#0f172a' }}>
                  <span>Sisa Lebih / (Kurang) Perhitungan Anggaran</span>
                  <span style={{ fontFamily: 'monospace' }}>Rp {formatRupiah(apbdesCalc.silpa)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DOKUMENTASI & LAMPIRAN FOTO APBD DESA */}
          {apbdesData.dokumentasi && apbdesData.dokumentasi.length > 0 && (
            <div style={{ marginTop: '40px', background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ImageIcon size={24} style={{ color: 'var(--primary-color)' }} />
                Dokumentasi & Lampiran APBD Desa Tahun {apbdesYear}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {apbdesData.dokumentasi.map((img, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div 
                      onClick={() => setSelectedImage(img)}
                      style={{ cursor: 'pointer', overflow: 'hidden', height: '170px', position: 'relative' }}
                      title="Klik untuk memperbesar gambar"
                    >
                      <img 
                        src={getUploadUrl(img)} 
                        alt={`Dokumentasi ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
                      />
                    </div>
                    <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Foto Dokumentasi {idx + 1}</span>
                      <a 
                        href={getUploadUrl(img)} 
                        download={`Dokumentasi_APBDes_${apbdesYear}_${idx + 1}.webp`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-color)', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        <Download size={14} /> Unduh
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          </div>
        </div>
      );
    }

    if (activeTab === 'penduduk') {
      return (
        <div className="demografi-section slide-up">
          <div className="demografi-header text-center">
            <h2>Demografi Desa</h2>
            <p>Menyajikan data demografi penduduk secara ringkas dan akurat. Meliputi jumlah penduduk, kelompok usia, jenis kelamin, serta persebaran pekerjaan warga.</p>
          </div>
          
          <div className="demografi-grid">
            <div className="demo-card">
              <div className="demo-icon users-icon">
                <Users size={32} />
              </div>
              <div className="demo-info">
                <h3>TOTAL PENDUDUK</h3>
                <p><span className="highlight-number">{pendudukData.total_penduduk}</span> Jiwa</p>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-icon kk-icon">
                <Users size={32} />
              </div>
              <div className="demo-info">
                <h3>KEPALA KELUARGA</h3>
                <p><span className="highlight-number">{pendudukData.kepala_keluarga}</span> KK</p>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-icon male-icon">
                <Users size={32} />
              </div>
              <div className="demo-info">
                <h3>LAKI-LAKI</h3>
                <p><span className="highlight-number">{pendudukData.laki_laki}</span> Jiwa</p>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-icon female-icon">
                <Users size={32} />
              </div>
              <div className="demo-info">
                <h3>PEREMPUAN</h3>
                <p><span className="highlight-number">{pendudukData.perempuan}</span> Jiwa</p>
              </div>
            </div>
          </div>

          <div className="chart-container" style={{ marginTop: '50px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#0f172a' }}>Grafik Distribusi Jenis Kelamin</h3>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={500}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} Jiwa`, 'Jumlah']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="umur-container" style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>Berdasarkan Kelompok Umur</h3>
            
            {lakiData.maxLaki && lakiData.minLaki && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #064E3B', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                Untuk jenis kelamin laki-laki, kelompok umur <strong>{lakiData.maxLaki.range}</strong> adalah kelompok umur tertinggi dengan jumlah <strong>{lakiData.maxLaki.count} orang</strong> atau <strong>{lakiData.totalLaki ? ((lakiData.maxLaki.count / lakiData.totalLaki) * 100).toFixed(2) : 0}%</strong>. Sedangkan, kelompok umur <strong>{lakiData.minLaki.range}</strong> adalah yang terendah dengan jumlah <strong>{lakiData.minLaki.count} orang</strong> atau <strong>{lakiData.totalLaki ? ((lakiData.minLaki.count / lakiData.totalLaki) * 100).toFixed(2) : 0}%</strong>
              </div>
            )}
            
            {perempuanData.maxPerempuan && perempuanData.minPerempuan && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #10B981', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                Untuk jenis kelamin perempuan, kelompok umur <strong>{perempuanData.maxPerempuan.range}</strong> adalah kelompok umur tertinggi dengan jumlah <strong>{perempuanData.maxPerempuan.count} orang</strong> atau <strong>{perempuanData.totalPerempuan ? ((perempuanData.maxPerempuan.count / perempuanData.totalPerempuan) * 100).toFixed(2) : 0}%</strong>. Sedangkan, kelompok umur <strong>{perempuanData.minPerempuan.range}</strong> adalah yang terendah dengan jumlah <strong>{perempuanData.minPerempuan.count} orang</strong> atau <strong>{perempuanData.totalPerempuan ? ((perempuanData.minPerempuan.count / perempuanData.totalPerempuan) * 100).toFixed(2) : 0}%</strong>
              </div>
            )}

            <div className="bar-container" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
              <div style={{ height: '400px', minWidth: '600px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Laki-Laki" fill="#064E3B" radius={[4, 4, 0, 0]} animationDuration={500} />
                    <Bar dataKey="Perempuan" fill="#10B981" radius={[4, 4, 0, 0]} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="pekerjaan-container" style={{ marginTop: '50px' }}>
            <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>Berdasarkan Pekerjaan</h3>
            <div className="pekerjaan-grid">
              <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'var(--accent-color)', color: 'var(--text-on-primary, white)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Jenis Pekerjaan</span>
                  <span>Jumlah</span>
                </div>
                <div style={{ height: '245px', overflowY: 'auto' }}>
                  {pekerjaanData.sortedPekerjaan.map((job, idx) => (
                    <div key={idx} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem' }}>
                      <span style={{ color: '#0f172a' }}>{job.nama}</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{job.jumlah}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pekerjaan-cards-grid">
                {pekerjaanData.top4Pekerjaan.map((job, idx) => (
                  <div key={`card-${idx}`} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>{job.nama}</span>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>{job.jumlah}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {pekerjaanData.maxPekerjaan && pekerjaanData.minPekerjaan && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--secondary-color)', marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                Mayoritas penduduk bekerja sebagai <strong>{pekerjaanData.maxPekerjaan.nama}</strong> dengan jumlah <strong>{pekerjaanData.maxPekerjaan.jumlah} orang</strong> atau <strong>{pekerjaanData.totalPekerja ? ((pekerjaanData.maxPekerjaan.jumlah / pekerjaanData.totalPekerja) * 100).toFixed(2) : 0}%</strong> dari total pekerja. Sedangkan, pekerjaan yang paling sedikit ditekuni adalah <strong>{pekerjaanData.minPekerjaan.nama}</strong> dengan jumlah <strong>{pekerjaanData.minPekerjaan.jumlah} orang</strong> atau <strong>{pekerjaanData.totalPekerja ? ((pekerjaanData.minPekerjaan.jumlah / pekerjaanData.totalPekerja) * 100).toFixed(2) : 0}%</strong>.
              </div>
            )}
          </div>

          {/* LAMPIRAN DOKUMEN DATA PENDUDUK (.PDF, .HTML, .XLSX, DLL) */}
          <div style={{ background: 'white', padding: '30px 25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <Download size={20} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
              </div>
              Lampiran Dokumen Resmi Data Penduduk (PDF, HTML, Excel, Word, dll)
            </h3>

            {pendudukData.dokumen && pendudukData.dokumen.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {pendudukData.dokumen.map((doc, idx) => {
                  const ext = doc.filename ? doc.filename.split('.').pop().toLowerCase() : '';
                  let badgeColor = '#64748b';
                  if (['pdf'].includes(ext)) badgeColor = '#dc2626';
                  if (['html', 'htm'].includes(ext)) badgeColor = '#ea580c';
                  if (['doc', 'docx'].includes(ext)) badgeColor = '#2563eb';
                  if (['xls', 'xlsx', 'csv'].includes(ext)) badgeColor = '#16a34a';
                  if (['zip', 'rar'].includes(ext)) badgeColor = '#7c3aed';

                  return (
                    <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        <span style={{ background: badgeColor, color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', flexShrink: 0 }}>
                          {ext || 'FILE'}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={doc.originalname || doc.filename}>
                            {doc.originalname || doc.filename}
                          </div>
                          {doc.size && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{(doc.size / 1024).toFixed(1)} KB</div>}
                        </div>
                      </div>
                      <a 
                        href={getUploadUrl(doc.filename)} 
                        download={doc.originalname || doc.filename}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', background: 'var(--primary-color)', color: 'var(--text-on-primary, #ffffff)', fontWeight: 'bold', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                      >
                        <Download size={15} style={{ color: 'var(--text-on-primary, #ffffff)' }} /> Unduh
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                Belum ada dokumen terlampir untuk Data Penduduk.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'realisasi') {
      const calcSection = (cat) => {
        const items = realisasiData[cat] || [];
        let totalAng = 0;
        let totalReal = 0;

        items.forEach(item => {
          const hasSub = item.subItems && item.subItems.length > 0;
          if (hasSub) {
            item.subItems.forEach(sub => {
              totalAng += parseFloat(sub.anggaran) || 0;
              totalReal += parseFloat(sub.realisasi) || 0;
            });
          } else {
            totalAng += parseFloat(item.anggaran) || 0;
            totalReal += parseFloat(item.realisasi) || 0;
          }
        });
        const totalSelisih = totalAng - totalReal;
        return { totalAng, totalReal, totalSelisih };
      };

      const pendCalc = calcSection('pendapatan');
      const belCalc = calcSection('belanja');
      const surplusAng = pendCalc.totalAng - belCalc.totalAng;
      const surplusReal = pendCalc.totalReal - belCalc.totalReal;
      const surplusSelisih = pendCalc.totalSelisih - belCalc.totalSelisih;

      let pembAngPenerimaan = 0;
      let pembAngPengeluaran = 0;
      let pembRealPenerimaan = 0;
      let pembRealPengeluaran = 0;

      (realisasiData.pembiayaan || []).forEach(item => {
        const hasSub = item.subItems && item.subItems.length > 0;
        const isPengeluaran = item.nama.toLowerCase().includes('pengeluaran');

        let itemAng = 0;
        let itemReal = 0;
        if (hasSub) {
          item.subItems.forEach(sub => {
            itemAng += parseFloat(sub.anggaran) || 0;
            itemReal += parseFloat(sub.realisasi) || 0;
          });
        } else {
          itemAng += parseFloat(item.anggaran) || 0;
          itemReal += parseFloat(item.realisasi) || 0;
        }

        if (isPengeluaran) {
          pembAngPengeluaran += itemAng;
          pembRealPengeluaran += itemReal;
        } else {
          pembAngPenerimaan += itemAng;
          pembRealPenerimaan += itemReal;
        }
      });

      const pembCalc = {
        totalAng: pembAngPenerimaan - pembAngPengeluaran,
        totalReal: pembRealPenerimaan - pembRealPengeluaran,
        totalSelisih: (pembAngPenerimaan - pembAngPengeluaran) - (pembRealPenerimaan - pembRealPengeluaran)
      };

      const silpaAng = surplusAng + pembCalc.totalAng;
      const silpaReal = surplusReal + pembCalc.totalReal;
      const silpaSelisih = surplusSelisih + pembCalc.totalSelisih;

      const formatVal = (num) => {
        const val = parseFloat(num) || 0;
        const formatted = Math.abs(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return val < 0 ? `(${formatted})` : formatted;
      };

      const realisasiBelanjaDonut = (realisasiData.belanja || []).map(item => {
        const hasSub = item.subItems && item.subItems.length > 0;
        const totalReal = hasSub 
          ? item.subItems.reduce((a, c) => a + (parseFloat(c.realisasi) || 0), 0)
          : (parseFloat(item.realisasi) || 0);
        return {
          name: item.nama,
          value: totalReal
        };
      }).filter(item => item.value > 0);

      return (
        <div className="realisasi-section fade-in" style={{ padding: '20px 0' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderLeft: '5px solid var(--primary-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0 }}>Laporan Realisasi APBD Desa Curah Tatal</h2>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Transparansi Realisasi Anggaran Pendapatan, Belanja & Pembiayaan Desa secara Terbuka & Akuntabel</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <div style={{ background: 'var(--primary-color)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
              </div>
              <label style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, fontSize: '0.95rem' }}>Tahun Anggaran:</label>
              <select
                value={realisasiYear}
                onChange={(e) => {
                  const yr = parseInt(e.target.value);
                  setRealisasiYear(yr);
                  fetchRealisasi(yr);
                }}
                style={{ padding: '8px 14px', fontSize: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8', background: 'white', color: '#0f172a' }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ opacity: isFetchingRealisasi ? 0.4 : 1, transition: 'opacity 0.3s ease-in-out', pointerEvents: isFetchingRealisasi ? 'none' : 'auto' }}>
            
            {/* SUMMARY CARDS REALISASI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>PENDAPATAN DESA (REALISASI)</span>
                  <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><TrendingUp size={20} /></div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>
                  Rp {formatVal(pendCalc.totalReal)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Target Anggaran: Rp {formatVal(pendCalc.totalAng)} ({pendCalc.totalAng > 0 ? ((pendCalc.totalReal / pendCalc.totalAng) * 100).toFixed(1) : 0}%)
                </span>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>BELANJA DESA (REALISASI)</span>
                  <div style={{ background: '#ffe4e6', padding: '8px', borderRadius: '8px', color: '#e11d48' }}><TrendingDown size={20} /></div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e11d48' }}>
                  Rp {formatVal(belCalc.totalReal)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Pagu Anggaran: Rp {formatVal(belCalc.totalAng)} ({belCalc.totalAng > 0 ? ((belCalc.totalReal / belCalc.totalAng) * 100).toFixed(1) : 0}%)
                </span>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>SURPLUS / (DEFISIT) REALISASI</span>
                  <div style={{ background: surplusReal >= 0 ? '#dcfce7' : '#ffe4e6', padding: '8px', borderRadius: '8px', color: surplusReal >= 0 ? '#16a34a' : '#e11d48' }}><DollarSign size={20} /></div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: surplusReal >= 0 ? '#16a34a' : '#e11d48' }}>
                  Rp {formatVal(surplusReal)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pendapatan - Belanja (Realisasi)</span>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>SILPA REALISASI</span>
                  <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '8px', color: '#0284c7' }}><PieIcon size={20} /></div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: silpaReal >= 0 ? '#0284c7' : '#e11d48' }}>
                  Rp {formatVal(silpaReal)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sisa Perhitungan Anggaran Realisasi</span>
              </div>
            </div>

            {/* CHARTS REALISASI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '20px', textAlign: 'center' }}>Proporsi Alokasi Realisasi Belanja Desa</h3>
                <div style={{ width: '100%', height: '360px' }}>
                  {realisasiBelanjaDonut.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={realisasiBelanjaDonut}
                          cx="50%"
                          cy="38%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {realisasiBelanjaDonut.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BELANJA_COLORS[index % BELANJA_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val) => `Rp ${formatVal(val)}`} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '15px', lineHeight: '1.4' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>Belum ada data realisasi belanja</div>
                  )}
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '20px', textAlign: 'center' }}>Perbandingan Anggaran vs Realisasi</h3>
                <div style={{ width: '100%', height: '360px' }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { name: 'Pendapatan', Anggaran: pendCalc.totalAng, Realisasi: pendCalc.totalReal },
                      { name: 'Belanja', Anggaran: belCalc.totalAng, Realisasi: belCalc.totalReal }
                    ]} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis width={55} tickFormatter={(val) => `${(val / 1e6).toFixed(0)}Jt`} />
                      <RechartsTooltip formatter={(val) => `Rp ${formatVal(val)}`} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      <Bar dataKey="Anggaran" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Realisasi" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RINCIAN REALISASI APBD DESA (TEMA 100% SAMA KEK APBD: GRADIENT EMAS & BADGE MERAH) */}
            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '30px 25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '2px solid #f59e0b', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Rincian Laporan Realisasi APBD Desa</h2>
                <p style={{ fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0', fontSize: '1.1rem' }}>Tahun Anggaran {realisasiYear}</p>
              </div>

              {/* 1. PENDAPATAN DESA */}
              <div style={{ marginBottom: '35px' }}>
                <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>PENDAPATAN DESA</div>
                <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a', color: '#0f172a', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '800' }}>
                        <th style={{ padding: '12px 10px', width: '45%' }}>URAIAN PENDAPATAN</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>ANGGARAN (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>REALISASI (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '19%' }}>LEBIH / (KURANG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(realisasiData.pendapatan || []).map((item, idx) => {
                        const hasSub = item.subItems && item.subItems.length > 0;
                        const itemAng = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.anggaran) || 0), 0) : (parseFloat(item.anggaran) || 0);
                        const itemReal = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.realisasi) || 0), 0) : (parseFloat(item.realisasi) || 0);
                        const itemSel = itemAng - itemReal;

                        return (
                          <React.Fragment key={item.id || idx}>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                              <td style={{ padding: '10px 10px', fontWeight: '700', color: '#0f172a' }}>
                                {String.fromCharCode(97 + idx).toUpperCase()}. {item.nama}
                              </td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(itemAng)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemReal)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemSel)}</td>
                            </tr>
                            {/* SUB ITEMS */}
                            {(item.subItems || []).map((sub, sIdx) => {
                              const subAng = parseFloat(sub.anggaran) || 0;
                              const subReal = parseFloat(sub.realisasi) || 0;
                              const subSel = subAng - subReal;
                              return (
                                <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                  <td style={{ padding: '8px 10px 8px 35px', color: '#0f172a', fontSize: '0.92rem' }}>
                                    <span style={{ marginRight: '8px', color: '#0f172a' }}>•</span> {sub.nama}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subAng)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subReal)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', fontSize: '0.92rem', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(subSel)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      {/* JUMLAH PENDAPATAN */}
                      <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                        <td style={{ padding: '14px 10px' }}>JUMLAH PENDAPATAN</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(pendCalc.totalAng)}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(pendCalc.totalReal)}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(pendCalc.totalSelisih)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. BELANJA DESA */}
              <div style={{ marginBottom: '35px' }}>
                <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>BELANJA</div>
                <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a', color: '#0f172a', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '800' }}>
                        <th style={{ padding: '12px 10px', width: '45%' }}>URAIAN BELANJA</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>ANGGARAN (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>REALISASI (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '19%' }}>LEBIH / (KURANG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(realisasiData.belanja || []).map((item, idx) => {
                        const hasSub = item.subItems && item.subItems.length > 0;
                        const itemAng = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.anggaran) || 0), 0) : (parseFloat(item.anggaran) || 0);
                        const itemReal = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.realisasi) || 0), 0) : (parseFloat(item.realisasi) || 0);
                        const itemSel = itemAng - itemReal;

                        return (
                          <React.Fragment key={item.id || idx}>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                              <td style={{ padding: '10px 10px', fontWeight: '700', color: '#0f172a' }}>
                                {String.fromCharCode(97 + idx).toUpperCase()}. {item.nama}
                              </td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(itemAng)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemReal)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemSel)}</td>
                            </tr>
                            {(item.subItems || []).map((sub, sIdx) => {
                              const subAng = parseFloat(sub.anggaran) || 0;
                              const subReal = parseFloat(sub.realisasi) || 0;
                              const subSel = subAng - subReal;
                              return (
                                <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                  <td style={{ padding: '8px 10px 8px 35px', color: '#0f172a', fontSize: '0.92rem' }}>
                                    <span style={{ marginRight: '8px', color: '#0f172a' }}>•</span> {sub.nama}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subAng)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subReal)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', fontSize: '0.92rem', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(subSel)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      {/* JUMLAH BELANJA */}
                      <tr style={{ borderTop: '2px solid #0f172a', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                        <td style={{ padding: '14px 10px' }}>JUMLAH BELANJA</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(belCalc.totalAng)}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(belCalc.totalReal)}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(belCalc.totalSelisih)}</td>
                      </tr>
                      {/* SURPLUS / DEFISIT */}
                      <tr style={{ borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                        <td style={{ padding: '10px 10px' }}>SURPLUS / (DEFISIT)</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(surplusAng)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(surplusReal)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(surplusSelisih)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. PEMBIAYAAN DESA */}
              <div>
                <div style={{ background: '#cc0000', color: 'white', padding: '6px 20px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginBottom: '15px' }}>PEMBIAYAAN DESA</div>
                <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', padding: '15px 20px', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a', color: '#0f172a', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '800' }}>
                        <th style={{ padding: '12px 10px', width: '45%' }}>URAIAN PEMBIAYAAN</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>ANGGARAN (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '18%' }}>REALISASI (RP)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right', width: '19%' }}>LEBIH / (KURANG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(realisasiData.pembiayaan || []).map((item, idx) => {
                        const hasSub = item.subItems && item.subItems.length > 0;
                        const itemAng = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.anggaran) || 0), 0) : (parseFloat(item.anggaran) || 0);
                        const itemReal = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.realisasi) || 0), 0) : (parseFloat(item.realisasi) || 0);
                        const itemSel = itemAng - itemReal;

                        return (
                          <React.Fragment key={item.id || idx}>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                              <td style={{ padding: '10px 10px', fontWeight: '700', color: '#0f172a' }}>
                                {String.fromCharCode(97 + idx).toUpperCase()}. {item.nama}
                              </td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(itemAng)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemReal)}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(itemSel)}</td>
                            </tr>
                            {(item.subItems || []).map((sub, sIdx) => {
                              const subAng = parseFloat(sub.anggaran) || 0;
                              const subReal = parseFloat(sub.realisasi) || 0;
                              const subSel = subAng - subReal;
                              return (
                                <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                  <td style={{ padding: '8px 10px 8px 35px', color: '#0f172a', fontSize: '0.92rem' }}>
                                    <span style={{ marginRight: '8px', color: '#0f172a' }}>•</span> {sub.nama}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subAng)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem', fontFamily: 'monospace' }}>{formatVal(subReal)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', fontSize: '0.92rem', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(subSel)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      {/* PEMBIAYAAN NETTO */}
                      <tr style={{ borderTop: '2px solid #0f172a', fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>
                        <td style={{ padding: '12px 10px' }}>PEMBIAYAAN NETTO</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(pembCalc.totalAng)}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(pembCalc.totalReal)}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(pembCalc.totalSelisih)}</td>
                      </tr>
                      {/* SILPA */}
                      <tr style={{ borderBottom: '2px double #0f172a', fontWeight: '900', fontSize: '1.15rem', color: '#0f172a' }}>
                        <td style={{ padding: '12px 10px' }}>SILPA / SILPA TAHUN BERJALAN</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>{formatVal(silpaAng)}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(silpaReal)}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace' }}>{formatVal(silpaSelisih)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* DOKUMENTASI REALISASI FOTO */}
            {realisasiData.dokumentasi && realisasiData.dokumentasi.length > 0 && (
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginTop: '40px' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ImageIcon size={22} style={{ color: '#0284c7' }} />
                  Dokumentasi & Lampiran Realisasi APBD Desa Tahun {realisasiYear}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {realisasiData.dokumentasi.map((img, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setSelectedImage(img)}
                        style={{ cursor: 'pointer', overflow: 'hidden', height: '170px', position: 'relative' }}
                        title="Klik untuk memperbesar gambar"
                      >
                        <img 
                          src={getUploadUrl(img)} 
                          alt={`Dokumentasi Realisasi ${idx + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        />
                      </div>
                      <div style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Foto Dokumentasi {idx + 1}</span>
                        <a 
                          href={getUploadUrl(img)} 
                          download={`Dokumentasi_Realisasi_${realisasiYear}_${idx + 1}.webp`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          <Download size={14} /> Unduh
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      );
    }

    if (activeTab === 'rkp') {
      return (
        <div className="rkp-section fade-in" style={{ padding: '20px 0' }}>
          {/* YEAR SELECTOR & HEADER CARD */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderLeft: '6px solid var(--primary-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0, fontWeight: '800' }}>
                {rkpData.judul || `Rencana Kerja Pemerintah Desa (RKP) Tahun ${rkpYear}`}
              </h2>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                Dokumen Perencanaan Pembangunan Desa Curah Tatal secara Berkala & Transparan
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <div style={{ background: 'var(--primary-color)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
              </div>
              <label style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, fontSize: '0.95rem' }}>Tahun Anggaran:</label>
              <select
                value={rkpYear}
                onChange={(e) => setRkpYear(parseInt(e.target.value))}
                style={{ padding: '8px 14px', fontSize: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8', background: 'white', color: '#0f172a' }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ opacity: isFetchingRkp ? 0.4 : 1, transition: 'opacity 0.3s ease-in-out' }}>
            {/* NARASI / PENJELASAN TEKS RKP */}
            <div style={{ background: 'white', padding: '30px 25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                  <BarChart2 size={20} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
                </div>
                Narasi & Rincian RKP Desa Tahun {rkpYear}
              </h3>
              
              {rkpData.narasi ? (
                <div style={{ fontSize: '1.05rem', color: '#0f172a', lineHeight: '1.8' }}>
                  {rkpData.narasi.split('\n').map((line, lIdx) => {
                    const parts = line.split(/(\*\*.*?\*\*|<b>.*?<\/b>|\*.*?\*)/g);
                    return (
                      <div key={lIdx} style={{ minHeight: line.trim() === '' ? '0.8em' : 'auto', marginBottom: '4px' }}>
                        {parts.map((part, pIdx) => {
                          if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('<b>') && part.endsWith('</b>'))) {
                            const clean = part.startsWith('**') ? part.slice(2, -2) : part.slice(3, -4);
                            return <strong key={pIdx} style={{ fontWeight: '800', color: '#0f172a' }}>{clean}</strong>;
                          } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                            return <em key={pIdx} style={{ fontStyle: 'italic', color: '#1e293b' }}>{part.slice(1, -1)}</em>;
                          }
                          return part;
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  Belum ada narasi penjelasan RKP Desa yang dimasukkan untuk Tahun Anggaran {rkpYear}.
                </div>
              )}
            </div>

            {/* LAMPIRAN DOKUMEN (PDF, WORD, EXCEL, ZIP, DLL) */}
            <div style={{ background: 'white', padding: '30px 25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                  <Download size={20} style={{ color: 'var(--text-on-primary, #ffffff)' }} />
                </div>
                Lampiran Dokumen Resmi (Word, PDF, Excel, dll)
              </h3>

              {rkpData.dokumen && rkpData.dokumen.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {rkpData.dokumen.map((doc, idx) => {
                    const ext = doc.filename ? doc.filename.split('.').pop().toLowerCase() : '';
                    let badgeColor = '#64748b';
                    if (['pdf'].includes(ext)) badgeColor = '#dc2626';
                    if (['doc', 'docx'].includes(ext)) badgeColor = '#2563eb';
                    if (['xls', 'xlsx'].includes(ext)) badgeColor = '#16a34a';
                    if (['zip', 'rar'].includes(ext)) badgeColor = '#ea580c';

                    return (
                      <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <span style={{ background: badgeColor, color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', flexShrink: 0 }}>
                            {ext || 'FILE'}
                          </span>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={doc.originalname || doc.filename}>
                              {doc.originalname || doc.filename}
                            </div>
                            {doc.size && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{(doc.size / 1024).toFixed(1)} KB</div>}
                          </div>
                        </div>
                        <a 
                          href={getUploadUrl(doc.filename)} 
                          download={doc.originalname || doc.filename}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', background: 'var(--primary-color)', color: 'var(--text-on-primary, #ffffff)', fontWeight: 'bold', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                          <Download size={15} style={{ color: 'var(--text-on-primary, #ffffff)' }} /> Unduh
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  Belum ada dokumen terlampir untuk RKP Tahun {rkpYear}.
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="infografis-page bg-light" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="hero-section text-center">
        <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '24px' }}>
          <TypewriterText text="Tata Kelola Desa Curah Tatal" />
        </h1>
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'apbdes') {
                  setApbdesYear(new Date().getFullYear());
                } else if (tab.id === 'realisasi') {
                  setRealisasiYear(new Date().getFullYear());
                  fetchRealisasi(new Date().getFullYear());
                } else if (tab.id === 'rkp') {
                  setRkpYear(new Date().getFullYear());
                  fetchRkp(new Date().getFullYear());
                }
              }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="content-container">
        {renderContent()}
      </div>

      {/* Lightbox Modal Pratinjau Foto */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '-45px',
                right: 0,
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>

            <img 
              src={getUploadUrl(selectedImage)} 
              alt="Pratinjau Foto Dokumentasi" 
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
            />

            <div style={{ marginTop: '15px', display: 'flex', gap: '12px' }}>
              <a 
                href={getUploadUrl(selectedImage)} 
                download={`Dokumentasi_APBDes_${apbdesYear}.webp`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Unduh Gambar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfografisPage;
