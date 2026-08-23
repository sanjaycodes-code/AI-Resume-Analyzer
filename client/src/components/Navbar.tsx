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

  return (
    <header className="bg-[#F8FAFE]/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand (Responsive sizing so it never wraps on small screens) */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight whitespace-nowrap truncate">
              AI Resume <span className="text-blue-600">Analyzer</span>
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
                      ? 'text-indigo-600 bg-indigo-50/90 shadow-xs ring-1 ring-indigo-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/upload"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/upload')
                      ? 'text-indigo-600 bg-indigo-50/90 shadow-xs ring-1 ring-indigo-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Upload
                  {isActive('/upload') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/job-match"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/job-match')
                      ? 'text-indigo-600 bg-indigo-50/90 shadow-xs ring-1 ring-indigo-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Job Match
                  {isActive('/job-match') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.7)]" />
                  )}
                </Link>

                <Link
                  to="/history"
                  className={`relative text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/history')
                      ? 'text-indigo-600 bg-indigo-50/90 shadow-xs ring-1 ring-indigo-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  History
                  {isActive('/history') && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.7)]" />
                  )}
                </Link>

                <div className="flex items-center space-x-2 pl-2 pr-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/80 px-2.5 py-2 rounded-xl transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                    isActive('/login')
                      ? 'text-indigo-600 bg-indigo-50/90'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100/70'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
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
              className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel (Frosted Glass with 95% opacity) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-[#F8FAFE]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-1 shadow-2xl">
          {isAuthenticated && user ? (
            <>
              {/* User Profile Pill in Mobile View */}
              <div className="flex items-center space-x-3 px-3 py-2.5 mb-2 bg-slate-50/90 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Vertical Stacked Navigation Rows (Min 44px Touch Targets) */}
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50/90 text-indigo-600 border-l-4 border-indigo-600 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 mr-3 ${isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                Dashboard
              </Link>

              <Link
                to="/upload"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/upload')
                    ? 'bg-indigo-50/90 text-indigo-600 border-l-4 border-indigo-600 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Upload
                  className={`w-4 h-4 mr-3 ${isActive('/upload') ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                Upload Resume
              </Link>

              <Link
                to="/job-match"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/job-match')
                    ? 'bg-indigo-50/90 text-indigo-600 border-l-4 border-indigo-600 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Target
                  className={`w-4 h-4 mr-3 ${isActive('/job-match') ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                Job Match
              </Link>

              <Link
                to="/history"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/history')
                    ? 'bg-indigo-50/90 text-indigo-600 border-l-4 border-indigo-600 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <History
                  className={`w-4 h-4 mr-3 ${isActive('/history') ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                Resume History
              </Link>

              {/* Log out Row (Visually Distinct) */}
              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50/80 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-500" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-slate-200/80 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
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
