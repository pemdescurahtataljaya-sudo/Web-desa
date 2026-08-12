import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUploadUrl } from '../utils/url';
import './DataDesaPage.css';
import TypewriterText from '../components/TypewriterText';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const titleMap = {
  'apbdes': 'Anggaran Pendapatan & Belanja Desa',
  'realisasi': 'Laporan Realisasi APB Desa',
  'rkp': 'Rencana Kerja Pemerintah Desa (RKP)',
  'kegiatan': 'Kegiatan & Informasi Desa'
};

const DataDesaPage = ({ kategori, isComponent }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    window.addEventListener('focus', fetchPosts);
    const intervalId = setInterval(fetchPosts, 30000);
    return () => {
      window.removeEventListener('focus', fetchPosts);
      clearInterval(intervalId);
    };
  }, [kategori]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts?kategori=${kategori}`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
    setLoading(false);
  };

  return (
    <div className={`data-desa-page ${isComponent ? 'no-padding-top' : ''}`}>
      {!isComponent && (
        <header className="page-header">
          <h1><TypewriterText key={kategori} text={titleMap[kategori] || 'Tata Kelola Desa Curah Tatal'} /></h1>
          <p>Tata Kelola & Transparansi Informasi Publik Desa Curah Tatal</p>
        </header>
      )}

      <div className="content-container">
        {loading ? (
          <p className="loading-text">Memuat data...</p>
        ) : posts.length === 0 ? (
          <p className="empty-text">Belum ada data untuk kategori ini.</p>
        ) : (
          <div className="card-grid">
            {posts.map(post => (
              <Link to={`/post/${post.id}`} key={post.id} style={{textDecoration: 'none', color: 'inherit'}}>
                <div className="data-card">
                  {post.thumbnail && (
                    <img src={getUploadUrl(post.thumbnail)} alt={post.judul} className="card-img" />
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{post.judul}</h3>
                    <span className="card-date">{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                    <p className="card-desc">
                      {post.deskripsi ? post.deskripsi.substring(0, 100) + '...' : 'Tidak ada deskripsi.'}
                    </p>
                    <span style={{color: 'var(--secondary-color)', fontWeight: 600, marginTop: '12px', display: 'inline-block', fontSize: '0.9rem'}}>Baca Selengkapnya &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDesaPage;
