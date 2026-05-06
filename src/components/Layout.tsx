import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import TopNav from './TopNav';
import { useTutor } from '../contexts/TutorContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { isFeedbackMode } = useTutor();

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[min(100%,1600px)]">
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
