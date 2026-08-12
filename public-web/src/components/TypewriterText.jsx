import { useState, useEffect } from 'react';
import './TypewriterText.css';

const TypewriterText = ({ 
  text, 
  typingSpeed = 100, 
  deletingSpeed = 50, 
  pauseDuration = 2200,
  className = '',
  style = {}
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    let timer;

    if (!isDeleting && charIndex < text.length) {
      // Ketik ke depan
      timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[charIndex]);
        setCharIndex(prev => prev + 1);
      }, typingSpeed);
    } else if (!isDeleting && charIndex === text.length) {
      // Jeda sejenak setelah teks lengkap
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && charIndex > 0) {
      // Hapus ke belakang
      timer = setTimeout(() => {
        setDisplayedText(prev => prev.slice(0, -1));
        setCharIndex(prev => prev - 1);
      }, deletingSpeed);
    } else if (isDeleting && charIndex === 0) {
      // Reset ulang looping ketik
      setIsDeleting(false);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, text, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={`typewriter-container ${className}`} style={style}>
      {/* ELEMEN GHOST UNTUK MENGUNCI RUANG & KETINGGIAN TEKS DARI AWAL (BEBAS MELOMPAT/TERLOMPAT-LOMPAT) */}
      <span className="typewriter-ghost" aria-hidden="true">
        {text}
        <span style={{ opacity: 0 }}>|</span>
      </span>
      
      {/* TEKS UTAMA YANG SEDANG DIKETIK */}
      <span className="typewriter-visible">
        {displayedText}
        <span className="typewriter-cursor">|</span>
      </span>
    </span>
  );
};

export default TypewriterText;
