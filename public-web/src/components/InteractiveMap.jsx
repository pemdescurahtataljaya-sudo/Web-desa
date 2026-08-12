import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, ExternalLink, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUploadUrl } from '../utils/url';
import './InteractiveMap.css';
import TypewriterText from './TypewriterText';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const InteractiveMap = () => {
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [activeGalleryLocation, setActiveGalleryLocation] = useState(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_URL}/locations`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const cleaned = data.map(item => {
          let galeri = item.galeri;
          while (typeof galeri === 'string') {
            try { galeri = JSON.parse(galeri); } catch(e) { break; }
          }
          return {
            ...item,
            galeri: Array.isArray(galeri) ? galeri : []
          };
        });
        setLocations(cleaned);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const filteredLocations = locations.filter(loc => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (loc.nama && loc.nama.toLowerCase().includes(q)) ||
      (loc.deskripsi && loc.deskripsi.toLowerCase().includes(q))
    );
  });

  const openGalleryModal = (loc, index = 0) => {
    setActiveGalleryLocation(loc);
    setCurrentGalleryIndex(index);
  };

  const closeGalleryModal = () => {
    setActiveGalleryLocation(null);
    setCurrentGalleryIndex(0);
  };

  const nextGalleryPhoto = () => {
    if (!activeGalleryLocation || !activeGalleryLocation.galeri) return;
    setCurrentGalleryIndex((prev) => (prev + 1) % activeGalleryLocation.galeri.length);
  };

  const prevGalleryPhoto = () => {
    if (!activeGalleryLocation || !activeGalleryLocation.galeri) return;
    setCurrentGalleryIndex((prev) => (prev - 1 + activeGalleryLocation.galeri.length) % activeGalleryLocation.galeri.length);
  };

  return (
    <div className="interactive-map-container" id="map-section">
      <div className="map-header">
        <h2><TypewriterText text="Peta Wilayah Desa Curah Tatal" /></h2>
        <p>Kecamatan Arjasa • Kabupaten Situbondo</p>
      </div>

      {/* CLEAN FULL-WIDTH MAP IFRAME (NO OVERLAY COVERING THE MAP) */}
      <div className="map-wrapper shadow-lg">
        <iframe
          title="Peta Satelit Desa Curah Tatal"
          src="https://maps.google.com/maps?q=Curah+Tatal,+Kec.+Arjasa,+Kabupaten+Situbondo,+Jawa+Timur&t=k&z=13&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="480"
          style={{ border: 0, borderRadius: '16px' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade">
        </iframe>
      </div>

      {/* TITIK LOKASI & DESTINASI DESA SECTION BELOW MAP */}
      <div className="locations-section" style={{ marginTop: '50px' }}>
        <div className="locations-section-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Titik Lokasi & Destinasi Desa Curah Tatal
            </h3>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.98rem' }}>
              Jelajahi lokasi penting, balai desa, fasilitas umum, serta tempat wisata yang tersedia di desa kami.
            </p>
          </div>

          {/* SEARCH FILTER BAR */}
          <div className="location-search-box" style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari titik lokasi atau tempat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
            />
          </div>
        </div>

        {/* LOCATIONS CARDS GRID */}
        <div className="locations-grid">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <div key={loc.id} className="location-card-item">
                {/* THUMBNAIL IMAGE (16:9) */}
                <div className="location-thumb-container">
                  {loc.foto ? (
                    <img src={getUploadUrl(loc.foto)} alt={loc.nama} className="location-thumb-img" />
                  ) : (
                    <div className="location-thumb-fallback">
                      <MapPin size={48} style={{ color: '#cbd5e1' }} />
                    </div>
                  )}

                  {/* GALLERY BADGE */}
                  {loc.galeri && loc.galeri.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openGalleryModal(loc, 0)}
                      className="gallery-badge-btn"
                    >
                      <ImageIcon size={14} /> {loc.galeri.length} Foto Terkait Lokasi
                    </button>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="location-card-content">
                  <h4 className="location-title">{loc.nama}</h4>
                  <p className="location-desc">
                    {loc.deskripsi || 'Lokasi publik Desa Curah Tatal.'}
                  </p>

                  {/* ACTION BUTTONS EXACTLY STYLED LIKE USER SCREENSHOT */}
                  <div className="location-action-buttons">
                    {loc.link_street_view ? (
                      <a
                        href={loc.link_street_view}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-map-yellow-solid"
                        title="Buka Google Street View 360°"
                      >
                        <MapPin size={18} /> Lihat Langsung
                      </a>
                    ) : (
                      <button type="button" disabled className="btn-map-yellow-solid disabled">
                        <MapPin size={18} /> Lihat Langsung
                      </button>
                    )}

                    {loc.link_rute ? (
                      <a
                        href={loc.link_rute}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-map-yellow-outline"
                        title="Buka Petunjuk Rute Navigasi Google Maps"
                      >
                        <Navigation size={18} /> Menuju
                      </a>
                    ) : (
                      <button type="button" disabled className="btn-map-yellow-outline disabled">
                        <Navigation size={18} /> Menuju
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-location-found">
              <MapPin size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <h4>Lokasi Tidak Ditemukan</h4>
              <p>Tidak ada lokasi yang cocok dengan kata kunci "{query}".</p>
            </div>
          )}
        </div>
      </div>

      {/* GALERI FOTO SUASANA SEKITAR LIGHTBOX POPUP MODAL */}
      {activeGalleryLocation && activeGalleryLocation.galeri && activeGalleryLocation.galeri.length > 0 && (
        <div className="gallery-lightbox-overlay" onClick={closeGalleryModal}>
          <div className="gallery-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-lightbox-header">
              <div>
                <h3>{activeGalleryLocation.nama}</h3>
                <p>Foto Terkait Lokasi ({currentGalleryIndex + 1} dari {activeGalleryLocation.galeri.length})</p>
              </div>
              <button type="button" onClick={closeGalleryModal} className="close-lightbox-btn">
                <X size={22} />
              </button>
            </div>

            <div className="gallery-lightbox-viewport">
              <img
                src={getUploadUrl(activeGalleryLocation.galeri[currentGalleryIndex])}
                alt={`Foto Terkait Lokasi ${currentGalleryIndex + 1}`}
                className="gallery-lightbox-img"
              />

              {activeGalleryLocation.galeri.length > 1 && (
                <>
                  <button type="button" onClick={prevGalleryPhoto} className="nav-lightbox-btn prev">
                    <ChevronLeft size={28} />
                  </button>
                  <button type="button" onClick={nextGalleryPhoto} className="nav-lightbox-btn next">
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAIL STRIP */}
            {activeGalleryLocation.galeri.length > 1 && (
              <div className="gallery-lightbox-thumbnails">
                {activeGalleryLocation.galeri.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentGalleryIndex(idx)}
                    className={`thumb-strip-item ${idx === currentGalleryIndex ? 'active' : ''}`}
                  >
                    <img src={getUploadUrl(img)} alt={`Thumb ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
