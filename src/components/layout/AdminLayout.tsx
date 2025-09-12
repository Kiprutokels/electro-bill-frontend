import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AdminLayout = () => {
  useEffect(() => {
    // Add admin-layout class to root element
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('admin-layout');
    }

    // Cleanup function to remove the class when component unmounts
    return () => {
      if (root) {
        root.classList.remove('admin-layout');
      }
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full overflow-hidden [&>div]:!p-0 [&>div]:!m-0">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="container-responsive max-w-none">
              <div className="padding-responsive">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;