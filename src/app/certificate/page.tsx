'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Module } from '@/types';

function CertificateContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    const savedUser = localStorage.getItem('db_academy_user');
    if (savedUser) {
      try {
        setUserName(JSON.parse(savedUser).name || '用户');
      } catch {}
    }

    authFetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        if (data.modules) setModules(data.modules);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const totalLessons = modules.reduce((sum, m) => sum + m.lesson_count, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_lessons, 0);
  const allCompleted = totalLessons > 0 && completedLessons >= totalLessons;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const today = new Date();
  const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  const certId = `DB-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">加载中...</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">🎓 证书中心</h1>
        <p className="text-slate-500 mt-1">完成所有课程可获得结业证书</p>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">学习进度</h2>
          <span className="text-sm text-slate-500">{completedLessons}/{totalLessons} 课时</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              allCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-slate-500">
          {allCompleted
            ? '🎉 恭喜！你已经完成了所有课程！'
            : `还需要完成 ${totalLessons - completedLessons} 课才能获得证书`
          }
        </p>
      </div>

      {/* Certificate */}
      {allCompleted && (
        <div className="flex justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-yellow-400 shadow-xl overflow-hidden">
            {/* Decorative top */}
            <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400" />

            <div className="p-8 text-center">
              {/* Seal */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-6 shadow-lg">
                <span className="text-3xl">🏆</span>
              </div>

              <h1 className="text-3xl font-bold text-slate-800 mb-2">结业证书</h1>
              <p className="text-sm text-slate-400 mb-6">Certificate of Completion</p>

              <div className="border-t border-b border-slate-100 py-6 mb-6">
                <p className="text-sm text-slate-500 mb-2">兹证明</p>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{userName}</h2>
                <p className="text-sm text-slate-500">已完成</p>
                <h3 className="text-lg font-semibold text-blue-600 mt-1">DB Academy 数据库在线课程</h3>
                <p className="text-sm text-slate-400 mt-3">
                  共计 {totalLessons} 课时 · 涵盖 SQL、数据库设计、索引优化、事务并发、NoSQL 与安全
                </p>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-4">
                <div className="text-center">
                  <p className="font-semibold text-slate-600">完成日期</p>
                  <p>{dateStr}</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">成就</p>
                  <p>{progress}% 完成</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">证书编号</p>
                  <p className="font-mono text-xs">{certId}</p>
                </div>
              </div>
            </div>

            {/* Decorative bottom */}
            <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400" />
          </div>
        </div>
      )}

      {/* Not yet completed */}
      {!allCompleted && totalLessons > 0 && (
        <div className="text-center py-8">
          <div className="inline-block p-8 bg-white rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-semibold text-slate-800 mb-2">继续学习以获得证书</p>
            <p className="text-sm text-slate-500 mb-4">
              完成全部 {totalLessons} 课时即可领取结业证书
            </p>
            <Link
              href="/learn"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              继续学习 →
            </Link>
          </div>
        </div>
      )}

      {/* Module progress breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">模块进度</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map(mod => {
            const modProgress = mod.lesson_count > 0
              ? Math.round((mod.completed_lessons / mod.lesson_count) * 100)
              : 0;
            return (
              <Link key={mod.id} href={`/learn/${mod.id}`}>
                <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{mod.title}</span>
                    <span className="text-xs text-slate-500">{mod.completed_lessons}/{mod.lesson_count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
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
    </div>
  );
}

export default function CertificatePage() {
  return (
    <AuthProvider>
      <AppShell>
        <CertificateContent />
      </AppShell>
    </AuthProvider>
  );
}
