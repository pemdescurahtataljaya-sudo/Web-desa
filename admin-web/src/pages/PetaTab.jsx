import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, Edit, Crop, X, Save, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';
import { API_URL, getUploadUrl } from '../utils/url';

const PetaTab = () => {
  const [locations, setLocations] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationForm, setLocationForm] = useState({
    nama: '',
    deskripsi: '',
    link_street_view: '',
    link_rute: '',
    foto: ''
  });
  const [mainPhotoFile, setMainPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cropper State for Location Main Photo (16:9)
  const [showLocationCropper, setShowLocationCropper] = useState(false);
  const [locationCropSrc, setLocationCropSrc] = useState(null);
  const [locationCrop, setLocationCrop] = useState({ x: 0, y: 0 });
  const [locationZoom, setLocationZoom] = useState(1);
  const [locationCroppedAreaPixels, setLocationCroppedAreaPixels] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/locations`);
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocations([]);
    }
  };

  const handleOpenAddLocation = () => {
    setEditingLocationId(null);
    setMainPhotoFile(null);
    setLocationForm({
      nama: '',
      deskripsi: '',
      link_street_view: '',
      link_rute: '',
      foto: ''
    });
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc) => {
    setEditingLocationId(loc.id);
    setMainPhotoFile(null);
    setLocationForm({
      nama: loc.nama || '',
      deskripsi: loc.deskripsi || '',
      link_street_view: loc.link_street_view || '',
      link_rute: loc.link_rute || '',
      foto: loc.foto || ''
    });
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!locationForm.nama.trim()) {
      alert('Nama lokasi wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('nama', locationForm.nama);
      data.append('deskripsi', locationForm.deskripsi || '');
      data.append('link_street_view', locationForm.link_street_view || '');
      data.append('link_rute', locationForm.link_rute || '');
      data.append('foto', locationForm.foto || '');

      if (mainPhotoFile) {
        data.append('fotoFile', mainPhotoFile);
      }

      if (editingLocationId) {
        await axios.put(`${API_URL}/locations/${editingLocationId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Data lokasi berhasil diperbarui!');
      } else {
        await axios.post(`${API_URL}/locations`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Lokasi baru berhasil ditambahkan!');
      }

      setIsLocationModalOpen(false);
      fetchLocations();
    } catch (err) {
      console.error('Save location error:', err);
      alert('Gagal menyimpan lokasi: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) {
      try {
        await axios.delete(`${API_URL}/locations/${id}`);
        fetchLocations();
      } catch (err) {
        alert('Gagal menghapus lokasi');
      }
    }
  };

  // Main Photo Cropper Handling (16:9 Landscape)
  const handleLocationMainPhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setLocationCropSrc(reader.result);
        setShowLocationCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onLocationCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setLocationCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveLocationCrop = async () => {
    try {
      const file = await getCroppedImg(locationCropSrc, locationCroppedAreaPixels, `location_${Date.now()}.webp`);
      if (!file) return;

      setMainPhotoFile(file);
      setLocationForm(prev => ({ ...prev, foto: URL.createObjectURL(file) }));
      setShowLocationCropper(false);
      setLocationCropSrc(null);
    } catch (err) {
      console.error('Error cropping location photo:', err);
      alert('Gagal memotong foto: ' + err.message);
    }
  };

  return (
    <div className="table-container fade-in" style={{ padding: '24px', maxWidth: '1000px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a', fontWeight: '800' }}>Pengaturan Peta &amp; Titik Lokasi Desa</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kelola daftar titik lokasi penting, tempat wisata, fasilitas umum, link Street View &amp; petunjuk rute navigasi</p>
        </div>
        <button
          onClick={handleOpenAddLocation}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Tambah Lokasi Baru
        </button>
      </div>

      {/* LOCATION LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {locations.length > 0 ? locations.map((loc) => (
          <div key={loc.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
            {/* Foto Cover */}
            <div style={{ width: '100%', height: '160px', background: '#f1f5f9', position: 'relative' }}>
              {loc.foto ? (
                <img src={getUploadUrl(loc.foto)} alt={loc.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc' }}>
                  <MapPin size={40} opacity={0.4} />
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>{loc.nama}</h4>
              <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.85rem', flex: 1, lineHeight: '1.5' }}>
                {loc.deskripsi || 'Tidak ada deskripsi.'}
              </p>

              {/* Links */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {loc.link_street_view && (
                  <a href={loc.link_street_view} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ExternalLink size={12} /> Street View
                  </a>
                )}
                {loc.link_rute && (
                  <a href={loc.link_rute} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Navigation size={12} /> Link Rute
                  </a>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditLocation(loc)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(loc.id)}
                  className="btn btn-danger"
                  style={{ padding: '8px 12px' }}
                  title="Hapus Lokasi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            Belum ada titik lokasi desa yang ditambahkan. Klik tombol "Tambah Lokasi Baru" untuk menambahkan lokasi pertama.
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT LOKASI */}
      {isLocationModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>
                {editingLocationId ? 'Edit Lokasi Desa' : 'Tambah Lokasi Desa Baru'}
              </h3>
              <button type="button" onClick={() => setIsLocationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', display: 'block' }}>Nama Lokasi / Tempat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantor Desa Curah Tatal, Poskesdes, Air Terjun..."
                  value={locationForm.nama}
                  onChange={e => setLocationForm({ ...locationForm, nama: e.target.value })}
                  className="form-control"
                  style={{ padding: '10px 14px', fontSize: '0.95rem' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', display: 'block' }}>Deskripsi Singkat</label>
                <textarea
                  rows="3"
                  placeholder="Penjelasan mengenai fungsi lokasi, fasilitas yang ada, atau jam operasional..."
                  value={locationForm.deskripsi}
                  onChange={e => setLocationForm({ ...locationForm, deskripsi: e.target.value })}
                  className="form-control"
                  style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', display: 'block' }}>Link Google Street View (360°)</label>
                  <input
                    type="url"
                    placeholder="https://www.google.com/maps/place/..."
                    value={locationForm.link_street_view}
                    onChange={e => setLocationForm({ ...locationForm, link_street_view: e.target.value })}
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', display: 'block' }}>Link Petunjuk Rute (Navigasi)</label>
                  <input
                    type="url"
                    placeholder="https://www.google.com/maps/dir/..."
                    value={locationForm.link_rute}
                    onChange={e => setLocationForm({ ...locationForm, link_rute: e.target.value })}
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* FOTO UTAMA 16:9 WITH CROPPER */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Foto Utama Lokasi (Rasio 16:9)</label>
                  <span style={{ fontSize: '0.78rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Opsional</span>
                </div>
                {locationForm.foto ? (
                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                    <img src={getUploadUrl(locationForm.foto)} alt="Preview Foto Utama" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setLocationForm({ ...locationForm, foto: '' });
                        setMainPhotoFile(null);
                      }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus Foto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}

                <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 14px', fontSize: '0.85rem', background: 'white', border: '1px dashed #0284c7', color: '#0284c7', fontWeight: 'bold' }}>
                  <Crop size={16} /> {locationForm.foto ? 'Ganti Foto Utama (Potong 16:9)' : 'Pilih & Potong Foto Utama (16:9 - Opsional)'}
                  <input type="file" accept="image/*" onChange={handleLocationMainPhotoSelect} style={{ display: 'none' }} />
                </label>
              </div>

              {/* FORM BUTTONS */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsLocationModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-save"
                  style={{ flex: 2, padding: '12px', background: 'var(--primary-color)', color: 'var(--text-on-primary)', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  <Save size={18} /> {isSubmitting ? 'Menyimpan Data Lokasi...' : 'Simpan Data Lokasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROPPER MODAL FOTO UTAMA 16:9 */}
      {showLocationCropper && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '700px', height: '400px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            <Cropper
              image={locationCropSrc}
              crop={locationCrop}
              zoom={locationZoom}
              aspect={16 / 9}
              onCropChange={setLocationCrop}
              onCropComplete={onLocationCropComplete}
              onZoomChange={setLocationZoom}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'center' }}>
            <input
              type="range"
              value={locationZoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setLocationZoom(e.target.value)}
              style={{ width: '150px' }}
            />
            <button
              type="button"
              onClick={() => setShowLocationCropper(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveLocationCrop}
              className="btn btn-primary"
              style={{ fontWeight: 'bold' }}
            >
              Gunakan Foto Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetaTab;
