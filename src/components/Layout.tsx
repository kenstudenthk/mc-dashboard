import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* Backdrop — only rendered when drawer is open; hidden on desktop via md:hidden */}
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
    </div>
  );
};

export default Layout;
