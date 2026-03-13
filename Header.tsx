'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { NotificationBell } from '@/components/layout/NotificationBell';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/documents': 'Documents',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings': 'Settings',
  '/admin': 'Admin Overview',
  '/admin/projects': 'Projects',
  '/admin/sync-log': 'Sync Log',
};

function getPageTitle(pathname: string): string {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for prefix match (for nested routes)
  const sortedKeys = Object.keys(pageTitles).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (pathname.startsWith(key)) {
      return pageTitles[key];
    }
  }

  return 'Dashboard';
}

export function Header() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const pageTitle = getPageTitle(pathname);
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-medium text-white">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {profile?.full_name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
