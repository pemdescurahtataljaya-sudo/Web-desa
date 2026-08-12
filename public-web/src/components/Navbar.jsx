import { Link, useLocation } from 'react-router-dom';
import { MapPin, Info, Home, Map as MapIcon, BarChart2, Calendar } from 'lucide-react';
import './Navbar.css';

import logoSitubondo from '../assets/logo_situbondo.webp';

const Navbar = () => {
  const location = useLocation();

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" onClick={handleHomeClick} className="navbar-brand">
          <img src={logoSitubondo} alt="Logo Situbondo" className="brand-logo-img" />
          <span className="brand-text">Desa Curah Tatal</span>
        </Link>
        <nav className="navbar-nav">
          <Link to="/" onClick={handleHomeClick} className="nav-link"><Home size={18} /> Beranda</Link>
          <Link 
            to="/profil" 
            className={`nav-link ${location.pathname === '/profil' ? 'active' : ''}`}
          >
            <Info size={18} /> Profil
          </Link>

          <Link 
            to="/tata-kelola" 
            className={`nav-link ${location.pathname.startsWith('/tata-kelola') ? 'active' : ''}`}
          >
            <BarChart2 size={18} /> Tata Kelola
          </Link>
          <Link 
            to="/kegiatan" 
            className={`nav-link ${location.pathname === '/kegiatan' ? 'active' : ''}`}
          >
            <Calendar size={18} /> Kegiatan
          </Link>
          <Link 
            to="/map" 
            className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}
          >
            <MapPin size={18} /> Map
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
