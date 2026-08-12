import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { LogOut, Plus, Trash2, Edit, Image as ImageIcon, Crop, X, Palette, BookOpen, Save, Menu, MapPin, ExternalLink, Navigation, Eye, Database, KeyRound, Lock } from 'lucide-react';
import { getCroppedImg, createImage } from '../utils/cropImage';
import { API_URL, getUploadUrl } from '../utils/url';
import PetaTab from './PetaTab';
import BackupTab from './BackupTab';

const applyTheme = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const hslToHex = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const lightnessLevels = [0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  lightnessLevels.forEach((light, i) => {
    document.documentElement.style.setProperty(`--color-${i+1}`, hslToHex(h, s, light));
  });

  const primaryHex = hslToHex(h, s, Math.max(0, l - 0.2));
  let pr = parseInt(primaryHex.substring(1, 3), 16);
  let pg = parseInt(primaryHex.substring(3, 5), 16);
  let pb = parseInt(primaryHex.substring(5, 7), 16);
  const perceivedLightness = (pr * 299 + pg * 587 + pb * 114) / 1000;
  const textOnPrimary = perceivedLightness > 165 ? '#0f172a' : '#ffffff';

  document.documentElement.style.setProperty('--text-on-primary', textOnPrimary);
  document.documentElement.style.setProperty('--primary-color', primaryHex);
  document.documentElement.style.setProperty('--secondary-color', hex);
  document.documentElement.style.setProperty('--accent-color', hslToHex(h, s, Math.min(1, l + 0.1)));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apbdes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);

  // Ganti Password Admin State
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  const [isPassSubmitting, setIsPassSubmitting] = useState(false);

  // Data Penduduk State
  const defaultUmurData = {
    laki_laki: [
      { range: '0-19', count: 875 }, { range: '20-39', count: 1360 }, { range: '40-59', count: 847 }, 
      { range: '60-79', count: 1036 }, { range: '80-99', count: 24 }, { range: '100+', count: 6 }
    ],
    perempuan: [
      { range: '0-19', count: 1017 }, { range: '20-39', count: 1420 }, { range: '40-59', count: 887 }, 
      { range: '60-79', count: 1066 }, { range: '80-99', count: 34 }, { range: '100+', count: 3 }
    ]
  };

  const [pendudukData, setPendudukData] = useState({
    total_penduduk: 8575,
    kepala_keluarga: 3419,
    laki_laki: 4148,
    perempuan: 4427,
    umur_data: defaultUmurData,
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
    ]
  });

  // Form State
  const [formData, setFormData] = useState({ judul: '', deskripsi: '' });
  const [thumbnail, setThumbnail] = useState(null); // File final
  const [thumbnailPreview, setThumbnailPreview] = useState(null); // URL untuk preview
  
  // Cropper State (Post Thumbnail 16:9)
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [dokumentasi, setDokumentasi] = useState([]); // File baru yang akan diupload
  const [existingDokumentasi, setExistingDokumentasi] = useState([]); // URL foto lama
  const [deletedDokumentasi, setDeletedDokumentasi] = useState([]); // URL foto lama yang dihapus

  // Web Settings State
  const [themeColor, setThemeColor] = useState('#10b981');
  const [footerDesc, setFooterDesc] = useState('Membangun desa wisata yang lestari, berdaya saing, dan sejahtera.');
  const [address, setAddress] = useState('Kec. Arjasa, Situbondo 68371');
  const [email, setEmail] = useState('pemdes@curahtatal.desa.id');
  const [contacts, setContacts] = useState([]);

  // Profil Desa State
  const defaultGeografisObj = {
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

  const defaultSarprasObj = {
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

  const [profilVisi, setProfilVisi] = useState('');
  const [profilTagline, setProfilTagline] = useState('#CurahTatalJAYA');
  const [profilMisi, setProfilMisi] = useState([]);
  const [profilSejarah, setProfilSejarah] = useState('');
  const [profilGeografis, setProfilGeografis] = useState(defaultGeografisObj);
  const [profilDusun, setProfilDusun] = useState([]);
  const [profilKadesHistory, setProfilKadesHistory] = useState([]);
  const [profilPerangkat, setProfilPerangkat] = useState([]);
  const [profilAparat, setProfilAparat] = useState([]);
  const [profilSarpras, setProfilSarpras] = useState(defaultSarprasObj);

  // Hero Slider States & 16:9 Cropper
  const [heroSlider, setHeroSlider] = useState([
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80'
  ]);
  const [showHeroCropper, setShowHeroCropper] = useState(false);
  const [heroCropSrc, setHeroCropSrc] = useState(null);
  const [heroCropIndex, setHeroCropIndex] = useState(null);
  const [heroCrop, setHeroCrop] = useState({ x: 0, y: 0 });
  const [heroZoom, setHeroZoom] = useState(1);
  const [heroCroppedAreaPixels, setHeroCroppedAreaPixels] = useState(null);

  // Aparat 3x4 Cropper Modal States
  const [showAparatCropper, setShowAparatCropper] = useState(false);
  const [aparatCropSrc, setAparatCropSrc] = useState(null);
  const [aparatCropIndex, setAparatCropIndex] = useState(null);
  const [aparatCrop, setAparatCrop] = useState({ x: 0, y: 0 });
  const [aparatZoom, setAparatZoom] = useState(1);
  const [aparatCroppedAreaPixels, setAparatCroppedAreaPixels] = useState(null);

  const [apbdesYear, setApbdesYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  // +1 agar bisa menginput/merencanakan APBDes untuk tahun berikutnya
  const availableYears = Array.from({ length: Math.max(1, (currentYear + 1) - 2024 + 1) }, (_, i) => 2024 + i).reverse();
  const [apbdesData, setApbdesData] = useState({
    pendapatan: [],
    belanja: [],
    pembiayaan: [],
    dokumentasi: []
  });
  const [isFetchingApbdes, setIsFetchingApbdes] = useState(false);

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

  // Pilihan Warna Preset (Abjad)
  const colorPresets = [
    { name: 'Abu-abu', hex: '#64748b' },
    { name: 'Biru', hex: '#3b82f6' },
    { name: 'Biru Langit', hex: '#0ea5e9' },
    { name: 'Biru Tua', hex: '#1d4ed8' },
    { name: 'Cokelat', hex: '#78350f' },
    { name: 'Cokelat Muda', hex: '#b45309' },
    { name: 'Emas', hex: '#eab308' },
    { name: 'Hijau', hex: '#22c55e' },
    { name: 'Hijau Daun', hex: '#84cc16' },
    { name: 'Hijau Emerald', hex: '#10b981' },
    { name: 'Hijau Tua', hex: '#15803d' },
    { name: 'Hitam', hex: '#0f172a' },
    { name: 'Jingga (Oranye)', hex: '#f97316' },
    { name: 'Jingga Tua', hex: '#ea580c' },
    { name: 'Kuning', hex: '#fef08a' },
    { name: 'Merah', hex: '#ef4444' },
    { name: 'Merah Bata', hex: '#b91c1c' },
    { name: 'Merah Muda', hex: '#ec4899' },
    { name: 'Merah Mawar', hex: '#e11d48' },
    { name: 'Nila (Indigo)', hex: '#6366f1' },
    { name: 'Perak', hex: '#94a3b8' },
    { name: 'Ungu', hex: '#a855f7' },
    { name: 'Ungu Gelap', hex: '#6b21a8' }
  ].sort((a, b) => a.name.localeCompare(b.name));


  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/login');
    }
    if (activeTab === 'penduduk') {
      fetchPenduduk();
    } else if (activeTab === 'apbdes') {
      fetchApbdes(apbdesYear);
    } else if (activeTab === 'realisasi') {
      fetchRealisasi(realisasiYear);
    } else if (activeTab === 'rkp') {
      fetchRkp(rkpYear);
    } else if (activeTab === 'peta') {
      // PetaTab handles its own data fetching
    } else if (activeTab === 'tema' || activeTab === 'profil') {
      fetchTheme();
    } else {
      fetchPosts();
    }
  }, [activeTab, apbdesYear, realisasiYear, rkpYear]);

  const safeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [val];
      }
    }
    return [];
  };

  const fetchTheme = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data) {
        if (res.data.theme_color) {
          setThemeColor(res.data.theme_color);
          applyTheme(res.data.theme_color);
        }
        if (res.data.hero_slider && Array.isArray(res.data.hero_slider)) {
          setHeroSlider(res.data.hero_slider);
        }
        if (res.data.profil_visi) setProfilVisi(res.data.profil_visi);
        if (res.data.address) setAddress(res.data.address);
        if (res.data.email) setEmail(res.data.email);
        setContacts(safeArray(res.data.contacts_data));
        setProfilVisi(res.data.profil_visi || '');
        setProfilTagline(res.data.profil_tagline || '#CurahTatalJAYA');
        setProfilMisi(safeArray(res.data.profil_misi));
        setProfilSejarah(res.data.profil_sejarah || '');
        
        let gObj = defaultGeografisObj;
        if (res.data.profil_geografis) {
          if (typeof res.data.profil_geografis === 'object' && res.data.profil_geografis !== null) {
            gObj = { ...defaultGeografisObj, ...res.data.profil_geografis };
          } else if (typeof res.data.profil_geografis === 'string') {
            try {
              if (res.data.profil_geografis.trim().startsWith('{')) {
                gObj = { ...defaultGeografisObj, ...JSON.parse(res.data.profil_geografis) };
              } else {
                gObj = { ...defaultGeografisObj, deskripsi: res.data.profil_geografis };
              }
            } catch(e) {
              gObj = { ...defaultGeografisObj, deskripsi: res.data.profil_geografis };
            }
          }
        }
        if (typeof gObj.deskripsi === 'object' && gObj.deskripsi !== null) {
          gObj.deskripsi = typeof gObj.deskripsi.deskripsi === 'string' ? gObj.deskripsi.deskripsi : defaultGeografisObj.deskripsi;
        }
        if (!gObj.deskripsi || typeof gObj.deskripsi !== 'string' || gObj.deskripsi.includes('[object Object]')) {
          gObj.deskripsi = defaultGeografisObj.deskripsi;
        }
        setProfilGeografis(gObj);

        setProfilDusun(safeArray(res.data.profil_dusun));
        setProfilKadesHistory(safeArray(res.data.profil_kades_history));
        setProfilPerangkat(safeArray(res.data.profil_perangkat));
        setProfilAparat(safeArray(res.data.profil_aparat));

        let sObj = defaultSarprasObj;
        if (res.data.profil_sarpras) {
          if (typeof res.data.profil_sarpras === 'object' && res.data.profil_sarpras !== null) {
            sObj = { ...defaultSarprasObj, ...res.data.profil_sarpras };
          } else if (typeof res.data.profil_sarpras === 'string') {
            try {
              if (res.data.profil_sarpras.trim().startsWith('{')) {
                sObj = { ...defaultSarprasObj, ...JSON.parse(res.data.profil_sarpras) };
              }
            } catch(e) {}
          }
        }
        setProfilSarpras(sObj);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTheme = async () => {
    try {
      await axios.put(`${API_URL}/settings`, {
        theme_color: themeColor,
        footer_desc: footerDesc,
        address,
        email,
        contacts_data: safeArray(contacts),
        hero_slider: safeArray(heroSlider),
        profil_visi: profilVisi,
        profil_tagline: profilTagline,
        profil_misi: safeArray(profilMisi),
        profil_sejarah: profilSejarah,
        profil_geografis: profilGeografis,
        profil_dusun: safeArray(profilDusun),
        profil_kades_history: safeArray(profilKadesHistory),
        profil_perangkat: safeArray(profilPerangkat),
        profil_aparat: safeArray(profilAparat),
        profil_sarpras: profilSarpras
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error('Save settings error:', err);
      alert('Gagal menyimpan pengaturan: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword) {
      alert('Password saat ini wajib diisi!');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert('Konfirmasi password baru tidak cocok!');
      return;
    }
    if (passForm.newPassword.length < 4) {
      alert('Password baru minimal 4 karakter!');
      return;
    }

    setIsPassSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/change-password`, {
        currentPassword: passForm.currentPassword,
        newUsername: passForm.newUsername,
        newPassword: passForm.newPassword
      });
      alert(res.data?.message || 'Username & Password admin berhasil diperbarui!');
      setIsPassModalOpen(false);
      setPassForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
      if (passForm.newUsername) {
        localStorage.setItem('adminUsername', passForm.newUsername);
      }
    } catch (err) {
      alert('Gagal mengganti password: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsPassSubmitting(false);
    }
  };

  const handleSelectHeroSlide = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHeroCropSrc(reader.result);
      setHeroCropIndex(index);
      setHeroCrop({ x: 0, y: 0 });
      setHeroZoom(1);
      setShowHeroCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onHeroCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setHeroCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveHeroCroppedImage = async () => {
    try {
      if (!heroCropSrc || !heroCroppedAreaPixels) return;

      const image = await createImage(heroCropSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const targetWidth = 1440;
      const targetHeight = 810; // 16:9 widescreen HD
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(
        image,
        heroCroppedAreaPixels.x,
        heroCroppedAreaPixels.y,
        heroCroppedAreaPixels.width,
        heroCroppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Convert canvas to WebP Blob
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
      const file = new File([blob], `hero_slide_${Date.now()}.webp`, { type: 'image/webp' });

      // Upload to server endpoint for lightweight payload
      const formData = new FormData();
      formData.append('images', file);

      let slideUrl = '';
      try {
        const res = await axios.post(`${API_URL}/realisasi/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.filenames && res.data.filenames[0]) {
          slideUrl = `/uploads/${res.data.filenames[0]}`;
        }
      } catch (uploadErr) {
        // Fallback to WebP DataURL
        slideUrl = canvas.toDataURL('image/webp', 0.80);
      }

      if (slideUrl) {
        const newS = [...safeArray(heroSlider)];
        newS[heroCropIndex] = slideUrl;
        setHeroSlider(newS);
        setShowHeroCropper(false);
        setHeroCropSrc(null);
      }
    } catch (err) {
      console.error('Error saving cropped hero image:', err);
      alert('Gagal memotong foto slider: ' + err.message);
    }
  };

  const handleSelectAparatFoto = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAparatCropSrc(reader.result);
      setAparatCropIndex(index);
      setAparatCrop({ x: 0, y: 0 });
      setAparatZoom(1);
      setShowAparatCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onAparatCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setAparatCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveAparatCroppedImage = async () => {
    try {
      if (!aparatCropSrc || !aparatCroppedAreaPixels) return;

      const image = await createImage(aparatCropSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const targetWidth = 300;
      const targetHeight = 400; // 3:4 aspect ratio
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(
        image,
        aparatCroppedAreaPixels.x,
        aparatCroppedAreaPixels.y,
        aparatCroppedAreaPixels.width,
        aparatCroppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Convert canvas to WebP Blob
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
      const file = new File([blob], `aparat_3x4_${Date.now()}.webp`, { type: 'image/webp' });

      const formData = new FormData();
      formData.append('images', file);

      let fotoUrl = '';
      try {
        const res = await axios.post(`${API_URL}/realisasi/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.filenames && res.data.filenames[0]) {
          fotoUrl = `/uploads/${res.data.filenames[0]}`;
        }
      } catch (uploadErr) {
        fotoUrl = canvas.toDataURL('image/webp', 0.80);
      }

      if (fotoUrl) {
        const newA = [...safeArray(profilAparat)];
        newA[aparatCropIndex] = { ...newA[aparatCropIndex], foto: fotoUrl };
        setProfilAparat(newA);
        setShowAparatCropper(false);
        setAparatCropSrc(null);
      }
    } catch (err) {
      console.error('Error saving cropped image:', err);
      alert('Gagal memotong foto: ' + err.message);
    }
  };

  const fetchPenduduk = async () => {
    try {
      const res = await axios.get(`${API_URL}/penduduk`);
      const data = res.data;
      setPendudukData({
        ...data,
        umur_data: data.umur_data || defaultUmurData,
        pekerjaan_data: data.pekerjaan_data || [],
        dokumen: data.dokumen || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePendudukDocUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);
    const formData = new FormData();
    filesArr.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const res = await axios.post(`${API_URL}/rkp/upload-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.files) {
        setPendudukData(prev => ({
          ...prev,
          dokumen: [...(prev.dokumen || []), ...res.data.files]
        }));
      }
    } catch (err) {
      console.error('Upload dokumen error:', err);
      alert('Gagal mengunggah dokumen: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemovePendudukDoc = (index) => {
    setPendudukData(prev => ({
      ...prev,
      dokumen: (prev.dokumen || []).filter((_, i) => i !== index)
    }));
  };

  const fetchRkp = async (tahun, showLoading = true) => {
    if (showLoading) setIsFetchingRkp(true);
    try {
      const res = await axios.get(`${API_URL}/rkp/${tahun}`);
      if (res.data) {
        setRkpData(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data RKP:', err);
    } finally {
      if (showLoading) setIsFetchingRkp(false);
    }
  };

  const handleSaveRkp = async () => {
    try {
      await axios.put(`${API_URL}/rkp/${rkpYear}`, rkpData);
      alert(`Data RKP Desa Tahun ${rkpYear} berhasil disimpan!`);
    } catch (err) {
      console.error('Save RKP error:', err);
      alert('Gagal menyimpan RKP Desa: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRkpDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(f => formData.append('documents', f));
    try {
      const res = await axios.post(`${API_URL}/rkp/upload-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.files) {
        setRkpData(prev => ({
          ...prev,
          dokumen: [...(prev.dokumen || []), ...res.data.files]
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload dokumen RKP');
    }
  };

  const handleInsertBold = () => {
    const textarea = document.getElementById('rkpNarasiTextarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = rkpData.narasi || '';
    const selected = text.substring(start, end);
    const replacement = selected ? `**${selected}**` : '**Teks Tebal**';
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setRkpData(prev => ({ ...prev, narasi: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected ? selected.length : 10));
    }, 50);
  };

  const handleInsertItalic = () => {
    const textarea = document.getElementById('rkpNarasiTextarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = rkpData.narasi || '';
    const selected = text.substring(start, end);
    const replacement = selected ? `*${selected}*` : '*Teks Miring*';
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setRkpData(prev => ({ ...prev, narasi: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1 + (selected ? selected.length : 11));
    }, 50);
  };

  const handleInsertBullet = () => {
    const textarea = document.getElementById('rkpNarasiTextarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const text = rkpData.narasi || '';
    const newText = text.substring(0, start) + '\n• ' + text.substring(start);
    setRkpData(prev => ({ ...prev, narasi: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 3, start + 3);
    }, 50);
  };

  const handleRemoveRkpDoc = (index) => {
    setRkpData(prev => ({
      ...prev,
      dokumen: (prev.dokumen || []).filter((_, i) => i !== index)
    }));
  };

  const handlePendudukSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/penduduk`, pendudukData);
      alert('Data penduduk berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data penduduk');
    }
  };

  const fetchApbdes = async (tahun) => {
    setIsFetchingApbdes(true);
    try {
      const res = await axios.get(`${API_URL}/apbdes/${tahun}`);
      if (res.data && res.data.data) {
        let raw = res.data.data;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
        }
        if (raw && typeof raw === 'object') {
          setApbdesData({
            pendapatan: Array.isArray(raw.pendapatan) ? raw.pendapatan : [],
            belanja: Array.isArray(raw.belanja) ? raw.belanja : [],
            pembiayaan: Array.isArray(raw.pembiayaan) ? raw.pembiayaan : [],
            dokumentasi: Array.isArray(raw.dokumentasi) ? raw.dokumentasi : []
          });
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data APBDes:', err);
    } finally {
      setIsFetchingApbdes(false);
    }
  };

  const handleSaveApbdes = async () => {
    try {
      await axios.put(`${API_URL}/apbdes/${apbdesYear}`, { data: apbdesData });
      alert(`Data APBDes Tahun ${apbdesYear} berhasil disimpan!`);
    } catch (err) {
      console.error('Save APBDes Error:', err);
      alert('Gagal menyimpan APBDes: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleApbdesItemChange = (category, index, field, value) => {
    setApbdesData(prev => {
      const categoryList = [...(prev[category] || [])];
      categoryList[index] = {
        ...categoryList[index],
        [field]: field === 'jumlah' ? (parseFloat(value) || 0) : value
      };
      return {
        ...prev,
        [category]: categoryList
      };
    });
  };

  const handleAddApbdesItem = (category) => {
    setApbdesData(prev => ({
      ...prev,
      [category]: [
        ...(prev[category] || []),
        { id: category[0] + '_' + Date.now(), nama: 'Poin Baru', jumlah: 0 }
      ]
    }));
  };

  const handleRemoveApbdesItem = (category, index) => {
    setApbdesData(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index)
    }));
  };

  const handleApbdesImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const currentImages = apbdesData.dokumentasi || [];
    if (currentImages.length + files.length > 10) {
      alert(`Maksimal 10 foto. Anda saat ini sudah mengunggah ${currentImages.length} foto.`);
      return;
    }
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      const res = await axios.post(`${API_URL}/apbdes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.filenames) {
        const newDocs = [...(apbdesData.dokumentasi || []), ...res.data.filenames];
        const updatedData = { ...apbdesData, dokumentasi: newDocs };
        setApbdesData(updatedData);
      }
    } catch (err) {
      console.error('Upload Image Error:', err);
      alert('Gagal mengunggah foto: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveApbdesImage = (index) => {
    const newDocs = (apbdesData.dokumentasi || []).filter((_, i) => i !== index);
    setApbdesData({ ...apbdesData, dokumentasi: newDocs });
  };

  // REALISASI HANDLERS
  const fetchRealisasi = async (tahun) => {
    setIsFetchingRealisasi(true);
    try {
      const res = await axios.get(`${API_URL}/realisasi/${tahun}`);
      if (res.data && res.data.data) {
        let raw = res.data.data;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
        }
        if (raw && typeof raw === 'object') {
          setRealisasiData({
            pendapatan: Array.isArray(raw.pendapatan) ? raw.pendapatan : [],
            belanja: Array.isArray(raw.belanja) ? raw.belanja : [],
            pembiayaan: Array.isArray(raw.pembiayaan) ? raw.pembiayaan : [],
            dokumentasi: Array.isArray(raw.dokumentasi) ? raw.dokumentasi : []
          });
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data Realisasi APBDes:', err);
    } finally {
      setIsFetchingRealisasi(false);
    }
  };

  const handleSaveRealisasi = async () => {
    try {
      await axios.put(`${API_URL}/realisasi/${realisasiYear}`, { data: realisasiData });
      alert(`Data Laporan Realisasi tahun ${realisasiYear} berhasil disimpan!`);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan Data Laporan Realisasi APBDes.');
    }
  };

  const handleAddRealisasiItem = (category) => {
    const newItem = { id: `r_${Date.now()}`, nama: '', anggaran: 0, realisasi: 0, subItems: [] };
    setRealisasiData({
      ...realisasiData,
      [category]: [...(realisasiData[category] || []), newItem]
    });
  };

  const handleAddRealisasiSubItem = (category, parentIndex) => {
    const newSub = { id: `r_sub_${Date.now()}`, nama: '', anggaran: 0, realisasi: 0 };
    const list = [...(realisasiData[category] || [])];
    const parent = { ...list[parentIndex] };
    parent.subItems = [...(parent.subItems || []), newSub];
    list[parentIndex] = parent;
    setRealisasiData({ ...realisasiData, [category]: list });
  };

  const handleRealisasiItemChange = (category, itemIndex, subIndex, field, value) => {
    const list = [...(realisasiData[category] || [])];
    if (subIndex === null || subIndex === undefined) {
      list[itemIndex] = { ...list[itemIndex], [field]: value };
    } else {
      const parent = { ...list[itemIndex] };
      const subList = [...(parent.subItems || [])];
      subList[subIndex] = { ...subList[subIndex], [field]: value };
      parent.subItems = subList;
      list[itemIndex] = parent;
    }
    setRealisasiData({ ...realisasiData, [category]: list });
  };

  const handleRemoveRealisasiItem = (category, itemIndex, subIndex) => {
    const list = [...(realisasiData[category] || [])];
    if (subIndex === null || subIndex === undefined) {
      const filtered = list.filter((_, i) => i !== itemIndex);
      setRealisasiData({ ...realisasiData, [category]: filtered });
    } else {
      const parent = { ...list[itemIndex] };
      parent.subItems = (parent.subItems || []).filter((_, i) => i !== subIndex);
      list[itemIndex] = parent;
      setRealisasiData({ ...realisasiData, [category]: list });
    }
  };

  const handleRealisasiImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const currentCount = (realisasiData.dokumentasi || []).length;
    if (currentCount + files.length > 10) {
      alert(`Maksimal 10 foto. Anda saat ini memiliki ${currentCount} foto.`);
      return;
    }
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    try {
      const res = await axios.post(`${API_URL}/realisasi/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.filenames) {
        setRealisasiData({
          ...realisasiData,
          dokumentasi: [...(realisasiData.dokumentasi || []), ...res.data.filenames]
        });
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload gambar dokumentasi');
    }
  };

  const handleRemoveRealisasiImage = (index) => {
    const newDocs = (realisasiData.dokumentasi || []).filter((_, i) => i !== index);
    setRealisasiData({ ...realisasiData, dokumentasi: newDocs });
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts?kategori=${activeTab}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ judul: '', deskripsi: '' });
    setThumbnail(null);
    setThumbnailPreview(null);
    setDokumentasi([]);
    setExistingDokumentasi([]);
    setDeletedDokumentasi([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (post) => {
    setEditingId(post.id);
    setFormData({ judul: post.judul, deskripsi: post.deskripsi });
    setThumbnail(null);
    setThumbnailPreview(post.thumbnail ? `/uploads/${post.thumbnail}` : null);
    setDokumentasi([]); 
    setExistingDokumentasi([]);
    setDeletedDokumentasi([]);
    setIsModalOpen(true);

    try {
      const res = await axios.get(`${API_URL}/posts/${post.id}`);
      if (res.data && res.data.dokumentasi) {
        setExistingDokumentasi(res.data.dokumentasi);
      }
    } catch (err) {
      console.error('Gagal mengambil data dokumentasi lama', err);
    }
  };

  const handleDeleteExistingDoc = (url) => {
    setExistingDokumentasi(prev => prev.filter(item => item !== url));
    setDeletedDokumentasi(prev => [...prev, url]);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const imageDataUrl = await readFile(file);
        setImageSrc(imageDataUrl);
        setShowCropper(true); 
      } catch (err) {
        console.error('Cropper error:', err);
      }
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 'thumbnail.webp');
      setThumbnail(croppedImage); 
      setThumbnailPreview(URL.createObjectURL(croppedImage));
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      alert('Gagal memotong gambar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('judul', formData.judul);
    data.append('deskripsi', formData.deskripsi);
    if (thumbnail) data.append('thumbnail', thumbnail);
    
    setIsPostSubmitting(true);
    try {
      if (editingId) {
        Array.from(dokumentasi).forEach(file => data.append('dokumentasi', file));
        data.append('deletedDokumentasi', JSON.stringify(deletedDokumentasi));
        await axios.put(`${API_URL}/posts/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Berhasil diperbarui!');
      } else {
        data.append('kategori', activeTab);
        Array.from(dokumentasi).forEach(file => data.append('dokumentasi', file));
        await axios.post(`${API_URL}/posts`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Berhasil ditambahkan!');
      }
      
      setIsModalOpen(false);
      fetchPosts();
    } catch (err) {
      alert('Gagal memproses data: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsPostSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus?')) {
      try {
        await axios.delete(`${API_URL}/posts/${id}`);
        fetchPosts();
      } catch (err) {
        alert('Gagal menghapus');
      }
    }
  };

  const tabs = [
    { id: 'penduduk', label: 'Tata Kelola (Penduduk)' },
    { id: 'apbdes', label: 'APB Desa' },
    { id: 'realisasi', label: 'Laporan Realisasi' },
    { id: 'rkp', label: 'RKP' },
    { id: 'kegiatan', label: 'Kegiatan Lainnya' },
    { id: 'profil', label: 'Profil Desa' },
    { id: 'peta', label: 'Peta & Lokasi Desa' },
    { id: 'tema', label: 'Pengaturan Web' },
    { id: 'backup', label: 'Backup & Restore' }
  ];

  const handleUmurChange = (gender, index, value) => {
    const newUmurData = { ...pendudukData.umur_data };
    newUmurData[gender][index].count = parseInt(value) || 0;
    setPendudukData({ ...pendudukData, umur_data: newUmurData });
  };

  const handleAddPekerjaan = () => {
    setPendudukData({
      ...pendudukData,
      pekerjaan_data: [...(pendudukData.pekerjaan_data || []), { nama: '', jumlah: 0 }]
    });
  };

  const handlePekerjaanChange = (index, field, value) => {
    const newPekerjaan = [...pendudukData.pekerjaan_data];
    if (field === 'jumlah') value = parseInt(value) || 0;
    newPekerjaan[index][field] = value;
    setPendudukData({ ...pendudukData, pekerjaan_data: newPekerjaan });
  };

  const handleRemovePekerjaan = (index) => {
    const newPekerjaan = pendudukData.pekerjaan_data.filter((_, i) => i !== index);
    setPendudukData({ ...pendudukData, pekerjaan_data: newPekerjaan });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apbdes':
        return (
          <div className="table-container" style={{ padding: '24px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Pengaturan Infografis APBD Desa</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Atur rincian pendapatan, belanja, dan pembiayaan per tahun anggaran</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontWeight: 'bold', color: '#334155', margin: 0, fontSize: '0.9rem' }}>Tahun:</label>
                  <select 
                    value={apbdesYear} 
                    onChange={(e) => {
                      const yr = parseInt(e.target.value);
                      setApbdesYear(yr);
                      fetchApbdes(yr);
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.95rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8' }}
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>Tahun {yr}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={handleSaveApbdes} 
                  className="btn-save" 
                  style={{ padding: '10px 18px', fontSize: '0.95rem', background: 'var(--primary-color)', color: 'var(--text-on-primary)', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                >
                  <Save size={16} /> <span style={{ color: 'var(--text-on-primary)' }}>Simpan APBD Desa</span>
                </button>
              </div>
            </div>

            <div style={{ opacity: isFetchingApbdes ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: isFetchingApbdes ? 'none' : 'auto' }}>
              {/* PENDAPATAN DESA */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. PENDAPATAN DESA</h4>
                <button 
                  type="button" 
                  onClick={() => handleAddApbdesItem('pendapatan')} 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Tambah Poin Pendapatan
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b' }}>
                <span></span>
                <span>Nama Poin</span>
                <span>Nominal (Rp)</span>
                <span></span>
                <span style={{ textAlign: 'center' }}>,XX (Sen)</span>
                <span></span>
              </div>

              {(apbdesData.pendapatan || []).map((item, idx) => {
                if (!item) return null;
                const val = parseFloat(item.jumlah) || 0;
                const mainVal = Math.floor(Math.abs(val));
                const decVal = Math.round((Math.abs(val) % 1) * 100);
                const decStr = decVal < 10 ? `0${decVal}` : `${decVal}`;

                return (
                  <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#64748b', textAlign: 'center' }}>{String.fromCharCode(97 + idx)}.</span>
                    <input 
                      type="text" 
                      value={item.nama} 
                      onChange={e => handleApbdesItemChange('pendapatan', idx, 'nama', e.target.value)} 
                      placeholder="Nama Pendapatan"
                      className="form-control" 
                    />
                    <input 
                      type="number" 
                      step="1"
                      value={mainVal} 
                      onChange={e => {
                        const m = parseInt(e.target.value) || 0;
                        handleApbdesItemChange('pendapatan', idx, 'jumlah', m + (decVal / 100));
                      }} 
                      placeholder="Nominal (Rp)"
                      className="form-control" 
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', color: '#475569' }}>,</span>
                    <input 
                      type="number" 
                      min="0"
                      max="99"
                      placeholder="00"
                      value={decStr} 
                      onChange={e => {
                        let d = parseInt(e.target.value) || 0;
                        if (d < 0) d = 0;
                        if (d > 99) d = 99;
                        handleApbdesItemChange('pendapatan', idx, 'jumlah', mainVal + (d / 100));
                      }} 
                      className="form-control" 
                      style={{ textAlign: 'center', fontWeight: 'bold' }}
                      title="2 angka di belakang koma (sen)"
                    />
                    <button type="button" onClick={() => handleRemoveApbdesItem('pendapatan', idx)} className="btn btn-danger" style={{ padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', color: '#1e293b' }}>
                <span>JUMLAH PENDAPATAN</span>
                <span style={{ color: '#16a34a' }}>
                  Rp {(apbdesData.pendapatan || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* BELANJA DESA */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. BELANJA DESA</h4>
                <button 
                  type="button" 
                  onClick={() => handleAddApbdesItem('belanja')} 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Tambah Poin Belanja
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b' }}>
                <span></span>
                <span>Nama Bidang Belanja</span>
                <span>Nominal (Rp)</span>
                <span></span>
                <span style={{ textAlign: 'center' }}>,XX (Sen)</span>
                <span></span>
              </div>

              {(apbdesData.belanja || []).map((item, idx) => {
                if (!item) return null;
                const val = parseFloat(item.jumlah) || 0;
                const mainVal = Math.floor(Math.abs(val));
                const decVal = Math.round((Math.abs(val) % 1) * 100);
                const decStr = decVal < 10 ? `0${decVal}` : `${decVal}`;

                return (
                  <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#64748b', textAlign: 'center' }}>{String.fromCharCode(97 + idx)}.</span>
                    <input 
                      type="text" 
                      value={item.nama} 
                      onChange={e => handleApbdesItemChange('belanja', idx, 'nama', e.target.value)} 
                      placeholder="Nama Bidang Belanja"
                      className="form-control" 
                    />
                    <input 
                      type="number" 
                      step="1"
                      value={mainVal} 
                      onChange={e => {
                        const m = parseInt(e.target.value) || 0;
                        handleApbdesItemChange('belanja', idx, 'jumlah', m + (decVal / 100));
                      }} 
                      placeholder="Nominal (Rp)"
                      className="form-control" 
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', color: '#475569' }}>,</span>
                    <input 
                      type="number" 
                      min="0"
                      max="99"
                      placeholder="00"
                      value={decStr} 
                      onChange={e => {
                        let d = parseInt(e.target.value) || 0;
                        if (d < 0) d = 0;
                        if (d > 99) d = 99;
                        handleApbdesItemChange('belanja', idx, 'jumlah', mainVal + (d / 100));
                      }} 
                      className="form-control" 
                      style={{ textAlign: 'center', fontWeight: 'bold' }}
                      title="2 angka di belakang koma (sen)"
                    />
                    <button type="button" onClick={() => handleRemoveApbdesItem('belanja', idx)} className="btn btn-danger" style={{ padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', color: '#1e293b' }}>
                <span>JUMLAH BELANJA</span>
                <span style={{ color: '#dc2626' }}>
                  Rp {(apbdesData.belanja || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* SURPLUS / DEFISIT */}
              {(() => {
                const pend = (apbdesData.pendapatan || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0);
                const bel = (apbdesData.belanja || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0);
                const diff = pend - bel;
                return (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', color: '#0f172a' }}>
                    <span>SURPLUS / (DEFISIT)</span>
                    <span style={{ color: diff >= 0 ? '#16a34a' : '#dc2626' }}>
                      {diff < 0 ? `(Rp ${Math.abs(diff).toLocaleString('id-ID', { minimumFractionDigits: 2 })})` : `Rp ${diff.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* PEMBIAYAAN DESA */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. PEMBIAYAAN DESA</h4>
                <button 
                  type="button" 
                  onClick={() => handleAddApbdesItem('pembiayaan')} 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Tambah Poin Pembiayaan
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b' }}>
                <span></span>
                <span>Nama Pembiayaan</span>
                <span>Nominal (Rp)</span>
                <span></span>
                <span style={{ textAlign: 'center' }}>,XX (Sen)</span>
                <span></span>
              </div>

              {(apbdesData.pembiayaan || []).map((item, idx) => {
                if (!item) return null;
                const val = parseFloat(item.jumlah) || 0;
                const mainVal = Math.floor(Math.abs(val));
                const decVal = Math.round((Math.abs(val) % 1) * 100);
                const decStr = decVal < 10 ? `0${decVal}` : `${decVal}`;

                return (
                  <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '25px 1fr 160px 10px 75px 40px', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#64748b', textAlign: 'center' }}>{String.fromCharCode(97 + idx)}.</span>
                    <input 
                      type="text" 
                      value={item.nama} 
                      onChange={e => handleApbdesItemChange('pembiayaan', idx, 'nama', e.target.value)} 
                      placeholder="Nama Pembiayaan"
                      className="form-control" 
                    />
                    <input 
                      type="number" 
                      step="1"
                      value={mainVal} 
                      onChange={e => {
                        const m = parseInt(e.target.value) || 0;
                        handleApbdesItemChange('pembiayaan', idx, 'jumlah', m + (decVal / 100));
                      }} 
                      placeholder="Nominal (Rp)"
                      className="form-control" 
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', color: '#475569' }}>,</span>
                    <input 
                      type="number" 
                      min="0"
                      max="99"
                      placeholder="00"
                      value={decStr} 
                      onChange={e => {
                        let d = parseInt(e.target.value) || 0;
                        if (d < 0) d = 0;
                        if (d > 99) d = 99;
                        handleApbdesItemChange('pembiayaan', idx, 'jumlah', mainVal + (d / 100));
                      }} 
                      className="form-control" 
                      style={{ textAlign: 'center', fontWeight: 'bold' }}
                      title="2 angka di belakang koma (sen)"
                    />
                    <button type="button" onClick={() => handleRemoveApbdesItem('pembiayaan', idx)} className="btn btn-danger" style={{ padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              {(() => {
                const pend = (apbdesData.pendapatan || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0);
                const bel = (apbdesData.belanja || []).reduce((acc, curr) => acc + (parseFloat(curr.jumlah) || 0), 0);
                const surplus = pend - bel;

                let penerimaan = 0;
                let pengeluaran = 0;
                (apbdesData.pembiayaan || []).forEach(item => {
                  const val = parseFloat(item.jumlah) || 0;
                  if (item.nama.toLowerCase().includes('pengeluaran')) {
                    pengeluaran += val;
                  } else {
                    penerimaan += val;
                  }
                });
                const selisihPembiayaan = penerimaan - pengeluaran;
                const silpa = surplus + selisihPembiayaan;

                return (
                  <>
                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#334155' }}>
                      <span>Selisih Pembiayaan (Penerimaan - Pengeluaran)</span>
                      <span>Rp {selisihPembiayaan.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>
                      <span>Sisa Lebih / (Kurang) Perhitungan Anggaran (SiLPA)</span>
                      <span style={{ color: silpa >= 0 ? '#16a34a' : '#dc2626' }}>
                        Rp {silpa.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* DOKUMENTASI / LAMPIRAN FOTO (MAKS 10) */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  4. DOKUMENTASI & LAMPIRAN FOTO (MAKSIMAL 10 FOTO)
                </h4>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                  {(apbdesData.dokumentasi || []).length}/10 Foto
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                {(apbdesData.dokumentasi || []).map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img src={getUploadUrl(img)} alt={`Foto ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveApbdesImage(idx)}
                      style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {(apbdesData.dokumentasi || []).length < 10 && (
                <div>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', background: 'white', border: '1px dashed #0284c7', color: '#0284c7', fontWeight: 'bold' }}>
                    <ImageIcon size={16} /> Upload Foto Dokumentasi (Maks 10)
                    <input type="file" accept="image/*" multiple onChange={handleApbdesImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>
          </div>

            <button 
              type="button" 
              onClick={handleSaveApbdes} 
              className="btn-save" 
              style={{ padding: '14px 24px', width: '100%', fontSize: '1.15rem', background: 'var(--primary-color)', color: 'var(--text-on-primary)', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none' }}
            >
              <Save size={20} /> <span style={{ color: 'var(--text-on-primary)' }}>Simpan APBD Desa Tahun {apbdesYear}</span>
            </button>
          </div>
        );
      case 'realisasi':
        return (
          <div className="table-container fade-in" style={{ padding: '24px', maxWidth: '950px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a', fontWeight: '800' }}>Kelola Laporan Realisasi APBD Desa</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kelola Anggaran vs Realisasi APBDes (Pendapatan, Belanja, Pembiayaan & Sub-Poin)</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#334155' }}>Tahun Anggaran:</span>
                <select 
                  value={realisasiYear} 
                  onChange={(e) => {
                    const yr = parseInt(e.target.value);
                    setRealisasiYear(yr);
                    fetchRealisasi(yr);
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.95rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8' }}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>Tahun {yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SEKSI REALISASI: PENDAPATAN, BELANJA, PEMBIAYAAN */}
            {['pendapatan', 'belanja', 'pembiayaan'].map((cat) => {
              const catLabels = {
                pendapatan: { title: '1. PENDAPATAN DESA', color: '#d97706', btnText: 'Tambah Poin Pendapatan' },
                belanja: { title: '2. BELANJA DESA', color: '#0284c7', btnText: 'Tambah Poin Belanja' },
                pembiayaan: { title: '3. PEMBIAYAAN DESA', color: '#9333ea', btnText: 'Tambah Poin Pembiayaan' }
              };
              const items = realisasiData[cat] || [];

              return (
                <div key={cat} style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, color: catLabels[cat].color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catLabels[cat].title}</h4>
                    <button 
                      type="button" 
                      onClick={() => handleAddRealisasiItem(cat)} 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    >
                      <Plus size={14} /> {catLabels[cat].btnText}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '25px 1fr 140px 140px 140px 40px', gap: '8px', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b' }}>
                    <span></span>
                    <span>Uraian / Nama Poin</span>
                    <span style={{ textAlign: 'right' }}>Anggaran (Rp)</span>
                    <span style={{ textAlign: 'right' }}>Realisasi (Rp)</span>
                    <span style={{ textAlign: 'right' }}>Selisih (Rp)</span>
                    <span></span>
                  </div>

                  {items.map((item, idx) => {
                    const hasSub = item.subItems && item.subItems.length > 0;
                    const subAnggaran = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.anggaran) || 0), 0) : 0;
                    const subRealisasi = hasSub ? item.subItems.reduce((a, c) => a + (parseFloat(c.realisasi) || 0), 0) : 0;

                    const itemAnggaran = hasSub ? subAnggaran : (parseFloat(item.anggaran) || 0);
                    const itemRealisasi = hasSub ? subRealisasi : (parseFloat(item.realisasi) || 0);
                    const selisih = itemAnggaran - itemRealisasi;

                    return (
                      <div key={item.id || idx} style={{ marginBottom: '12px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        {/* MAIN ITEM ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: '25px 1fr 140px 140px 140px 40px', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>{String.fromCharCode(97 + idx)}.</span>
                          <input 
                            type="text" 
                            value={item.nama} 
                            onChange={e => handleRealisasiItemChange(cat, idx, null, 'nama', e.target.value)} 
                            placeholder="Nama Uraian Poin Utama"
                            className="form-control" 
                            style={{ fontWeight: 'bold' }}
                          />

                          {/* ANGGARAN INPUT / DISPLAY */}
                          {hasSub ? (
                            <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#334155', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px' }}>
                              {itemAnggaran.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <input 
                              type="number" 
                              step="0.01"
                              value={item.anggaran} 
                              onChange={e => handleRealisasiItemChange(cat, idx, null, 'anggaran', parseFloat(e.target.value) || 0)} 
                              placeholder="Anggaran (Rp)"
                              className="form-control" 
                              style={{ textAlign: 'right', fontWeight: 'bold' }}
                            />
                          )}

                          {/* REALISASI INPUT / DISPLAY */}
                          {hasSub ? (
                            <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#0284c7', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px' }}>
                              {itemRealisasi.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <input 
                              type="number" 
                              step="0.01"
                              value={item.realisasi} 
                              onChange={e => handleRealisasiItemChange(cat, idx, null, 'realisasi', parseFloat(e.target.value) || 0)} 
                              placeholder="Realisasi (Rp)"
                              className="form-control" 
                              style={{ textAlign: 'right', fontWeight: 'bold', color: '#0284c7' }}
                            />
                          )}

                          {/* SELISIH DISPLAY */}
                          <div style={{ textAlign: 'right', fontWeight: 'bold', color: selisih >= 0 ? '#16a34a' : '#dc2626', padding: '6px' }}>
                            {selisih < 0 ? `(${Math.abs(selisih).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : selisih.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>

                          <button type="button" onClick={() => handleRemoveRealisasiItem(cat, idx, null)} className="btn btn-danger" style={{ padding: '6px' }} title="Hapus Poin">
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* SUB-ITEMS SECTION */}
                        <div style={{ marginLeft: '35px', marginTop: '8px', borderLeft: '3px solid #e2e8f0', paddingLeft: '12px' }}>
                          {(item.subItems || []).map((sub, sIdx) => {
                            const subAng = parseFloat(sub.anggaran) || 0;
                            const subReal = parseFloat(sub.realisasi) || 0;
                            const subSel = subAng - subReal;

                            return (
                              <div key={sub.id || sIdx} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 140px 140px 140px 30px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                                <input 
                                  type="text" 
                                  value={sub.nama} 
                                  onChange={e => handleRealisasiItemChange(cat, idx, sIdx, 'nama', e.target.value)} 
                                  placeholder="Nama Sub-Poin"
                                  className="form-control" 
                                  style={{ fontSize: '0.9rem' }}
                                />
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={sub.anggaran} 
                                  onChange={e => handleRealisasiItemChange(cat, idx, sIdx, 'anggaran', parseFloat(e.target.value) || 0)} 
                                  placeholder="Anggaran (Rp)"
                                  className="form-control" 
                                  style={{ textAlign: 'right', fontSize: '0.9rem' }}
                                />
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={sub.realisasi} 
                                  onChange={e => handleRealisasiItemChange(cat, idx, sIdx, 'realisasi', parseFloat(e.target.value) || 0)} 
                                  placeholder="Realisasi (Rp)"
                                  className="form-control" 
                                  style={{ textAlign: 'right', fontSize: '0.9rem', color: '#0284c7' }}
                                />
                                <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: subSel >= 0 ? '#16a34a' : '#dc2626' }}>
                                  {subSel < 0 ? `(${Math.abs(subSel).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : subSel.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <button type="button" onClick={() => handleRemoveRealisasiItem(cat, idx, sIdx)} className="btn btn-danger" style={{ padding: '4px' }} title="Hapus Sub-Poin">
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}

                          <button 
                            type="button" 
                            onClick={() => handleAddRealisasiSubItem(cat, idx)} 
                            style={{ background: 'transparent', border: '1px dashed #94a3b8', color: '#475569', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={12} /> Tambah Sub-Poin untuk {item.nama || `Poin ${idx + 1}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* DOKUMENTASI & LAMPIRAN FOTO REALISASI */}
            <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  4. DOKUMENTASI & LAMPIRAN FOTO REALISASI (MAKSIMAL 10 FOTO)
                </h4>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                  {(realisasiData.dokumentasi || []).length}/10 Foto
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                {(realisasiData.dokumentasi || []).map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img src={getUploadUrl(img)} alt={`Foto Realisasi ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveRealisasiImage(idx)}
                      style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {(realisasiData.dokumentasi || []).length < 10 && (
                <div>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', background: 'white', border: '1px dashed #0284c7', color: '#0284c7', fontWeight: 'bold' }}>
                    <ImageIcon size={16} /> Upload Foto Dokumentasi Realisasi (Maks 10)
                    <input type="file" accept="image/*" multiple onChange={handleRealisasiImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={handleSaveRealisasi} 
              className="btn-save" 
              style={{ padding: '14px 24px', width: '100%', fontSize: '1.15rem', background: '#0284c7', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none' }}
            >
              <Save size={20} /> Simpan Laporan Realisasi APBD Desa Tahun {realisasiYear}
            </button>
          </div>
        );
      case 'rkp':
        return (
          <div className="table-container fade-in" style={{ padding: '24px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a', fontWeight: '800' }}>Kelola Rencana Kerja Pemerintah Desa (RKP)</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kelola narasi penjelasan RKP dan lampiran dokumen (PDF, Word, Excel, ZIP, dll)</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#334155' }}>Tahun Anggaran:</span>
                <select 
                  value={rkpYear} 
                  onChange={(e) => {
                    const yr = parseInt(e.target.value);
                    setRkpYear(yr);
                    fetchRkp(yr);
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.95rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #94a3b8' }}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>Tahun {yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveRkp(); }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', display: 'block' }}>Judul RKP Desa</label>
                <input 
                  type="text" 
                  required 
                  value={rkpData.judul || ''} 
                  onChange={e => setRkpData({ ...rkpData, judul: e.target.value })} 
                  placeholder={`Rencana Kerja Pemerintah Desa (RKP) Tahun ${rkpYear}`}
                  className="form-control"
                  style={{ padding: '10px 14px', fontSize: '1rem', fontWeight: '600' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Isi Penjelasan / Narasi RKP Desa</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={handleInsertBold} 
                      style={{ padding: '5px 12px', fontSize: '0.85rem', fontWeight: '900', background: '#0f172a', color: 'white', borderRadius: '6px', cursor: 'pointer', border: 'none' }}
                      title="Tebalkan teks yang disorot atau sisipkan **Teks**"
                    >
                      B (Bold)
                    </button>
                    <button 
                      type="button" 
                      onClick={handleInsertItalic} 
                      style={{ padding: '5px 12px', fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 'bold', background: '#f1f5f9', color: '#0f172a', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                      title="Miringkan teks"
                    >
                      I (Miring)
                    </button>
                    <button 
                      type="button" 
                      onClick={handleInsertBullet} 
                      style={{ padding: '5px 12px', fontSize: '0.85rem', fontWeight: 'bold', background: '#f1f5f9', color: '#0f172a', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                      title="Sisipkan Poin Bullet"
                    >
                      • Bullet Poin
                    </button>
                  </div>
                </div>
                <textarea 
                  id="rkpNarasiTextarea"
                  rows="10" 
                  value={rkpData.narasi || ''} 
                  onChange={e => setRkpData({ ...rkpData, narasi: e.target.value })} 
                  placeholder="Tuliskan narasi penjelasan RKP Desa secara lengkap (Sorot teks lalu klik tombol B (Bold) untuk menebalkan kata yang diinginkan, misal: **Program Prioritas**)..."
                  className="form-control"
                  style={{ padding: '12px 14px', fontSize: '0.95rem', lineHeight: '1.6' }}
                ></textarea>
                <small style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '6px', display: 'block' }}>
                  💡 <strong>Tips Format:</strong> Blok / sorot teks lalu klik tombol <strong>B (Bold)</strong> untuk menebalkan teks di tampilan publik, atau ketik <code>**kata**</code> secara manual.
                </small>
              </div>

              {/* LAMPIRAN DOKUMEN (PDF, WORD, EXCEL, ZIP, DLL) */}
              <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    LAMPIRAN DOKUMEN (PDF, WORD, EXCEL, ZIP, DLL)
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                    {(rkpData.dokumen || []).length} Dokumen Terlampir
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                  {(rkpData.dokumen || []).map((doc, idx) => {
                    const ext = doc.filename ? doc.filename.split('.').pop().toLowerCase() : '';
                    let badgeColor = '#64748b';
                    if (['pdf'].includes(ext)) badgeColor = '#dc2626';
                    if (['doc', 'docx'].includes(ext)) badgeColor = '#2563eb';
                    if (['xls', 'xlsx'].includes(ext)) badgeColor = '#16a34a';

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ background: badgeColor, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {ext || 'FILE'}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{doc.originalname || doc.filename}</div>
                            {doc.size && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{(doc.size / 1024).toFixed(1)} KB</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a 
                            href={`/uploads/${doc.filename}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', background: '#f1f5f9', color: '#334155', fontWeight: 'bold' }}
                          >
                            Buka / Unduh
                          </a>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRkpDoc(idx)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px' }} 
                            title="Hapus Dokumen"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', background: 'white', border: '1px dashed #2563eb', color: '#2563eb', fontWeight: 'bold' }}>
                    <Plus size={16} /> Upload Lampiran Dokumen (PDF, Word, Excel, Zip, dll)
                    <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,image/*" onChange={handleRkpDocUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-save" 
                style={{ padding: '14px 24px', width: '100%', fontSize: '1.15rem', background: '#2563eb', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none' }}
              >
                <Save size={20} /> Simpan Data RKP Desa Tahun {rkpYear}
              </button>
            </form>
          </div>
        );
      case 'penduduk':
        return (
          <div className="table-container" style={{ padding: '20px', maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Pengaturan Tata Kelola Penduduk</h3>
            <form onSubmit={handlePendudukSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Total Penduduk (Jiwa)</label>
                  <input type="number" required value={pendudukData.total_penduduk} onChange={e => setPendudukData({...pendudukData, total_penduduk: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Kepala Keluarga (KK)</label>
                  <input type="number" required value={pendudukData.kepala_keluarga} onChange={e => setPendudukData({...pendudukData, kepala_keluarga: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Jumlah Laki-Laki (Jiwa)</label>
                  <input type="number" required value={pendudukData.laki_laki} onChange={e => setPendudukData({...pendudukData, laki_laki: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Jumlah Perempuan (Jiwa)</label>
                  <input type="number" required value={pendudukData.perempuan} onChange={e => setPendudukData({...pendudukData, perempuan: e.target.value})} />
                </div>
              </div>

              <hr style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

              <h4>Data Kelompok Umur</h4>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ marginBottom: '10px', color: '#3b82f6' }}>Laki-Laki</h5>
                  {(pendudukData.umur_data?.laki_laki || []).map((item, idx) => (
                    <div key={`l-${idx}`} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <label style={{ width: '60px', margin: 0 }}>{item.range}</label>
                      <input type="number" value={item.count} onChange={e => handleUmurChange('laki_laki', idx, e.target.value)} style={{ flex: 1 }} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ marginBottom: '10px', color: '#f43f5e' }}>Perempuan</h5>
                  {(pendudukData.umur_data?.perempuan || []).map((item, idx) => (
                    <div key={`p-${idx}`} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <label style={{ width: '60px', margin: 0 }}>{item.range}</label>
                      <input type="number" value={item.count} onChange={e => handleUmurChange('perempuan', idx, e.target.value)} style={{ flex: 1 }} />
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

              <h4>Data Pekerjaan</h4>
              {pendudukData.pekerjaan_data && pendudukData.pekerjaan_data.map((job, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <input type="text" placeholder="Nama Pekerjaan" value={job.nama} onChange={e => handlePekerjaanChange(idx, 'nama', e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} required />
                  <input type="number" placeholder="Jumlah" value={job.jumlah} onChange={e => handlePekerjaanChange(idx, 'jumlah', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} required />
                  <button type="button" onClick={() => handleRemovePekerjaan(idx)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
                </div>
              ))}
              <button type="button" onClick={handleAddPekerjaan} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' }}>+ Tambah Pekerjaan</button>

              <hr style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

              {/* LAMPIRAN DOKUMEN PENDUDUK (PDF, HTML, EXCEL, WORD, DLL) */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    LAMPIRAN DOKUMEN DATA PENDUDUK (.PDF, .HTML, .XLSX, .DOC, DLL)
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                    {(pendudukData.dokumen || []).length} Dokumen Terlampir
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                  {(pendudukData.dokumen || []).map((doc, idx) => {
                    const ext = doc.filename ? doc.filename.split('.').pop().toLowerCase() : '';
                    let badgeColor = '#64748b';
                    if (['pdf'].includes(ext)) badgeColor = '#dc2626';
                    if (['html', 'htm'].includes(ext)) badgeColor = '#ea580c';
                    if (['doc', 'docx'].includes(ext)) badgeColor = '#2563eb';
                    if (['xls', 'xlsx', 'csv'].includes(ext)) badgeColor = '#16a34a';

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ background: badgeColor, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {ext || 'FILE'}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{doc.originalname || doc.filename}</div>
                            {doc.size && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{(doc.size / 1024).toFixed(1)} KB</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a 
                            href={`/uploads/${doc.filename}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', background: '#f1f5f9', color: '#334155', fontWeight: 'bold' }}
                          >
                            Buka / Unduh
                          </a>
                          <button 
                            type="button" 
                            onClick={() => handleRemovePendudukDoc(idx)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px' }} 
                            title="Hapus Dokumen"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', background: 'white', border: '1px dashed #2563eb', color: '#2563eb', fontWeight: 'bold' }}>
                    <Plus size={16} /> Upload Lampiran Dokumen (.pdf, .html, .xlsx, .doc, .zip, dll)
                    <input type="file" multiple accept=".pdf,.html,.htm,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,image/*" onChange={handlePendudukDocUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-save" style={{ marginTop: '20px', padding: '12px' }}>Simpan Perubahan</button>
            </form>
          </div>
        );
      case 'peta':
        return <PetaTab />;
      case 'backup':
        return <BackupTab />;
      case 'tema':
        return (
          <div className="card" style={{ padding: '20px' }}>
            <h2 className="section-title">Pengaturan Web & Tema</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Tema Warna Keseluruhan</h3>
              <p style={{ color: '#64748b', marginBottom: '15px' }}>
                Pilih satu warna dasar. Sistem akan secara otomatis membuat 10 variasi kontras dari warna ini untuk digunakan pada seluruh halaman website.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <input 
                    type="color" 
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{ width: '80px', height: '80px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    title="Pilih warna kustom"
                  />
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Warna Saat Ini</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: themeColor }}>
                      {themeColor.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', color: '#475569', margin: '15px 0 10px 0' }}>Atau Pilih dari Preset Warna (Sesuai Abjad):</h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                    gap: '10px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}>
                    {colorPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setThemeColor(preset.hex);
                          applyTheme(preset.hex);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          border: themeColor.toLowerCase() === preset.hex.toLowerCase() ? '2px solid #000' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: preset.hex, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                        <span style={{ fontSize: '0.85rem', fontWeight: themeColor.toLowerCase() === preset.hex.toLowerCase() ? 'bold' : 'normal', color: '#334155' }}>
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* HERO SLIDER BACKGROUND BERANDA */}
            <div style={{ marginBottom: '30px', background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>Pengaturan Hero Slider Background Beranda (Maks 5 Foto)</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Foto-foto ini akan bergantian secara otomatis (*slide carousel*) pada latar belakang beranda utama</p>
                </div>
                {safeArray(heroSlider).length < 5 && (
                  <button 
                    type="button"
                    onClick={() => setHeroSlider([...safeArray(heroSlider), ''])}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Tambah Slide Foto
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {safeArray(heroSlider).map((slideUrl, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Slide #{idx + 1}</span>
                      {safeArray(heroSlider).length > 1 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newS = safeArray(heroSlider).filter((_, i) => i !== idx);
                            setHeroSlider(newS);
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Hapus Slide Ini"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ width: '100%', height: '130px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {slideUrl ? (
                        <img src={getUploadUrl(slideUrl)} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Belum Ada Foto 16:9</span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Upload & Crop Foto 16:9</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleSelectHeroSlide(idx, e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        style={{ fontSize: '0.75rem', width: '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Pengaturan Footer & Informasi</h3>
              
              <div className="form-group">
                <label>Deskripsi Footer</label>
                <textarea 
                  value={footerDesc} 
                  onChange={e => setFooterDesc(e.target.value)} 
                  rows="3"
                  className="form-control"
                  placeholder="Deskripsi singkat desa..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Alamat Lengkap</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  className="form-control"
                  placeholder="Kec. Arjasa, Situbondo..."
                />
              </div>

              <div className="form-group">
                <label>Email Resmi</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="form-control"
                  placeholder="email@desa.id"
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Kontak &amp; WhatsApp Desa</h3>
                <button 
                  onClick={() => setContacts([...safeArray(contacts), { name: '', phone: '' }])}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                  <Plus size={14} /> Tambah Kontak
                </button>
              </div>

              {safeArray(contacts).length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  Belum ada kontak. Klik Tambah Kontak.
                </div>
              ) : (
                safeArray(contacts).map((contact, i) => (
                  <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'flex-start', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold' }}>Nama / Label Kontak</label>
                      <input 
                        type="text" 
                        value={contact.name || ''}
                        onChange={(e) => {
                          const newC = [...safeArray(contacts)];
                          newC[i] = { ...newC[i], name: e.target.value };
                          setContacts(newC);
                        }}
                        className="form-control" 
                        placeholder="Misal: Layanan Balai Desa" 
                        style={{ padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 'bold' }}>No. WhatsApp</label>
                      <input 
                        type="text" 
                        value={contact.phone || ''}
                        onChange={(e) => {
                          const newC = [...safeArray(contacts)];
                          newC[i] = { ...newC[i], phone: e.target.value };
                          setContacts(newC);
                        }}
                        className="form-control" 
                        placeholder="Contoh: 6287283..." 
                        style={{ padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <button 
                      onClick={() => setContacts(safeArray(contacts).filter((_, idx) => idx !== i))}
                      className="btn btn-danger" 
                      style={{ padding: '8px', marginTop: '26px' }}
                      title="Hapus Kontak"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button onClick={handleSaveTheme} className="btn-save" style={{ padding: '12px 24px', width: '100%', fontSize: '1.1rem' }}>
              Simpan Pengaturan Web
            </button>
          </div>
        );
      case 'profil':
        return (
          <div className="table-container fade-in" style={{ padding: '24px', maxWidth: '950px' }}>
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '25px' }}>
              <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a', fontWeight: '800' }}>Pengaturan Profil Desa Curah Tatal</h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kelola seluruh data Profil Desa, Visi Misi, Sejarah, Geografis, Dusun, Perangkat Desa, BPD, dan Sarpras</p>
            </div>
            
            {/* 1. VISI & MISI DESA */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Visi & Misi Desa</h4>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Visi Desa</label>
                <textarea 
                  value={profilVisi || ''} 
                  onChange={e => setProfilVisi(e.target.value)} 
                  rows="2"
                  className="form-control"
                  style={{ fontWeight: '600' }}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', color: '#10b981' }}>Hashtag / Slogan Visi (misal: #CurahTatalJAYA)</label>
                <input 
                  type="text"
                  value={profilTagline || ''} 
                  onChange={e => setProfilTagline(e.target.value)} 
                  className="form-control"
                  placeholder="misal: #CurahTatalJAYA"
                  style={{ fontWeight: '800' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0, fontWeight: 'bold' }}>Daftar Misi Desa</label>
                  <button onClick={() => setProfilMisi([...safeArray(profilMisi), ''])} type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Tambah Misi
                  </button>
                </div>
                {safeArray(profilMisi).map((misi, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#64748b', padding: '8px 0' }}>{i + 1}.</span>
                    <input 
                      type="text" 
                      value={misi || ''} 
                      onChange={e => {
                        const newMisi = [...safeArray(profilMisi)];
                        newMisi[i] = e.target.value;
                        setProfilMisi(newMisi);
                      }} 
                      className="form-control"
                    />
                    <button onClick={() => setProfilMisi(safeArray(profilMisi).filter((_, idx) => idx !== i))} type="button" className="btn btn-danger" style={{ padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SEJARAH DESA */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Sejarah Singkat & Asal Usul Nama Desa</h4>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>Teks Narasi Sejarah Desa</label>
                <textarea 
                  value={profilSejarah || ''} 
                  onChange={e => setProfilSejarah(e.target.value)} 
                  rows="6"
                  className="form-control"
                  style={{ lineHeight: '1.6' }}
                ></textarea>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0, fontWeight: 'bold' }}>Sejarah Kepemimpinan (Urutan Kepala Desa)</label>
                  <button onClick={() => setProfilKadesHistory([...safeArray(profilKadesHistory), { kades: '', periode: '' }])} type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Tambah Kepala Desa
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {safeArray(profilKadesHistory).map((kh, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569', minWidth: '24px' }}>{i + 1}.</span>
                      <input 
                        type="text" 
                        placeholder="Nama Kepala Desa (misal: Bapak Sohaban)"
                        value={kh.kades || ''} 
                        onChange={e => {
                          const newK = [...safeArray(profilKadesHistory)];
                          newK[i] = { ...newK[i], kades: e.target.value };
                          setProfilKadesHistory(newK);
                        }} 
                        className="form-control"
                        style={{ flex: 2 }}
                      />
                      <input 
                        type="text" 
                        placeholder="Masa Jabatan / Periode (misal: 1921 - 1930)"
                        value={kh.periode || ''} 
                        onChange={e => {
                          const newK = [...safeArray(profilKadesHistory)];
                          newK[i] = { ...newK[i], periode: e.target.value };
                          setProfilKadesHistory(newK);
                        }} 
                        className="form-control"
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => setProfilKadesHistory(safeArray(profilKadesHistory).filter((_, idx) => idx !== i))} type="button" className="btn btn-danger" style={{ padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. KONDISI GEOGRAFIS */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Kondisi Geografis, Batas Wilayah & Orbitasi</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Luas Wilayah (Km²)</label>
                  <input 
                    type="text" 
                    value={profilGeografis.luas_wilayah || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, luas_wilayah: e.target.value })}
                    className="form-control"
                    placeholder="misal: 42,56 km²"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Luas Hektar</label>
                  <input 
                    type="text" 
                    value={profilGeografis.luas_hektar || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, luas_hektar: e.target.value })}
                    className="form-control"
                    placeholder="misal: 15.663,1 Ha"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Ketinggian (mdpl)</label>
                  <input 
                    type="text" 
                    value={profilGeografis.ketinggian || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, ketinggian: e.target.value })}
                    className="form-control"
                    placeholder="misal: 20,5 mdpl"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Topografi</label>
                  <input 
                    type="text" 
                    value={profilGeografis.topografi || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, topografi: e.target.value })}
                    className="form-control"
                    placeholder="misal: Dataran Tinggi / Perbukitan"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jarak ke Kecamatan</label>
                  <input 
                    type="text" 
                    value={profilGeografis.jarak_kecamatan || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, jarak_kecamatan: e.target.value })}
                    className="form-control"
                    placeholder="misal: 7 - 11 KM"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jarak ke Kabupaten</label>
                  <input 
                    type="text" 
                    value={profilGeografis.jarak_kabupaten || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, jarak_kabupaten: e.target.value })}
                    className="form-control"
                    placeholder="misal: 19 - 25 KM"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#2563eb' }}>Batas Utara</label>
                  <input 
                    type="text" 
                    value={profilGeografis.batas_utara || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, batas_utara: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#16a34a' }}>Batas Timur</label>
                  <input 
                    type="text" 
                    value={profilGeografis.batas_timur || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, batas_timur: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#d97706' }}>Batas Selatan</label>
                  <input 
                    type="text" 
                    value={profilGeografis.batas_selatan || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, batas_selatan: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#dc2626' }}>Batas Barat</label>
                  <input 
                    type="text" 
                    value={profilGeografis.batas_barat || ''} 
                    onChange={e => setProfilGeografis({ ...profilGeografis, batas_barat: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>Teks Deskripsi Geografis & Pertanian</label>
                <textarea 
                  value={profilGeografis.deskripsi || ''} 
                  onChange={e => setProfilGeografis({ ...profilGeografis, deskripsi: e.target.value })} 
                  rows="4"
                  className="form-control"
                  style={{ lineHeight: '1.6' }}
                ></textarea>
              </div>
            </div>

            {/* 4. WILAYAH DUSUN & KEPALA DUSUN */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Wilayah Administrasi Dusun & Kepala Dusun</h4>
                <button onClick={() => setProfilDusun([...safeArray(profilDusun), { nama: '', rt: '', kasun: '' }])} type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Tambah Dusun
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safeArray(profilDusun).map((dusun, i) => {
                  const dObj = typeof dusun === 'object' && dusun !== null ? dusun : { nama: dusun, rt: '', kasun: '' };
                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569', minWidth: '24px' }}>{i + 1}.</span>
                      <input 
                        type="text" 
                        placeholder="Nama Dusun (misal: Krajan)"
                        value={dObj.nama || ''} 
                        onChange={e => {
                          const newD = [...safeArray(profilDusun)];
                          const item = typeof newD[i] === 'object' && newD[i] !== null ? newD[i] : { nama: newD[i], rt: '', kasun: '' };
                          newD[i] = { ...item, nama: e.target.value };
                          setProfilDusun(newD);
                        }} 
                        className="form-control"
                        style={{ flex: 1, fontWeight: '600' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Jumlah RT (misal: 4 RT)"
                        value={dObj.rt || ''} 
                        onChange={e => {
                          const newD = [...safeArray(profilDusun)];
                          const item = typeof newD[i] === 'object' && newD[i] !== null ? newD[i] : { nama: newD[i], rt: '', kasun: '' };
                          newD[i] = { ...item, rt: e.target.value };
                          setProfilDusun(newD);
                        }} 
                        className="form-control"
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        placeholder="Nama Kepala Dusun (misal: SAMITO)"
                        value={dObj.kasun || ''} 
                        onChange={e => {
                          const newD = [...safeArray(profilDusun)];
                          const item = typeof newD[i] === 'object' && newD[i] !== null ? newD[i] : { nama: newD[i], rt: '', kasun: '' };
                          newD[i] = { ...item, kasun: e.target.value };
                          setProfilDusun(newD);
                        }} 
                        className="form-control"
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => setProfilDusun(safeArray(profilDusun).filter((_, idx) => idx !== i))} type="button" className="btn btn-danger" style={{ padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. STRUKTUR PERANGKAT DESA, STAF & KADUS */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>5. Struktur Pemerintah Desa (Perangkat Desa, Staf & Kadus)</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Edit nama, gelar, staf bawahan, dan kepala dusun untuk bagan struktur organisasi desa</p>
                </div>
                <button onClick={() => setProfilPerangkat([...safeArray(profilPerangkat), { nama: '', jabatan: '', staf: '' }])} type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Tambah Posisi / Perangkat
                </button>
              </div>

              {/* PERANGKAT & STAF */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: '800', fontSize: '0.95rem' }}>A. Perangkat Desa & Staf Bawahan:</h5>
                {safeArray(profilPerangkat).map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569', minWidth: '24px' }}>{i + 1}.</span>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Jabatan</label>
                      <input 
                        type="text" 
                        placeholder="Jabatan (misal: Kasi Pemerintahan)"
                        value={p.jabatan || ''} 
                        onChange={e => {
                          const newP = [...safeArray(profilPerangkat)];
                          newP[i] = { ...newP[i], jabatan: e.target.value };
                          setProfilPerangkat(newP);
                        }} 
                        className="form-control"
                        style={{ marginTop: '2px' }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Nama & Gelar</label>
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap & Gelar (misal: JAMILULLOH, S.Pd.I)"
                        value={p.nama || ''} 
                        onChange={e => {
                          const newP = [...safeArray(profilPerangkat)];
                          newP[i] = { ...newP[i], nama: e.target.value };
                          setProfilPerangkat(newP);
                        }} 
                        className="form-control"
                        style={{ marginTop: '2px', fontWeight: '600' }}
                      />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold' }}>Nama Staf Bawahan (Jika Ada)</label>
                      <input 
                        type="text" 
                        placeholder="Nama Staf (misal: YUDA)"
                        value={p.staf || ''} 
                        onChange={e => {
                          const newP = [...safeArray(profilPerangkat)];
                          newP[i] = { ...newP[i], staf: e.target.value };
                          setProfilPerangkat(newP);
                        }} 
                        className="form-control"
                        style={{ marginTop: '2px' }}
                      />
                    </div>
                    <button onClick={() => setProfilPerangkat(safeArray(profilPerangkat).filter((_, idx) => idx !== i))} type="button" className="btn btn-danger" style={{ padding: '8px', marginTop: '18px' }} title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* KEPALA DUSUN (10 DUSUN) */}
              <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <h5 style={{ margin: '0 0 12px 0', color: '#1e293b', fontWeight: '800', fontSize: '0.95rem' }}>B. Nama Kepala Dusun (10 Dusun untuk Bagan):</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {safeArray(profilDusun).map((dusun, i) => {
                    const dObj = typeof dusun === 'object' && dusun !== null ? dusun : { nama: dusun, rt: '', kasun: '' };
                    return (
                      <div key={i} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Kadus {dObj.nama || `Dusun ${i+1}`}</label>
                        <input 
                          type="text" 
                          placeholder="Nama Kepala Dusun"
                          value={dObj.kasun || ''} 
                          onChange={e => {
                            const newD = [...safeArray(profilDusun)];
                            const item = typeof newD[i] === 'object' && newD[i] !== null ? newD[i] : { nama: newD[i], rt: '', kasun: '' };
                            newD[i] = { ...item, kasun: e.target.value };
                            setProfilDusun(newD);
                          }} 
                          className="form-control"
                          style={{ marginTop: '4px', fontWeight: '600' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6. SARANA, PRASARANA & FASILITAS DESA */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6. Sarana, Prasarana & Fasilitas Desa</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jalan Hotmix</label>
                  <input 
                    type="text" 
                    value={profilSarpras.jalan_hotmix || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, jalan_hotmix: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jalan Aspal</label>
                  <input 
                    type="text" 
                    value={profilSarpras.jalan_aspal || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, jalan_aspal: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jalan Makadam</label>
                  <input 
                    type="text" 
                    value={profilSarpras.jalan_makadam || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, jalan_makadam: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jalan Tanah / Paving</label>
                  <input 
                    type="text" 
                    value={profilSarpras.jalan_paving || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, jalan_paving: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Poskesdes</label>
                  <input 
                    type="text" 
                    value={profilSarpras.poskesdes || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, poskesdes: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Posyandu</label>
                  <input 
                    type="text" 
                    value={profilSarpras.posyandu || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, posyandu: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Tenaga Kesehatan</label>
                  <input 
                    type="text" 
                    value={profilSarpras.tenaga_kesehatan || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, tenaga_kesehatan: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Sekolah (SD/SMP/PAUD)</label>
                  <input 
                    type="text" 
                    value={profilSarpras.sekolah || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, sekolah: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Tempat Ibadah (Masjid/Mushalla)</label>
                  <input 
                    type="text" 
                    value={profilSarpras.tempat_ibadah || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, tempat_ibadah: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold' }}>Jaringan Listrik PLN</label>
                  <input 
                    type="text" 
                    value={profilSarpras.listrik_pln || ''} 
                    onChange={e => setProfilSarpras({ ...profilSarpras, listrik_pln: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* 7. KARTU APARAT PEMERINTAH DESA (FOTO 3x4, WA & EMAIL) */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>7. Kartu Aparat Pemerintah Desa (Foto 3x4, Kontak WA & Email)</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Upload foto formal 3x4 (otomatis di-crop 3:4), atur nama, jabatan, serta link kontak WhatsApp & Email</p>
                </div>
                <button onClick={() => setProfilAparat([...safeArray(profilAparat), { nama: '', jabatan: '', foto: '', wa: '', email: '' }])} type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Tambah Kartu Aparat
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {safeArray(profilAparat).map((aparat, i) => (
                  <div key={i} style={{ background: 'white', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                    
                    {/* FOTO PREVIEW 3x4 & UPLOADER */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '75px', height: '100px', background: '#f1f5f9', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        {aparat.foto ? (
                          <img src={getUploadUrl(aparat.foto)} alt={aparat.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', fontWeight: 'bold' }}>Foto 3x4</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Upload & Crop Foto 3x4</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleSelectAparatFoto(i, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                          style={{ fontSize: '0.75rem', width: '100%' }}
                        />
                        {aparat.foto && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newA = [...safeArray(profilAparat)];
                              newA[i] = { ...newA[i], foto: '' };
                              setProfilAparat(newA);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px', padding: 0 }}
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>

                    {/* NAMA & JABATAN */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Nama Lengkap & Gelar</label>
                      <input 
                        type="text" 
                        placeholder="misal: SUSWANTO, S.Sos."
                        value={aparat.nama || ''} 
                        onChange={e => {
                          const newA = [...safeArray(profilAparat)];
                          newA[i] = { ...newA[i], nama: e.target.value };
                          setProfilAparat(newA);
                        }} 
                        className="form-control"
                        style={{ marginTop: '2px', fontWeight: 'bold' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Jabatan</label>
                      <input 
                        type="text" 
                        placeholder="misal: Kepala Desa"
                        value={aparat.jabatan || ''} 
                        onChange={e => {
                          const newA = [...safeArray(profilAparat)];
                          newA[i] = { ...newA[i], jabatan: e.target.value };
                          setProfilAparat(newA);
                        }} 
                        className="form-control"
                        style={{ marginTop: '2px' }}
                      />
                    </div>

                    {/* WA & EMAIL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 'bold' }}>No. WhatsApp</label>
                        <input 
                          type="text" 
                          placeholder="62812..."
                          value={aparat.wa || ''} 
                          onChange={e => {
                            const newA = [...safeArray(profilAparat)];
                            newA[i] = { ...newA[i], wa: e.target.value };
                            setProfilAparat(newA);
                          }} 
                          className="form-control"
                          style={{ marginTop: '2px', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 'bold' }}>Email Resmi</label>
                        <input 
                          type="email" 
                          placeholder="email@..."
                          value={aparat.email || ''} 
                          onChange={e => {
                            const newA = [...safeArray(profilAparat)];
                            newA[i] = { ...newA[i], email: e.target.value };
                            setProfilAparat(newA);
                          }} 
                          className="form-control"
                          style={{ marginTop: '2px', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => setProfilAparat(safeArray(profilAparat).filter((_, idx) => idx !== i))} 
                      type="button" 
                      className="btn btn-danger" 
                      style={{ padding: '6px', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Trash2 size={14} /> Hapus Kartu
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveTheme} className="btn-save" style={{ padding: '14px 24px', width: '100%', fontSize: '1.15rem', background: '#10b981', color: 'white', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none' }}>
              <Save size={20} /> Simpan Seluruh Pengaturan Profil Desa
            </button>
          </div>
        );
      default:
        return (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Thumbnail</th>
                  <th>Judul</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr><td colSpan="5" className="text-center" style={{padding: '30px'}}>Belum ada data</td></tr>
                ) : (
                  posts.map((post, i) => (
                    <tr key={post.id}>
                      <td>{i + 1}</td>
                      <td>
                        {post.thumbnail ? (
                          <img src={getUploadUrl(post.thumbnail)} alt="thumb" className="t-thumb" />
                        ) : <ImageIcon />}
                      </td>
                      <td>{post.judul}</td>
                      <td>{new Date(post.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button onClick={() => openEditModal(post)} className="btn-delete" style={{background: '#fef08a', color: '#854d0e'}}><Edit size={16} /></button>
                          <button onClick={() => handleDelete(post.id)} className="btn-delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* MOBILE NAVBAR HEADER */}
      <div className="mobile-admin-header">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="mobile-hamburger-btn"
          aria-label="Menu Admin"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h3 className="mobile-admin-title">Panel Admin</h3>
        <button onClick={handleLogout} className="mobile-logout-btn" title="Keluar">
          <LogOut size={20} />
        </button>
      </div>

      {/* BACKDROP UNTUK SIDEBAR MOBILE */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h2>Panel Admin</h2>
        <ul className="nav-menu">
          {tabs.map(tab => (
            <li 
              key={tab.id} 
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
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
              {tab.id === 'peta' && <MapPin size={16} style={{marginRight: '6px'}} />}
              {tab.id === 'tema' && <Palette size={16} style={{marginRight: '6px'}} />}
              {tab.id === 'profil' && <BookOpen size={16} style={{marginRight: '6px'}} />}
              {tab.id === 'backup' && <Database size={16} style={{marginRight: '6px'}} />}
              {tab.label}
            </li>
          ))}
        </ul>
        <div style={{ padding: '0 15px', marginBottom: '15px' }}>
          <button 
            onClick={() => setIsPassModalOpen(true)} 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            <KeyRound size={16} /> Ganti Password
          </button>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} /> Keluar
        </button>
      </aside>

      <main className="content-area">
        <header className="content-header">
          <h1>Kelola Data: {tabs.find(t => t.id === activeTab)?.label}</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setIsPassModalOpen(true)} 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.88rem', borderRadius: '6px' }}
            >
              <KeyRound size={16} /> Ganti Password
            </button>
            {activeTab !== 'penduduk' && activeTab !== 'apbdes' && activeTab !== 'realisasi' && activeTab !== 'tema' && activeTab !== 'profil' && activeTab !== 'peta' && activeTab !== 'backup' && (
              <button onClick={openAddModal} className="btn-add">
                <Plus size={18} /> Tambah Baru
              </button>
            )}
          </div>
        </header>

        {renderTabContent()}

        {/* Modal Tambah/Edit Data */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>{editingId ? 'Edit' : 'Tambah'} {tabs.find(t => t.id === activeTab)?.label || 'Data'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Judul</label>
                  <input type="text" required value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <textarea rows="4" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                </div>
                
                <div className="form-group">
                  <label>Thumbnail (1 Foto)</label>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <input type="file" accept="image/*" onChange={handleFileChange} required={!editingId && !thumbnail} id="thumbnailUpload" style={{display: 'none'}} />
                    <label htmlFor="thumbnailUpload" className="btn-add" style={{cursor: 'pointer', background: '#3b82f6'}}>
                      <Crop size={16} /> Pilih & Potong Foto
                    </label>
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" style={{height: '40px', borderRadius: '4px'}} />}
                  </div>
                  {editingId && <small style={{color: '#64748b', display: 'block', marginTop: '5px'}}>*Biarkan kosong jika tidak ingin mengubah foto</small>}
                </div>

                <div className="form-group">
                  <label>Dokumentasi Tambahan (Maks 10 Foto Baru)</label>
                  <input type="file" accept="image/*" multiple onChange={e => setDokumentasi(e.target.files)} />
                  {dokumentasi && dokumentasi.length > 0 && (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                      {Array.from(dokumentasi).map((file, idx) => (
                        <div key={idx} style={{width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                          <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {editingId && existingDokumentasi.length > 0 && (
                  <div className="form-group">
                    <label>Foto Dokumentasi Lama (Klik ❌ untuk menghapus)</label>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                      {existingDokumentasi.map((url, i) => (
                        <div key={i} style={{position: 'relative', width: '80px', height: '80px'}}>
                          <img src={getUploadUrl(url)} alt="doc" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px'}} />
                          <button 
                            type="button"
                            onClick={() => handleDeleteExistingDoc(url)}
                            style={{
                              position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', 
                              color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', 
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button type="button" disabled={isPostSubmitting} onClick={() => setIsModalOpen(false)} className="btn-cancel">Batal</button>
                  <button 
                    type="submit" 
                    disabled={isPostSubmitting} 
                    className="btn-save" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      opacity: isPostSubmitting ? 0.7 : 1, 
                      cursor: isPostSubmitting ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {isPostSubmitting ? (
                      <>
                        <span 
                          style={{ 
                            display: 'inline-block', 
                            width: '16px', 
                            height: '16px', 
                            border: '2.5px solid rgba(255,255,255,0.3)', 
                            borderTopColor: '#ffffff', 
                            borderRadius: '50%', 
                            animation: 'spin 0.8s linear infinite' 
                          }} 
                        />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Data</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL GANTI PASSWORD ADMIN */}
        {isPassModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '450px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={20} style={{ color: '#f59e0b' }} /> Ganti Username &amp; Password Admin
                </h2>
                <button type="button" onClick={() => setIsPassModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Password Saat Ini *</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password admin saat ini"
                    value={passForm.currentPassword}
                    onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                    className="form-control"
                    style={{ padding: '9px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Username Baru (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika tidak ingin mengubah username"
                    value={passForm.newUsername}
                    onChange={e => setPassForm({ ...passForm, newUsername: e.target.value })}
                    className="form-control"
                    style={{ padding: '9px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Password Baru *</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password baru (min 4 karakter)"
                    value={passForm.newPassword}
                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                    className="form-control"
                    style={{ padding: '9px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Konfirmasi Password Baru *</label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi password baru Anda"
                    value={passForm.confirmPassword}
                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    className="form-control"
                    style={{ padding: '9px 12px' }}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '10px' }}>
                  <button type="button" disabled={isPassSubmitting} onClick={() => setIsPassModalOpen(false)} className="btn-cancel">Batal</button>
                  <button type="submit" disabled={isPassSubmitting} className="btn-save" style={{ background: '#f59e0b', color: 'white', fontWeight: 'bold' }}>
                    {isPassSubmitting ? 'Memproses...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* LAYAR PENUH CROPPER 3x4 FOTO APARAT */}
        {showAparatCropper && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crop size={22} style={{ color: '#10b981' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Potong & Atur Posisi Foto 3x4 Aparat</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Geser & perbesar foto agar pas di dalam garis kotak seleksi 3:4</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAparatCropper(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ position: 'relative', flex: 1, background: '#000000' }}>
              <Cropper
                image={aparatCropSrc}
                crop={aparatCrop}
                zoom={aparatZoom}
                aspect={3 / 4}
                onCropChange={setAparatCrop}
                onCropComplete={onAparatCropComplete}
                onZoomChange={setAparatZoom}
                showGrid={true}
              />
            </div>

            <div style={{
              padding: '20px 24px', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', 
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Perbesar (Zoom):</span>
                <input 
                  type="range" 
                  value={aparatZoom} 
                  min={1} 
                  max={3} 
                  step={0.05}
                  onChange={(e) => setAparatZoom(parseFloat(e.target.value))} 
                  style={{ width: '200px', cursor: 'pointer' }}
                />
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>{Math.round(aparatZoom * 100)}%</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAparatCropper(false)} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', background: '#334155', color: 'white', fontWeight: '600' }}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleSaveAparatCroppedImage} 
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  <Crop size={18} /> Simpan Potongan Foto 3x4
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LAYAR PENUH CROPPER 16:9 HERO SLIDER */}
        {showHeroCropper && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crop size={22} style={{ color: '#10b981' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Potong & Atur Posisi Foto Hero Background (16:9 Widescreen)</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Geser & perbesar foto agar pas di dalam bingkai lanskap beranda</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowHeroCropper(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ position: 'relative', flex: 1, background: '#000000' }}>
              <Cropper
                image={heroCropSrc}
                crop={heroCrop}
                zoom={heroZoom}
                aspect={16 / 9}
                onCropChange={setHeroCrop}
                onCropComplete={onHeroCropComplete}
                onZoomChange={setHeroZoom}
                showGrid={true}
              />
            </div>

            <div style={{
              padding: '20px 24px', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', 
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Perbesar (Zoom):</span>
                <input 
                  type="range" 
                  value={heroZoom} 
                  min={1} 
                  max={3} 
                  step={0.05}
                  onChange={(e) => setHeroZoom(parseFloat(e.target.value))} 
                  style={{ width: '200px', cursor: 'pointer' }}
                />
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>{Math.round(heroZoom * 100)}%</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowHeroCropper(false)} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', background: '#334155', color: 'white', fontWeight: '600' }}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleSaveHeroCroppedImage} 
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  <Crop size={18} /> Simpan Potongan Slider 16:9
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LAYAR PENUH CROPPER 16:9 THUMBNAIL BERITA & KEGIATAN */}
        {showCropper && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crop size={22} style={{ color: '#10b981' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Potong & Atur Posisi Foto Thumbnail (16:9 Landscape)</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Geser & perbesar foto agar pas di dalam bingkai thumbnail berita / kegiatan</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCropper(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ position: 'relative', flex: 1, background: '#000000' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
              />
            </div>

            <div style={{
              padding: '20px 24px', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', 
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>Perbesar (Zoom):</span>
                <input 
                  type="range" 
                  value={zoom} 
                  min={1} 
                  max={3} 
                  step={0.05}
                  onChange={(e) => setZoom(parseFloat(e.target.value))} 
                  style={{ width: '200px', cursor: 'pointer' }}
                />
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>{Math.round(zoom * 100)}%</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowCropper(false)} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', background: '#334155', color: 'white', fontWeight: '600' }}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={showCroppedImage} 
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  <Crop size={18} /> Simpan Potongan Foto
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
