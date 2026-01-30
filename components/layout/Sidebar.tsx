'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Bell,
  Briefcase,
  CalendarDays,
  CreditCard,
  BarChart3,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'employee', 'client'],
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: UserCircle,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: DollarSign,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    roles: ['admin', 'manager'],
  },
  {
    name: 'My Schedule',
    href: '/my-schedule',
    icon: CalendarDays,
    roles: ['employee'],
  },
  {
    name: 'Leave Requests',
    href: '/leave',
    icon: Briefcase,
    roles: ['employee', 'admin', 'manager'],
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: Bell,
    roles: ['employee', 'admin', 'manager'],
  },
  {
    name: 'My Campaigns',
    href: '/my-campaigns',
    icon: TrendingUp,
    roles: ['client'],
  },
  {
    name: 'My Invoices',
    href: '/my-invoices',
    icon: CreditCard,
    roles: ['client'],
  },
  {
    name: 'Support',
    href: '/support',
    icon: MessageSquare,
    roles: ['client'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen } = useStore();

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-white border-r border-gray-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          <Image
            src="/logo.png"
            alt="Sweet FM 106.5"
            width={160}
            height={50}
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#c81f25] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c81f25] text-white font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
