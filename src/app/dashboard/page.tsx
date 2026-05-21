'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Module } from '@/types';
import { useRouter } from 'next/navigation';

interface XPData {
  total_xp: number;
  level: number;
  xp_progress: number;
  next_level_xp: number;
  current_level_xp: number;
  badges: { badge_type: string; awarded_at: string }[];
  streak: { current_streak: number; longest_streak: number; last_active_date: string | null };
}

const BADGE_ICONS: Record<string, { label: string; icon: string }> = {
  first_lesson: { label: '初出茅庐', icon: '🌟' },
  five_lessons: { label: '学无止境', icon: '📚' },
  all_sql_basics: { label: 'SQL 基础达人', icon: '💎' },
  quiz_master: { label: '测验大师', icon: '🏅' },
  seven_day_streak: { label: '坚持之星', icon: '🔥' },
  first_challenge: { label: '挑战者', icon: '⚡' },
  speed_demon: { label: '闪电手', icon: '💨' },
  xp_collector_100: { label: '经验收集者 I', icon: '⭐' },
  xp_collector_500: { label: '经验收集者 II', icon: '🌟' },
  all_modules: { label: '全能学霸', icon: '👑' },
};

function DashboardContent() {
  const [modules, setModules] = useState<Module[]>([]);
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [recentQueries, setRecentQueries] = useState<{ query: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
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
      authFetch('/api/xp').then(r => r.json()),
      fetchRecentQueries(),
    ])
      .then(([progressData, xpResult, queryData]) => {
        if (progressData.modules) setModules(progressData.modules);
        setXpData(xpResult);
        if (queryData) setRecentQueries(queryData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const fetchRecentQueries = async () => {
    try {
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

  const daysActive = Math.min(completedLessons + 1, 30);
  const streak = xpData?.streak?.current_streak || 0;

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  const difficultyLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };

  const continueModule = modules.find(m => m.completed_lessons > 0 && m.completed_lessons < m.lesson_count)
    || modules.find(m => m.completed_lessons === 0);

  // Sort modules by progress
  const topModules = [...modules]
    .map(m => ({
      ...m,
      modProgress: m.lesson_count > 0 ? Math.round((m.completed_lessons / m.lesson_count) * 100) : 0,
    }))
    .sort((a, b) => b.modProgress - a.modProgress)
    .slice(0, 3);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold mb-2">欢迎回来，{user?.name}！</h1>
        <p className="text-blue-100 mb-4 md:mb-6">继续你的数据库学习之旅</p>
        <div className="flex flex-col sm:flex-row gap-3">
          {continueModule && (
            <Link
              href={`/learn/${continueModule.id}`}
              className="inline-flex items-center px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              继续学习：{continueModule.title} →
            </Link>
          )}
          <Link
            href={`/profile/${user?.id}`}
            className="inline-flex items-center px-5 py-2.5 bg-white/20 text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
          >
            查看公开主页 →
          </Link>
        </div>
      </div>

      {/* XP & Level Row */}
      {xpData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
          {/* Level card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {xpData.level}
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">等级</div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">Lv.{xpData.level}</div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>经验值</span>
              <span>{xpData.total_xp} / {xpData.next_level_xp}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(xpData.xp_progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Streak card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-lg">
                🔥
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">连续学习</div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">{streak} 天</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              最长记录：{xpData.streak?.longest_streak || 0} 天
              {streak >= 3 && <span className="text-green-500 ml-2">🔥 连续奖励已激活！</span>}
            </div>
          </div>

          {/* Today's queries */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white text-lg">
                💻
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">今日查询</div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">{recentQueries.length}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <Link href="/playground" className="text-blue-600 dark:text-blue-400 hover:underline">去练习区 →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{modules.length}</div>
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">学习模块</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="text-2xl mb-1">📖</div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{totalLessons}</div>
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">课程总数</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-xl md:text-2xl font-bold text-green-600">{completedLessons}</div>
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">已完成</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-xl md:text-2xl font-bold text-blue-600">{progress}%</div>
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">总进度</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 md:p-6 border border-slate-100 dark:border-slate-700 mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-800 dark:text-white">学习进度</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{completedLessons}/{totalLessons} 课时</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Module List (takes 2/3) */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">课程模块</h2>
          <div className="space-y-3">
            {modules.map(mod => {
              const modProgress = mod.lesson_count > 0
                ? Math.round((mod.completed_lessons / mod.lesson_count) * 100)
                : 0;
              return (
                <Link key={mod.id} href={`/learn/${mod.id}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate">{mod.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{mod.description}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-4 shrink-0 ${difficultyColors[mod.difficulty]}`}>
                        {difficultyLabels[mod.difficulty]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>📖 {mod.lesson_count} 课时</span>
                      <span>⏱️ {mod.estimated_minutes} 分钟</span>
                      <span className="flex-1" />
                      <span className="text-blue-600 font-medium">{modProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
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

        {/* Right sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Badges Showcase */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">🏅 成就徽章</h3>
            {xpData && xpData.badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {xpData.badges.slice(0, 6).map(b => {
                  const meta = BADGE_ICONS[b.badge_type] || { label: b.badge_type, icon: '🏆' };
                  return (
                    <div key={b.badge_type} className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-xl">{meta.icon}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{meta.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400">完成课程和测验获得徽章</p>
              </div>
            )}
            {xpData && xpData.badges.length > 6 && (
              <p className="text-xs text-blue-600 mt-2 text-center">+{xpData.badges.length - 6} 更多...</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">📝 最近活动</h3>
            {recentQueries.length > 0 ? (
              <div className="space-y-2">
                {recentQueries.slice(0, 5).map((q, i) => (
                  <Link
                    key={i}
                    href={`/playground?sql=${encodeURIComponent(q.query)}`}
                    className="block text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 truncate hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">🏆 进度领先模块</h3>
            {topModules.length > 0 ? (
              <div className="space-y-3">
                {topModules.map((mod, i) => (
                  <Link key={mod.id} href={`/learn/${mod.id}`} className="block">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        i === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{mod.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
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

          {/* Quick Links */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">🔗 快捷链接</h3>
            <div className="space-y-2">
              <Link href="/challenges" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                <span>🏆</span> SQL 挑战
              </Link>
              <Link href="/paths" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                <span>🧭</span> 学习路径
              </Link>
              <Link href={`/profile/${user?.id}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                <span>👤</span> 公开主页
              </Link>
            </div>
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
