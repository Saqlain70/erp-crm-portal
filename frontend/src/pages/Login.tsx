import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password@123');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // error state already set in context
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-mark">O</div>
        <h1>Orbital Ops Portal</h1>
        <p className="sub">Mini ERP + CRM for distribution operations</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 6 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-amber" type="submit" disabled={loading} style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-creds">
          <strong>Demo credentials</strong> (password: <code>Password@123</code>)<br />
          Admin: <code>admin@erp.com</code><br />
          Sales: <code>sales@erp.com</code><br />
          Warehouse: <code>warehouse@erp.com</code><br />
          Accounts: <code>accounts@erp.com</code>
        </div>
      </div>
    </div>
  );
}
