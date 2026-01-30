'use client';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          // On desktop (lg+), shift content when sidebar is open
          // On mobile, never shift content (sidebar overlays)
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        )}
      >
        <Navbar />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
