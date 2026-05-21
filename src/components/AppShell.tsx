'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: '📊', label: '学习概览' },
  { href: '/learn', icon: '📚', label: '课程目录' },
  { href: '/playground', icon: '💻', label: 'SQL 练习' },
  { href: '/chat', icon: '🤖', label: 'AI 辅导' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    if (q?.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
              DB
            </div>
            <span className="font-semibold text-sm">DB Academy</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 mb-2">
          <Link
            href="/certificate"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === '/certificate'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-base">🎓</span>
            <span>证书</span>
          </Link>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-slate-700 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 mb-2 w-full text-left"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || '用户'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-xs text-slate-400">{showUserMenu ? '▲' : '▼'}</span>
          </button>

          {showUserMenu && (
            <div className="mb-2 bg-slate-800 rounded-lg p-1">
              <Link
                href="/settings"
                className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                ⚙️ 设置
              </Link>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
              >
                🚪 退出登录
              </button>
            </div>
          )}

          {/* Simple logout when dropdown not visible */}
          {!showUserMenu && (
            <button
              onClick={logout}
              className="w-full text-xs text-slate-500 hover:text-white transition-colors text-left py-1"
            >
              退出登录
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar with search */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="搜索课程..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            </div>
          </form>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>DB Academy v1.0</span>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
