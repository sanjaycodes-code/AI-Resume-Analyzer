import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              AI Resume <span className="text-blue-600">Analyzer</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className={`text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/upload')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Upload
                </Link>
                <Link
                  to="/job-match"
                  className={`text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/job-match')
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-slate-700 hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  Job Match
                </Link>
                <Link
                  to="/history"
                  className={`text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/history')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  History
                </Link>

                <div className="hidden md:flex items-center space-x-2 pl-2 pr-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-800 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-2 rounded-lg transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors hover:bg-slate-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
