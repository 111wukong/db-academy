'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchResultItem {
  lesson_id: string;
  lesson_title: string;
  module_id: string;
  module_title: string;
  snippet: string;
}

function SearchContent() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      const res = await authFetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">🔍 搜索课程</h1>
        <p className="text-slate-500 mt-1">搜索课程标题和内容</p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="搜索课程内容..."
              autoFocus
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {searching ? '搜索中...' : `找到 ${total} 个结果`}
          </p>

          {results.length === 0 && !searching && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-slate-400">没有找到相关结果</p>
              <p className="text-slate-400 text-sm mt-1">试试其他关键词</p>
            </div>
          )}

          <div className="space-y-3">
            {results.map((r, i) => (
              <Link
                key={`${r.lesson_id}-${i}`}
                href={`/learn/${r.module_id}`}
                className="block bg-white rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{r.lesson_title}</h3>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-3 shrink-0">
                    {r.module_title}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{r.snippet}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Empty state (no search yet) */}
      {!searched && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-slate-400">输入关键词搜索课程内容</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['SELECT', 'JOIN', '索引', '事务', '窗口函数', '索引', '范式', '安全'].map(tag => (
              <button
                key={tag}
                onClick={() => { setQuery(tag); setTimeout(() => handleSearch(), 100); }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AuthProvider>
      <AppShell>
        <SearchContent />
      </AppShell>
    </AuthProvider>
  );
}
