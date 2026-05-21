'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PathItem {
  id: string;
  title: string;
  description: string;
  target_role: string;
  icon: string;
  difficulty: string;
  estimated_hours: number;
  module_count: number;
  total_lessons: number;
  completed_lessons: number;
}

function PathsContent() {
  const router = useRouter();
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    authFetch('/api/paths')
      .then(r => r.json())
      .then(data => {
        setPaths(data.paths || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const pathIcons: Record<string, string> = {
    '数据分析师': '📊',
    '后端开发工程师': '⚙️',
    'DBA 数据库管理员': '🗄️',
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">🧭 学习路径</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">选择适合你的职业方向，系统化学习数据库知识</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map(path => {
          const progress = path.total_lessons > 0
            ? Math.round((path.completed_lessons / path.total_lessons) * 100)
            : 0;
          const icon = pathIcons[path.target_role] || path.icon || '🧭';

          return (
            <Link key={path.id} href={`/paths/${path.id}`}>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all group">
                <div className="text-4xl mb-4">{icon}</div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                  {path.title}
                </h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                  🎯 {path.target_role}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{path.description}</p>

                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-3">
                  <span>📚 {path.module_count} 模块</span>
                  <span>⏱️ ~{path.estimated_hours} 小时</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">进度</span>
                  <span className="font-medium text-blue-600">{path.completed_lessons}/{path.total_lessons}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && paths.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🧭</div>
          <p className="text-slate-400">暂无学习路径</p>
        </div>
      )}
    </div>
  );
}

export default function PathsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <PathsContent />
      </AppShell>
    </AuthProvider>
  );
}
