'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string;
}

export default function DashboardLayout({ children, userName = 'Admin' }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Here you would clear auth tokens/session
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar userName={userName} />

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Top Bar */}
        <div className="flex justify-end items-center gap-4 mb-8">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-[#3C4526] text-white hover:bg-[#4a5530] hover:text-white border-none"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Avatar>
            <AvatarFallback className="bg-gray-300 text-gray-700">
              {userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {children}
      </main>
    </div>
  );
}
