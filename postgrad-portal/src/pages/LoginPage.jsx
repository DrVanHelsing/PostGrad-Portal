// ============================================
// Login Page
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import './LoginPage.css';

const DEMO_ACCOUNTS = [
  { email: 'student@uwc.ac.za', label: 'Student', desc: 'Thabo Molefe' },
  { email: 'supervisor@uwc.ac.za', label: 'Supervisor', desc: 'Prof. van der Berg' },
  { email: 'coordinator@uwc.ac.za', label: 'Coordinator', desc: 'Dr. Fatima Patel' },
  { email: 'admin@uwc.ac.za', label: 'Admin', desc: 'Linda Mkhize' },
];

const FEATURES = [
  { icon: <HiOutlineDocumentText />, title: 'Higher Degrees Requests', desc: 'Submit and track postgraduate requests' },
  { icon: <HiOutlineClipboardDocumentCheck />, title: 'Digital Workflow', desc: 'Secure multi-stage approval process' },
  { icon: <HiOutlineCalendarDays />, title: 'Calendar', desc: 'Deadlines, meetings and committee dates' },
  { icon: <HiOutlineShieldCheck />, title: 'Access Control', desc: 'Role-based permissions and audit trail' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const result = login(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setError('');
    login(demoEmail, 'demo');
  };

  return (
    <div className="login-page">
      {/* Branding panel */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="login-brand-logo">UWC</div>
          <h1>PostGrad Portal</h1>
          <p>
            Streamlined postgraduate administration for the University of the Western Cape.
            Manage postgraduate requests, track submissions, and coordinate committee reviews.
          </p>
          <div className="login-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="login-feature-card">
                <div className="login-feature-card-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Sign in</h2>
            <p>Enter your UWC email to access the portal</p>
          </div>

          {error && (
            <div className="login-error">
              <HiOutlineExclamationTriangle />
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="your.email@uwc.ac.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="login-submit-btn">
              Sign in
            </button>
            <button type="button" className="login-forgot-btn" onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          </form>

          {/* Forgot Password Overlay */}
          {showForgot && (
            <div className="login-forgot-overlay">
              <div className="login-forgot-card">
                <h3>Reset Password</h3>
                {forgotSent ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, color: 'var(--status-success)', marginBottom: 12 }}>&#10003;</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}>
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Enter your UWC email and we'll send you a reset link.
                    </p>
                    <div className="form-group">
                      <input className="form-input" type="email" placeholder="your.email@uwc.ac.za" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)} autoFocus />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => setShowForgot(false)}>Cancel</button>
                      <button className="btn btn-primary" disabled={!forgotEmail.includes('@')}
                        onClick={() => setForgotSent(true)}>Send Reset Link</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="login-demo-accounts">
            <h4>Quick access – Demo accounts</h4>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                className="demo-account-btn"
                onClick={() => handleDemoLogin(acc.email)}
              >
                {acc.label} <span>– {acc.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
