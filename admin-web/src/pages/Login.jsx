import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('adminToken', '12345');
      navigate('/dashboard');
    } else {
      alert('Username atau Password salah!');
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
