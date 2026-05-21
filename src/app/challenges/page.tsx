'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChallengeItem {
  id: string;
  title: string;
  difficulty: string;
  module_id: string | null;
  order_index: number;
  passed: number;
}

function ChallengesContent() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [modules, setModules] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    authFetch('/api/challenges')
      .then(r => r.json())
      .then(data => {
        setChallenges(data.challenges || []);
        setModules(data.modules || {});
        setStats(data.stats || { completed: 0, total: 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard: 'bg-red-100 text-red-700 border-red-200',
  };
  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const filtered = filter === 'all'
    ? challenges
    : challenges.filter(c => c.difficulty === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">🏆 SQL 挑战</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">通过实战挑战提升 SQL 技能</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{stats.completed}/{stats.total}</div>
          <div className="text-xs text-slate-400">已完成</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'easy', 'medium', 'hard'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
            }`}
          >
            {f === 'all' ? '全部' : difficultyLabels[f] || f}
          </button>
        ))}
      </div>

      {/* Challenge Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ch => (
            <Link key={ch.id} href={`/challenges/${ch.id}`}>
              <div className={`bg-white dark:bg-slate-800 rounded-xl p-5 border transition-all hover:shadow-md ${
                ch.passed
                  ? 'border-green-200 dark:border-green-700'
                  : 'border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`text-lg ${ch.passed ? '' : 'text-slate-300 dark:text-slate-600'}`}>
                    {ch.passed ? '✅' : '⬜'}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColors[ch.difficulty] || ''}`}>
                    {difficultyLabels[ch.difficulty] || ch.difficulty}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{ch.title}</h3>
                {ch.module_id && modules[ch.module_id] && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{modules[ch.module_id]}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-slate-400">暂无挑战</p>
        </div>
      )}
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ChallengesContent />
      </AppShell>
    </AuthProvider>
  );
}
