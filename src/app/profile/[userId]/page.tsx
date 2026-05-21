'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch, useAuth } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  name: string;
  bio: string;
  level: number;
  total_xp: number;
  badges: { badge_type: string; badge_data: string; awarded_at: string }[];
  modules_completed: number;
  total_lessons: number;
  challenges_solved: number;
  quiz_count: number;
  quiz_avg_score: number;
  streak: { current_streak: number; longest_streak: number };
  recent_activity: { type: string; label: string; time: string }[];
  member_since: string;
}

const BADGE_META: Record<string, { label: string; icon: string; desc: string }> = {
  first_lesson: { label: '初出茅庐', icon: '🌟', desc: '完成第一课' },
  five_lessons: { label: '学无止境', icon: '📚', desc: '完成 5 课' },
  all_sql_basics: { label: 'SQL 基础达人', icon: '💎', desc: '完成 SQL 基础模块' },
  quiz_master: { label: '测验大师', icon: '🏅', desc: '测验全对 3 次' },
  seven_day_streak: { label: '坚持之星', icon: '🔥', desc: '连续学习 7 天' },
  first_challenge: { label: '挑战者', icon: '⚡', desc: '完成第一个挑战' },
  speed_demon: { label: '闪电手', icon: '💨', desc: '30秒内完成简单挑战' },
  xp_collector_100: { label: '经验收集者 I', icon: '⭐', desc: '累计 100 XP' },
  xp_collector_500: { label: '经验收集者 II', icon: '🌟', desc: '累计 500 XP' },
  all_modules: { label: '全能学霸', icon: '👑', desc: '完成所有模块' },
};

function ProfileContent() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    authFetch(`/api/user/profile?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, router]);

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-slate-400">用户不存在</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-6 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
          {profile.name[0]?.toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{profile.name}</h1>
        {profile.bio && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{profile.bio}</p>}

        {/* Level & XP */}
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-4">
          <span className="text-lg">🌟</span>
          <span className="font-bold text-blue-700 dark:text-blue-400">Lv.{profile.level}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{profile.total_xp} XP</span>
        </div>

        {isOwnProfile && (
          <div className="text-xs text-slate-400">
            <Link href="/settings" className="text-blue-600 hover:text-blue-700">编辑资料</Link>
            {' · '}
            <button onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
            }} className="text-blue-600 hover:text-blue-700">复制链接</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">{profile.modules_completed}</div>
          <div className="text-xs text-slate-400">已完课程</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">{profile.challenges_solved}</div>
          <div className="text-xs text-slate-400">挑战通过</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">{profile.quiz_count}</div>
          <div className="text-xs text-slate-400">测验参加</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">{profile.streak.current_streak}</div>
          <div className="text-xs text-slate-400">连续学习</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">🏅 成就徽章</h2>
        {profile.badges.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {profile.badges.map(b => {
              const meta = BADGE_META[b.badge_type] || { label: b.badge_type, icon: '🏆', desc: '' };
              return (
                <div key={b.badge_type} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-2xl mb-1">{meta.icon}</div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{meta.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{meta.desc}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">还没有获得徽章</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">📝 最近活动</h2>
        {profile.recent_activity.length > 0 ? (
          <div className="space-y-2">
            {profile.recent_activity.map((act, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✅</span>
                <span className="text-slate-700 dark:text-slate-300">{act.label}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {act.time ? new Date(act.time).toLocaleDateString('zh-CN') : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">暂无活动记录</p>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </AuthProvider>
  );
}
