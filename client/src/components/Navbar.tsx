import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LayoutDashboard, Upload, Target, History, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever navigation / route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 transition-all bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10 text-white shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand (Responsive sizing so it never wraps on small screens) */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 group-hover:bg-emerald-400">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight whitespace-nowrap truncate text-white">
              AI Resume <span className="text-emerald-400">Analyzer</span>
            </span>
          </Link>

          {/* Desktop Navigation Items (Hidden on mobile < md) */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'text-emerald-400 bg-emerald-500/15 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/upload"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/upload')
                      ? 'text-emerald-400 bg-emerald-500/15 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Upload
                  {isActive('/upload') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/job-match"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/job-match')
                      ? 'text-emerald-400 bg-emerald-500/15 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Job Match
                  {isActive('/job-match') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/history"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/history')
                      ? 'text-emerald-400 bg-emerald-500/15 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  History
                  {isActive('/history') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  )}
                </Link>

                <div className="flex items-center space-x-2 pl-1.5 pr-3 py-1 rounded-full border border-white/15 bg-slate-900/80 text-slate-200 shadow-xs transition-all duration-200 cursor-default">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm bg-emerald-500 text-slate-950">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[120px] truncate text-white">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold px-2.5 py-2 rounded-xl transition-colors text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                >
                  Log out
                </button>
              </>
            ) : isLandingPage ? (
              /* On Landing Page: Keep ONLY one small "Log In" link, omit "Get Started" to avoid duplication */
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors hover:bg-white/5"
              >
                Log In
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                    isActive('/login')
                      ? 'text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-xl shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Hamburger Button (Visible only below md breakpoint) */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="p-2 rounded-xl focus:outline-none transition-colors text-slate-200 hover:text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel (Frosted Glass with 95% opacity) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t px-4 pt-3 pb-5 space-y-1 shadow-2xl backdrop-blur-2xl border-white/10 bg-[#090d16]/95 text-white">
          {isAuthenticated && user ? (
            <>
              {/* User Profile Pill in Mobile View */}
              <div className="flex items-center space-x-3 px-3.5 py-2.5 mb-2 rounded-2xl border shadow-xs bg-slate-900/80 border-white/15">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 bg-emerald-500 text-slate-950">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Vertical Stacked Navigation Rows (Min 44px Touch Targets) */}
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 mr-3 ${
                    isActive('/dashboard') ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                Dashboard
              </Link>

              <Link
                to="/upload"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/upload')
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload
                  className={`w-4 h-4 mr-3 ${
                    isActive('/upload') ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                Upload Resume
              </Link>

              <Link
                to="/job-match"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/job-match')
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Target
                  className={`w-4 h-4 mr-3 ${
                    isActive('/job-match') ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                Job Match
              </Link>

              <Link
                to="/history"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/history')
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <History
                  className={`w-4 h-4 mr-3 ${
                    isActive('/history') ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                Resume History
              </Link>

              {/* Log out Row (Visually Distinct) */}
              <div className="pt-2 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-400" />
                  Log Out
                </button>
              </div>
            </>
          ) : isLandingPage ? (
            /* Unauthenticated Mobile on Landing Page: Single "Log In" button */
            <div className="pt-1">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-white/15 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-white/15 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
