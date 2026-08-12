import { ArrowRight, Mountain, Trees, Users } from 'lucide-react';
import './Home.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TypewriterText from '../components/TypewriterText';

const defaultHeroSlider = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80'
];

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Home = () => {
  const [sliderImages, setSliderImages] = useState(defaultHeroSlider);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.hero_slider) && data.hero_slider.length > 0) {
          const valid = data.hero_slider.filter(img => typeof img === 'string' && img.trim() !== '');
          if (valid.length > 0) setSliderImages(valid);
        }
      })
      .catch(err => console.error('Gagal memuat hero slider', err));
  }, []);

  // Auto Play Background Slider Every 5 Seconds
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages]);

  return (
    <div className="home-page">
      {/* Hero Section with Dynamic Background Slider */}
      <section className="hero">
        {/* SLIDER BACKGROUND IMAGES */}
        <div className="hero-slider-bg-container">
          {sliderImages.map((imgUrl, index) => {
            let finalSrc = imgUrl;
            if (typeof imgUrl === 'string') {
              if (imgUrl.startsWith('/uploads/')) {
                finalSrc = `${API_URL.replace('/api', '')}${imgUrl}`;
              } else if (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://')) {
                finalSrc = `${API_URL.replace('/api', '')}/uploads/${imgUrl}`;
              }
            }
            return (
              <div
                key={index}
                className={`hero-slide-bg ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${finalSrc})` }}
              />
            );
          })}
          {/* DARK GRADIENT OVERLAY FOR HIGH CONTRAST */}
          <div className="hero-slider-overlay" />
        </div>

        {/* HERO CONTENT */}
        <div className="hero-content slide-up">
          <span className="badge">Selamat Datang di</span>
          <h1 style={{ display: 'flex', justifyContent: 'center' }}>
            <TypewriterText text="Desa Curah Tatal" />
          </h1>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', margin: '4px 0 14px 0', textShadow: '0 2px 8px rgba(0,0,0,0.5)', opacity: 0.95 }}>
            Kecamatan Arjasa, Kabupaten Situbondo
          </div>
          <p>Pesona alam pegunungan, potensi pertanian melimpah, dan keramahan warga di Kecamatan Arjasa, Situbondo.</p>
          <div className="hero-actions">
            <Link to="/profil" className="btn btn-primary">Kenali Kami Lebih Dekat</Link>
            <Link to="/map" className="btn btn-outline" style={{borderColor: 'white', color: 'white'}}>Jelajahi Peta</Link>
          </div>

          {/* SLIDER DOT INDICATORS */}
          {sliderImages.length > 1 && (
            <div className="hero-slider-dots">
              {sliderImages.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Transparansi & Tata Kelola Desa */}
      <section className="cta-section container" style={{ marginTop: '40px', marginBottom: '60px' }}>
        <div className="cta-card glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>
            Transparansi APBD & Realisasi Desa
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#475569', maxWidth: '700px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Akses rincian Anggaran Pendapatan & Belanja Desa (APBDes), Laporan Realisasi Anggaran, serta Rencana Kerja Pemerintah Desa (RKP) secara terbuka & akuntabel.
          </p>
          <Link to="/tata-kelola" className="btn btn-primary flex items-center gap-2" style={{ margin: '0 auto', width: 'fit-content', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 'bold' }}>
            Lihat Tata Kelola Desa <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
