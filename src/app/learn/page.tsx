'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Module } from '@/types';
import { authFetch } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

function LearnPageContent() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
    authFetch('/api/modules')
      .then(r => r.json())
      .then(data => {
        if (data.modules) setModules(data.modules);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    advanced: 'bg-red-100 text-red-700 border-red-200',
  };
  const difficultyLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };

  const icons = ['📘', '📗', '📕', '📙', '📔'];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">📚 全部课程</h1>
        <p className="text-slate-500 mt-1">从基础到进阶，系统学习数据库知识</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((mod, i) => {
            const modProgress = mod.lesson_count > 0
              ? Math.round((mod.completed_lessons / mod.lesson_count) * 100)
              : 0;
            return (
              <Link key={mod.id} href={`/learn/${mod.id}`}>
                <div className="bg-white rounded-xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl">{icons[i % icons.length]}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {mod.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ml-2 ${difficultyColors[mod.difficulty]}`}>
                          {difficultyLabels[mod.difficulty]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>📖 {mod.lesson_count} 课时 · ⏱️ {mod.estimated_minutes} 分钟</span>
                    <span className="text-blue-600 font-medium">{mod.completed_lessons}/{mod.lesson_count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${modProgress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && modules.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-400">暂无课程数据，请先运行种子数据</p>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <AuthProvider>
      <AppShell>
        <LearnPageContent />
      </AppShell>
    </AuthProvider>
  );
}
