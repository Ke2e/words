'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/mine', label: '我的', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center py-2 text-xs ${
                active ? 'font-semibold text-black' : 'text-gray-400'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="mt-0.5">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
