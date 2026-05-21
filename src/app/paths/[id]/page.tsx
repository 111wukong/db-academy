'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PathModule {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  order_index: number;
  required: number;
  lesson_count: number;
  completed_lessons: number;
}

function PathDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [path_, setPath_] = useState<Record<string, unknown> | null>(null);
  const [modules, setModules] = useState<PathModule[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    authFetch(`/api/paths?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.path) {
          setPath_(data.path);
          setModules(data.modules || []);
          setProgress(data.progress || 0);
          setTotalLessons(data.total_lessons || 0);
          setCompletedLessons(data.completed_lessons || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  const difficultyLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };
  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  if (!path_) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-slate-400">学习路径不存在</p>
        <Link href="/paths" className="text-blue-600 text-sm mt-2 inline-block">← 返回路径列表</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/paths" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
        ← 全部路径
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{path_.title as string}</h1>
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">🎯 {path_.target_role as string}</p>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{path_.description as string}</p>

        {/* Progress */}
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">总进度</span>
          <span className="font-medium text-blue-600">{completedLessons}/{totalLessons}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>📚 {modules.length} 个模块</span>
          <span>⏱️ ~{path_.estimated_hours as number} 小时</span>
        </div>
      </div>

      {/* Module Checklist */}
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">学习模块</h2>
      <div className="space-y-3">
        {modules.map((mod, i) => {
          const modProgress = mod.lesson_count > 0
            ? Math.round((mod.completed_lessons / mod.lesson_count) * 100)
            : 0;
          const allDone = mod.completed_lessons >= mod.lesson_count;
          const started = mod.completed_lessons > 0;

          return (
            <div key={mod.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                  allDone ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                  started ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  {allDone ? '✅' : started ? '📖' : i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{mod.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${difficultyColors[mod.difficulty] || ''}`}>
                      {difficultyLabels[mod.difficulty] || mod.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      📖 {mod.completed_lessons}/{mod.lesson_count} 课时
                      {mod.required ? '' : ' (选修)'}
                    </span>
                    <Link
                      href={`/learn/${mod.id}`}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                        allDone
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {allDone ? '已学完' : started ? '继续' : '开始学习'}
                    </Link>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${modProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PathDetailPage() {
  return (
    <AuthProvider>
      <AppShell>
        <PathDetailContent />
      </AppShell>
    </AuthProvider>
  );
}
