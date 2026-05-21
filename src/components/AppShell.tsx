'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', icon: '📊', label: '学习概览' },
  { href: '/learn', icon: '📚', label: '课程目录' },
  { href: '/playground', icon: '💻', label: 'SQL 练习' },
  { href: '/challenges', icon: '🏆', label: '挑战' },
  { href: '/paths', icon: '🧭', label: '学习路径' },
  { href: '/chat', icon: '🤖', label: 'AI 辅导' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    if (q?.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-slate-700 dark:border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
            DB
          </div>
          <span className="font-semibold text-sm text-white">DB Academy</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700'
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
              : 'text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-base">🎓</span>
          <span>证书</span>
        </Link>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-slate-700 dark:border-slate-700 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 mb-2 w-full text-left"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || '用户'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <span className="text-xs text-slate-400">{showUserMenu ? '▲' : '▼'}</span>
        </button>

        {showUserMenu && (
          <div className="mb-2 bg-slate-800 dark:bg-slate-700 rounded-lg p-1">
            {/* Dark mode toggle */}
            <button
              onClick={() => { toggleDarkMode(); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
            >
              <span>{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? '浅色模式' : '深色模式'}</span>
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <span>⚙️</span>
              <span>设置</span>
            </Link>
            <button
              onClick={() => { setShowUserMenu(false); logout(); }}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
            >
              <span>🚪</span>
              <span>退出登录</span>
            </button>
          </div>
        )}

        {!showUserMenu && (
          <button
            onClick={logout}
            className="w-full text-xs text-slate-500 hover:text-white transition-colors text-left py-1"
          >
            退出登录
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-transition fixed md:static inset-y-0 left-0 z-30 w-60 bg-slate-900 dark:bg-[#0f172a] text-white flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            aria-label="打开菜单"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="搜索课程..."
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-[var(--color-text-muted)]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-xs">🔍</span>
            </div>
          </form>

          {/* Version */}
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span>v2.0</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--color-bg-primary)]">
          {children}
        </main>
      </div>
    </div>
  );
}
