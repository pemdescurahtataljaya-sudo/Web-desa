import './Footer.css';
import { MapPin, Mail, MessageCircle } from 'lucide-react';

const Footer = ({ settings }) => {
  const desc = settings?.footer_desc || 'Membangun desa wisata yang lestari, berdaya saing, dan sejahtera.';
  const address = settings?.address || 'Kec. Arjasa, Situbondo 68371';
  const email = settings?.email || 'pemdes@curahtatal.desa.id';
  const contacts = settings?.contacts_data && settings.contacts_data.length > 0 
    ? settings.contacts_data 
    : [];

  // Buat link wa.me otomatis dari nomor telepon
  const getWaLink = (phone) => {
    if (!phone) return null;
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.substring(1);
    if (clean.startsWith('+')) clean = clean.substring(1);
    return `https://wa.me/${clean}`;
  };

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-col">
          <h3>Desa Curah Tatal</h3>
          <p>{desc}</p>
        </div>
        <div className="footer-col">
          <h4>Kontak Kami</h4>
          <ul>
            <li><MapPin size={16} style={{ flexShrink: 0 }} /> <span>{address}</span></li>
            <li><Mail size={16} style={{ flexShrink: 0 }} /> <span>{email}</span></li>
            
            {contacts.map((contact, idx) => {
              const waLink = contact.wa_link || getWaLink(contact.phone);
              return (
                <li key={idx}>
                  <MessageCircle size={16} style={{ flexShrink: 0, color: '#25d366' }} /> 
                  <span>
                    {contact.name && <strong>{contact.name}: </strong>}
                    {waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                        {contact.phone}
                      </a>
                    ) : (
                      contact.phone
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Pemerintah Desa Curah Tatal. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
