import { useState } from 'react';
import axios from 'axios';
import { Download, Upload, Database, HardDriveDownload, HardDriveUpload, CheckCircle, AlertTriangle, RefreshCw, FileArchive } from 'lucide-react';
import { API_URL } from '../utils/url';

const BackupTab = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  // Handle Export / Download Zip
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API_URL}/backup/export`, {
        responseType: 'blob'
      });

      // Extract filename from header or build timestamped name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `backup_curahtatal_${timestamp}.zip`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal mengekspor data: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.zip')) {
        alert('File backup harus berformat .zip');
        return;
      }
      setSelectedFile(file);
      setImportStatus(null);
    }
  };

  // Handle Import / Restore Zip
  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Pilih file backup .zip terlebih dahulu!');
      return;
    }

    const confirmRestore = window.confirm(
      '⚠️ PERINGATAN:\n\nProses ini akan memperbarui dan memulihkan seluruh isi Database serta foto/dokumen desa dengan data dari file backup.\n\nApakah Anda yakin ingin melanjutkan?'
    );
    if (!confirmRestore) return;

    setIsImporting(true);
    setImportStatus(null);

    const formData = new FormData();
    formData.append('backupZip', selectedFile);

    try {
      const res = await axios.post(`${API_URL}/backup/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportStatus({
        type: 'success',
        message: res.data?.message || 'Seluruh data & media desa berhasil dipulihkan!'
      });
      setSelectedFile(null);

      // Reload after 2 seconds to refresh all app states
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Import error:', err);
      setImportStatus({
        type: 'error',
        message: 'Gagal mengimpor data: ' + (err.response?.data?.error || err.message)
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="table-container fade-in" style={{ padding: '24px', maxWidth: '950px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={24} style={{ color: 'var(--primary-color)' }} />
          Pusat Backup &amp; Restore Data Desa
        </h3>
        <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.92rem' }}>
          Kelola cadangan (ekspor) seluruh isi database dan berkas media desa, serta pulihkan (impor) data kapan saja.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* KARTU 1: EXPORT (DOWNLOAD BACKUP) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDriveDownload size={28} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>1. Ekspor &amp; Unduh Backup</h4>
              <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 'bold' }}>Format Cadangan Lengkap (.ZIP)</span>
            </div>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 20px 0', flexGrow: 1 }}>
            Unduh seluruh arsip data desa yang mencakup isi database (Berita, Tata Kelola Penduduk, APBDES, Realisasi, RKP, Profil Desa, Titik Peta) beserta <strong>seluruh file foto &amp; dokumen pendukung</strong> ke dalam 1 file `.zip`.
          </p>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.85rem', color: '#334155' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#0f172a' }}>Isi File Ekspor:</div>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.5' }}>
              <li>Dump Database JSON (8 Tabel Utama)</li>
              <li>Foto Thumbnail Berita &amp; Kegiatan</li>
              <li>Foto Profil Aparat (3x4), Kades &amp; Slider Hero</li>
              <li>Foto Titik Peta &amp; Galeri Lokasi Desa</li>
              <li>Lampiran Dokumen (PDF, Word, Excel)</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            style={{ width: '100%', padding: '14px', background: 'var(--primary-color)', color: 'var(--text-on-primary)', fontWeight: 'bold', fontSize: '1rem', border: 'none', borderRadius: '10px', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', opacity: isExporting ? 0.7 : 1 }}
          >
            {isExporting ? (
              <>
                <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Memproses File Backup...
              </>
            ) : (
              <>
                <Download size={20} /> Unduh Backup Seluruh Data Desa (.zip)
              </>
            )}
          </button>
        </div>

        {/* KARTU 2: IMPORT (RESTORE BACKUP) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '12px', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDriveUpload size={28} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>2. Impor &amp; Pulihkan Backup</h4>
              <span style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 'bold' }}>Restore Seluruh Data &amp; Media</span>
            </div>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            Unggah file backup `.zip` yang pernah diunduh sebelumnya untuk mengembalikan seluruh isi database dan file fisik ke keadaan saat backup dibuat.
          </p>

          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {/* FILE PICKER DROPZONE */}
            <div style={{ marginBottom: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px dashed #94a3b8', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                id="backupZipInput"
                style={{ display: 'none' }}
              />
              <label htmlFor="backupZipInput" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileArchive size={36} style={{ color: selectedFile ? '#2563eb' : '#64748b' }} />
                {selectedFile ? (
                  <div>
                    <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>Klik untuk memilih file Backup (.zip)</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Pilih file hasil ekspor cadangan desa</div>
                  </div>
                )}
              </label>
            </div>

            {/* STATUS NOTIFICATION */}
            {importStatus && (
              <div style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', background: importStatus.type === 'success' ? '#dcfce7' : '#fef2f2', color: importStatus.type === 'success' ? '#15803d' : '#991b1b', border: importStatus.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5' }}>
                {importStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                {importStatus.message}
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              <button
                type="submit"
                disabled={isImporting || !selectedFile}
                style={{ width: '100%', padding: '14px', background: selectedFile ? '#2563eb' : '#94a3b8', color: 'white', fontWeight: 'bold', fontSize: '1rem', border: 'none', borderRadius: '10px', cursor: (isImporting || !selectedFile) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: selectedFile ? '0 4px 10px rgba(37,99,235,0.2)' : 'none', opacity: isImporting ? 0.7 : 1 }}
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Memulihkan Data &amp; Media...
                  </>
                ) : (
                  <>
                    <Upload size={20} /> Pulihkan / Import Data Desa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BackupTab;
