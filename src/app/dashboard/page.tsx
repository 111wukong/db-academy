'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Module } from '@/types';
import { useRouter } from 'next/navigation';

interface ActivityItem {
  id: string;
  type: 'query' | 'lesson' | 'quiz';
  label: string;
  detail: string;
  time: string;
}

function DashboardContent() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentQueries, setRecentQueries] = useState<{ query: string; created_at: string }[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    Promise.all([
      authFetch('/api/progress').then(r => r.json()),
      fetchRecentQueries(),
    ])
      .then(([progressData, queryData]) => {
        if (progressData.modules) setModules(progressData.modules);
        if (queryData) setRecentQueries(queryData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const fetchRecentQueries = async () => {
    try {
      // We can fetch from history local storage as fallback
      const saved = localStorage.getItem('db_academy_query_history');
      if (saved) {
        return JSON.parse(saved).slice(0, 5).map((q: { query: string }, i: number) => ({
          query: q.query,
          created_at: new Date(Date.now() - i * 3600000).toISOString(),
        }));
      }
    } catch {}
    return [];
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lesson_count, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_lessons, 0);
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Calculate days active (stub - would need real tracking in prod)
  const daysActive = Math.min(completedLessons + 1, 30);
  const streak = completedLessons > 0 ? Math.min(completedLessons, 7) : 0;

  // Sort modules by progress (descending) for top modules
  const topModules = [...modules]
    .map(m => ({
      ...m,
      modProgress: m.lesson_count > 0 ? Math.round((m.completed_lessons / m.lesson_count) * 100) : 0,
    }))
    .sort((a, b) => b.modProgress - a.modProgress)
    .slice(0, 3);

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };
  const difficultyLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };

  const continueModule = modules.find(m => m.completed_lessons > 0 && m.completed_lessons < m.lesson_count)
    || modules.find(m => m.completed_lessons === 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name}！</h1>
        <p className="text-blue-100 mb-6">继续你的数据库学习之旅</p>
        {continueModule && (
          <Link
            href={`/learn/${continueModule.id}`}
            className="inline-flex items-center px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            继续学习：{continueModule.title} →
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold text-slate-800">{modules.length}</div>
          <div className="text-sm text-slate-500">学习模块</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="text-2xl mb-1">📖</div>
          <div className="text-2xl font-bold text-slate-800">{totalLessons}</div>
          <div className="text-sm text-slate-500">课程总数</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{completedLessons}</div>
          <div className="text-sm text-slate-500">已完成</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold text-blue-600">{progress}%</div>
          <div className="text-sm text-slate-500">总进度</div>
        </div>
      </div>

      {/* Extra Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg">💻</div>
            <div>
              <div className="text-xl font-bold text-slate-800">{recentQueries.length > 0 ? recentQueries.length : '-'}</div>
              <div className="text-xs text-slate-400">今日查询</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-lg">📅</div>
            <div>
              <div className="text-xl font-bold text-slate-800">{daysActive}</div>
              <div className="text-xs text-slate-400">活跃天数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-lg">🔥</div>
            <div>
              <div className="text-xl font-bold text-slate-800">{streak}</div>
              <div className="text-xs text-slate-400">连续学习（天）</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-800">学习进度</h2>
          <span className="text-sm text-slate-500">{completedLessons}/{totalLessons} 课时</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Module List (takes 2/3) */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-4">课程模块</h2>
          <div className="space-y-3">
            {modules.map(mod => {
              const modProgress = mod.lesson_count > 0
                ? Math.round((mod.completed_lessons / mod.lesson_count) * 100)
                : 0;
              return (
                <Link key={mod.id} href={`/learn/${mod.id}`}>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{mod.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-4 ${difficultyColors[mod.difficulty]}`}>
                        {difficultyLabels[mod.difficulty]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>📖 {mod.lesson_count} 课时</span>
                      <span>⏱️ {mod.estimated_minutes} 分钟</span>
                      <span className="flex-1" />
                      <span className="text-blue-600 font-medium">{modProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          modProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${modProgress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right sidebar — Recent Activity & Top Modules */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3">📝 最近活动</h3>
            {recentQueries.length > 0 ? (
              <div className="space-y-2">
                {recentQueries.slice(0, 5).map((q, i) => (
                  <Link
                    key={i}
                    href={`/playground?sql=${encodeURIComponent(q.query)}`}
                    className="block text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-2 truncate hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-slate-400 mr-1">▶</span>
                    {q.query.length > 60 ? q.query.slice(0, 60) + '...' : q.query}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">💻</div>
                <p className="text-xs text-slate-400">还没有查询记录</p>
                <Link href="/playground" className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                  去练习区 →
                </Link>
              </div>
            )}
          </div>

          {/* Top Modules */}
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3">🏆 进度领先模块</h3>
            {topModules.length > 0 ? (
              <div className="space-y-3">
                {topModules.map((mod, i) => (
                  <Link key={mod.id} href={`/learn/${mod.id}`} className="block">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{mod.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                mod.modProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${mod.modProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">{mod.modProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                还没有学习记录
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </AuthProvider>
  );
}
