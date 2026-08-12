const getRawApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://data.curahtatal.com/api';
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    url = url.replace(/^http:\/\//i, 'https://');
  }
  return url;
};

export const API_URL = getRawApiUrl();
const BASE_BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

export const getUploadUrl = (img) => {
  if (!img || typeof img !== 'string') return '';
  const trimmed = img.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? trimmed.replace(/^http:\/\//i, 'https://')
      : trimmed;
  }
  const cleanPath = trimmed.startsWith('/uploads/') 
    ? trimmed 
    : `/uploads/${trimmed.replace(/^\/+/, '')}`;
  
  return `${BASE_BACKEND_URL}${cleanPath}`;
};
