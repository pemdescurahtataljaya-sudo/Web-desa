import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, X, FileText, FileSpreadsheet, FileCode, Paperclip } from 'lucide-react';
import { getUploadUrl } from '../utils/url';
import './PostDetailPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getFileIcon = (filename) => {
  if (!filename) return <FileText size={20} style={{ color: '#2563eb' }} />;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return <FileSpreadsheet size={20} style={{ color: '#16a34a' }} />;
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    return <FileText size={20} style={{ color: '#2563eb' }} />;
  }
  if (lower.endsWith('.pdf')) {
    return <FileText size={20} style={{ color: '#dc2626' }} />;
  }
  return <Paperclip size={20} style={{ color: '#64748b' }} />;
};

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // State untuk Lightbox

  useEffect(() => {
    fetchPostDetail();
    window.scrollTo(0, 0); // Gulir ke atas saat halaman dibuka
    window.addEventListener('focus', fetchPostDetail);
    const intervalId = setInterval(fetchPostDetail, 30000);
    return () => {
      window.removeEventListener('focus', fetchPostDetail);
      clearInterval(intervalId);
    };
  }, [id]);

  const fetchPostDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/${id}`);
      const data = await response.json();
      setPost(data);
    } catch (err) {
      console.error('Gagal mengambil detail:', err);
    }
    setLoading(false);
  };

  const handleDownload = async (imgUrl) => {
    try {
      const fullUrl = getUploadUrl(imgUrl);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = imgUrl; // Nama file untuk di-download
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert('Gagal mendownload gambar');
    }
  };

  if (loading) return <div className="post-detail-page"><p className="loading-text">Memuat artikel...</p></div>;
  if (!post || post.message) return <div className="post-detail-page"><p className="empty-text">Berita tidak ditemukan.</p></div>;

  return (
    <div className="post-detail-page">
      <Link to={-1} className="back-btn">
        <ArrowLeft size={18} /> Kembali
      </Link>

      <article className="post-article">
        {post.thumbnail && (
          <div className="hero-thumbnail">
            <img src={getUploadUrl(post.thumbnail)} alt={post.judul} />
          </div>
        )}
        
        <div className="article-content">
          <span className="post-kategori">{post.kategori.toUpperCase()}</span>
          <h1 className="post-title">{post.judul}</h1>
          <div className="post-meta">
            <Calendar size={16} /> 
            <span>{new Date(post.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="post-body">
            {post.deskripsi ? post.deskripsi.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            )) : <p><em>Tidak ada deskripsi.</em></p>}
          </div>
        </div>

        {post.dokumentasi && post.dokumentasi.length > 0 && (
          <div className="dokumentasi-section">
            <h3>Galeri Dokumentasi</h3>
            <div className="dokumentasi-grid">
              {post.dokumentasi.map((imgUrl, i) => (
                <div key={i} className="doc-img-wrapper" onClick={() => setSelectedImage(imgUrl)}>
                  <img src={getUploadUrl(imgUrl)} alt={`Dokumentasi ${i+1}`} className="doc-img" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seksi Unduh Dokumen Lampiran (Excel, Word, PDF, dll) */}
        {post.dokumen_lampiran && post.dokumen_lampiran.length > 0 && (
          <div className="lampiran-section" style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={20} style={{ color: '#2563eb' }} /> Berkas &amp; Dokumen Lampiran
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {post.dokumen_lampiran.map((doc, idx) => (
                <a 
                  key={idx} 
                  href={getUploadUrl(doc.url)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download={doc.name || `Dokumen_${idx + 1}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#ffffff', borderRadius: '8px',
                    border: '1px solid #cbd5e1', textDecoration: 'none', color: '#1e293b',
                    fontWeight: '500', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    {getFileIcon(doc.name || doc.url)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name || `Dokumen Lampiran ${idx + 1}`}
                    </span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#2563eb', fontWeight: 'bold', flexShrink: 0 }}>
                    <Download size={16} /> Unduh
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Lightbox Modal untuk Gambar */}
      {selectedImage && (
        <div className="lightbox-overlay">
          <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
            <X size={32} />
          </button>
          <div className="lightbox-content">
            <img src={getUploadUrl(selectedImage)} alt="Zoomed" className="lightbox-img" />
            <button className="lightbox-download-btn" onClick={() => handleDownload(selectedImage)}>
              <Download size={20} /> Download Gambar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;
