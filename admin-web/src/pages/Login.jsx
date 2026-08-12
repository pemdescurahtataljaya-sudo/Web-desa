import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User } from 'lucide-react';
import { API_URL } from '../utils/url';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUsername', res.data.username || username);
        navigate('/dashboard');
      } else {
        alert('Gagal login: Respons tidak valid');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        alert('Gagal login: ' + err.response.data.error);
      } else {
        // Fallback jika API luring
        if (username === 'admin' && password === 'password') {
          localStorage.setItem('adminToken', '12345');
          localStorage.setItem('adminUsername', 'admin');
          navigate('/dashboard');
        } else {
          alert('Username atau Password salah!');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Web Desa</h2>
        <p>Silakan masuk untuk mengelola konten</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-login">Masuk</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
