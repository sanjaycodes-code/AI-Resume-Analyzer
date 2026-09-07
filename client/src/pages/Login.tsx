import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

export const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { resetSuccess?: string; message?: string })?.resetSuccess ||
    (location.state as { resetSuccess?: string; message?: string })?.message ||
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error upon typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      if (
        axiosError.code === 'ECONNABORTED' ||
        (axiosError.message && axiosError.message.toLowerCase().includes('timeout'))
      ) {
        setApiError(
          'The backend server is waking up from sleep mode (Render cold start). Please wait a few seconds and click Sign In again!'
        );
      } else {
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Failed to log in. Please check your credentials.';
        setApiError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#090d16] text-white relative overflow-hidden">
      {/* Subtle Dot Texture Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Ambient Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-md w-full space-y-8 bg-slate-900/85 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-black/80 border border-white/15">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 shadow-sm shadow-emerald-500/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-400">
            Enter your credentials to access your resume analysis dashboard.
          </p>
        </div>

        {/* Success Alert (e.g. from password reset) */}
        {successMessage && (
          <div className="bg-emerald-950/60 border border-emerald-500/30 p-4 rounded-xl text-emerald-200 animate-in fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-200 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="bg-red-950/60 border border-red-500/30 p-4 rounded-xl text-red-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-200 font-medium">{apiError}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 bg-slate-950/60 transition-colors focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-white/15 focus:border-emerald-400 focus:ring-emerald-400/20'
                }`}
                placeholder="you@example.com"
              />
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 bg-slate-950/60 transition-colors focus:outline-none focus:ring-2 ${
                  formErrors.password
                    ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-white/15 focus:border-emerald-400 focus:ring-emerald-400/20'
                }`}
                placeholder="••••••••"
              />
              {formErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{formErrors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              state={location.state}
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
