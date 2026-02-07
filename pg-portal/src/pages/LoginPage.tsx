import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';
import {
  HiOutlineAcademicCap,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineArrowRightOnRectangle,
  HiOutlineExclamationTriangle,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCheckBadge,
  HiOutlineDocumentText,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';
import type { UserRole } from '../types';

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  student: HiOutlineAcademicCap,
  supervisor: HiOutlineUser,
  coordinator: HiOutlineUserGroup,
  admin: HiOutlineShieldCheck,
};

const roleColors: Record<UserRole, string> = {
  student: 'bg-[#003366]/5 text-[#003366] border-[#003366]/15 hover:bg-[#003366]/10',
  supervisor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/60',
  coordinator: 'bg-violet-50 text-violet-700 border-violet-200/60 hover:bg-violet-100/60',
  admin: 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100/60',
};

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  supervisor: 'Supervisor',
  coordinator: 'Coordinator',
  admin: 'Administrator',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showMockLogins, setShowMockLogins] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const success = login(email);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use one of the demo logins below.');
    }
  };

  const handleMockLogin = (mockEmail: string) => {
    const success = login(mockEmail);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[500px] xl:w-[540px] bg-gradient-to-br from-[#003366] via-[#003366] to-[#002244] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-white rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] border border-white rounded-full translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] border border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-16">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C5A55A] to-[#D4B76A] flex items-center justify-center shadow-lg shadow-[#C5A55A]/20">
              <HiOutlineAcademicCap className="w-6 h-6 text-[#003366]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">UWC</h1>
              <p className="text-blue-300/70 text-xs tracking-wide uppercase font-medium">Postgraduate Portal</p>
            </div>
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-5 tracking-tight">
            Higher Degrees<br />Administration Portal
          </h2>
          <p className="text-blue-200/70 text-sm leading-relaxed max-w-sm mb-14">
            A transparent, auditable, and structured governance system for postgraduate administration at the University of the Western Cape.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-white/[0.06]">
                <HiOutlineDocumentText className="w-5 h-5 text-[#C5A55A]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Submit HD Requests</h3>
                <p className="text-blue-300/60 text-xs mt-1 leading-relaxed">Digitise and track administrative processes end-to-end</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-white/[0.06]">
                <HiOutlineChartBarSquare className="w-5 h-5 text-[#C5A55A]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Real-time Tracking</h3>
                <p className="text-blue-300/60 text-xs mt-1 leading-relaxed">Monitor submissions through every stage of review</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-white/[0.06]">
                <HiOutlineCheckBadge className="w-5 h-5 text-[#C5A55A]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Secure and Compliant</h3>
                <p className="text-blue-300/60 text-xs mt-1 leading-relaxed">POPIA-compliant with full audit trails</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/[0.06]">
          <p className="text-blue-300/40 text-xs font-medium">© 2026 University of the Western Cape. All rights reserved.</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#003366] flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5 text-[#C5A55A]" />
            </div>
            <div>
              <h1 className="text-[#003366] font-bold text-lg tracking-tight">UWC Postgraduate Portal</h1>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h2>
          <p className="text-gray-500 text-sm mt-2 mb-8">Enter your credentials to access the portal</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#003366]/15 focus:border-[#003366]/30 focus:shadow-sm"
                  placeholder="your.email@uwc.ac.za"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Password
              </label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#003366]/15 focus:border-[#003366]/30 focus:shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-red-700 bg-red-50 border border-red-100 px-4 py-3.5 rounded-xl">
                <HiOutlineExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#003366] to-[#004080] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#002851] hover:to-[#003366] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-[#003366]/20 transition-all"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              Sign In
            </button>
          </form>

          {/* Demo Logins */}
          <div className="mt-10">
            <button
              onClick={() => setShowMockLogins(!showMockLogins)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-4"
            >
              {showMockLogins ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
              {showMockLogins ? 'Hide' : 'Show'} demo logins
            </button>

            {showMockLogins && (
              <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
                <p className="text-xs text-gray-500 mb-3.5 font-medium">Select a role to sign in with demo credentials</p>
                <div className="grid grid-cols-2 gap-3">
                  {mockUsers.slice(0, 4).map((mockUser) => {
                    const Icon = roleIcons[mockUser.role];
                    return (
                      <button
                        key={mockUser.id}
                        onClick={() => handleMockLogin(mockUser.email)}
                        className={`flex items-center gap-3 p-3.5 border rounded-xl active:scale-[0.98] text-left transition-all shadow-sm ${roleColors[mockUser.role]}`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{mockUser.name}</p>
                          <p className="text-[10px] opacity-60 font-medium">{roleLabels[mockUser.role]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Need help?{' '}
            <a href="#" className="text-[#003366] font-medium hover:underline">Contact IT Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
