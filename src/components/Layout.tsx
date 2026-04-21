import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useTutor } from '../contexts/TutorContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { isFeedbackMode } = useTutor();

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <Sidebar
        isDrawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onMenuOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {isFeedbackMode && (
        <button
          onClick={() => navigate('/feedback/new')}
          className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3.5 shadow-xl transition-colors"
          title="Report an issue on this page"
          aria-label="Report an issue"
        >
          <Flag className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Layout;
