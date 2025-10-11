'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Users, UserCircle, FileText, X, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName = 'Admin' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Trainers', href: '/dashboard/trainers', icon: Users },
    { name: 'Clients', href: '/dashboard/clients', icon: UserCircle },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  ];

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative",
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <div className="absolute -right-4 top-6 z-20">
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-white shadow-lg border-2"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        {!isCollapsed ? (
          <h1 className="text-lg font-bold text-black flex items-center gap-2">
           
            <span></span>
          </h1>
        ) : (
          <div className="flex justify-center">
        
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className={cn(
        "p-6 border-b border-gray-200",
        isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'
      )}>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-[#3C4526] text-white font-semibold">
            {userName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? 'bg-purple-50 text-[#3C4526] font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
