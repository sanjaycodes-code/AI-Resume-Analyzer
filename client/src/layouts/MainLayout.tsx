import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children ? children : <Outlet />}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AI Resume Analyzer. Built for intelligent career optimization.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
