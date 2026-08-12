import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#dc2626', background: '#fef2f2', fontFamily: 'sans-serif', minHeight: '100vh' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>⚠️ Error Runtime React</h2>
          <p style={{ fontWeight: 'bold', color: '#991b1b', marginTop: '10px' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5', overflowX: 'auto', fontSize: '0.85rem', color: '#7f1d1d' }}>
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
