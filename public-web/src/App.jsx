import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const Profil = lazy(() => import('./pages/Profil'));
const MapPage = lazy(() => import('./pages/MapPage'));
const DataDesaPage = lazy(() => import('./pages/DataDesaPage'));
const InfografisPage = lazy(() => import('./pages/InfografisPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));

const API_URL = import.meta.env.VITE_API_URL || '/api';

const applyTheme = (hex) => {
  // Convert hex to rgb
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
  
  // Convert rgb to hsl
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
      r = g = b = l; // achromatic
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

  // Set 10 contrast variations (lightness 0.95 down to 0.1)
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

function App() {
  const [webSettings, setWebSettings] = useState({
    footer_desc: 'Membangun desa wisata yang lestari, berdaya saing, dan sejahtera.',
    address: 'Kec. Arjasa, Situbondo 68371',
    email: 'pemdes@curahtatal.desa.id',
    contacts_data: []
  });

  useEffect(() => {
    const fetchSettings = () => {
      fetch(`${API_URL}/settings`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (data.theme_color) applyTheme(data.theme_color);
            setWebSettings(prev => ({
              ...prev,
              footer_desc: data.footer_desc || prev.footer_desc,
              address: data.address || prev.address,
              email: data.email || prev.email,
              contacts_data: data.contacts_data || prev.contacts_data
            }));
          }
        })
        .catch(err => console.error('Gagal memuat tema', err));
    };

    // Panggil saat pertama kali dimuat
    fetchSettings();

    // Re-fetch saat tab kembali dibuka/difokuskan (sangat berguna setelah ngedit di tab admin)
    window.addEventListener('focus', fetchSettings);

    // Re-fetch tiap 30 detik untuk jaga-jaga jika dibiarkan terbuka
    const intervalId = setInterval(fetchSettings, 30000);

    return () => {
      window.removeEventListener('focus', fetchSettings);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--primary-color)' }}>Memuat Halaman...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/tata-kelola" element={<InfografisPage />} />
            <Route path="/kegiatan" element={<DataDesaPage kategori="kegiatan" />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer settings={webSettings} />
    </div>
  );
}

export default App;
