import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isLandingPage ? 'bg-[#090d16]' : 'bg-slate-50'
      } text-slate-900 overflow-x-hidden w-full max-w-full`}
    >
      <Navbar />
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            {children ? children : <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer
        className={
          isLandingPage
            ? 'bg-[#090d16] border-t border-white/10 py-6'
            : 'bg-white border-t border-slate-200 py-6'
        }
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs ${
            isLandingPage ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          &copy; {new Date().getFullYear()} AI Resume Analyzer. Built for intelligent career optimization.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
