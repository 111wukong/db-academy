'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  example_sql: string | null;
  completed: number;
  quiz_score: number | null;
}

function ModuleDetailContent() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module_, setModule_] = useState<Record<string, unknown> | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
    authFetch(`/api/modules?moduleId=${moduleId}`)
      .then(r => r.json())
      .then(data => {
        if (data.module) {
          setModule_(data.module);
          setLessons(data.lessons || []);
          if (data.lessons?.length > 0) {
            setSelectedLesson(data.lessons[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moduleId, router]);

  const difficultyLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };
  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-600 bg-green-50',
    intermediate: 'text-yellow-600 bg-yellow-50',
    advanced: 'text-red-600 bg-red-50',
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Mark as viewed (lesson opened)
    authFetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lesson.id, completed: false }),
    }).catch(console.error);
  };

  const handleComplete = async () => {
    if (!selectedLesson) return;
    await authFetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: selectedLesson.id, completed: true }),
    });
    setLessons(prev => prev.map(l =>
      l.id === selectedLesson.id ? { ...l, completed: 1 } : l
    ));
    setSelectedLesson(prev => prev ? { ...prev, completed: 1 } : null);
  };

  const completedCount = lessons.filter(l => l.completed).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">加载中...</div>
    );
  }

  if (!module_) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-slate-400">模块不存在</p>
        <Link href="/learn" className="text-blue-600 text-sm mt-2 inline-block">← 返回课程列表</Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Lesson Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto shrink-0 p-4">
        <Link href="/learn" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← 全部课程
        </Link>
        <h2 className="font-bold text-slate-800 mb-1">{module_.title as string}</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[module_.difficulty as string] || ''}`}>
            {difficultyLabels[module_.difficulty as string] || module_.difficulty as string}
          </span>
          <span className="text-xs text-slate-400">⏱️ {module_.estimated_minutes as string} 分钟</span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>进度</span>
            <span>{completedCount}/{lessons.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-1">
          {lessons.map((lesson, i) => (
            <button
              key={lesson.id}
              onClick={() => handleLessonClick(lesson)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedLesson?.id === lesson.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {lesson.completed ? (
                  <span className="text-green-500 text-xs">✅</span>
                ) : (
                  <span className="text-slate-300 text-xs">{i + 1}</span>
                )}
                <span className="flex-1 truncate">{lesson.title}</span>
                {lesson.quiz_score !== null && (
                  <span className="text-xs text-blue-500">{lesson.quiz_score}分</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedLesson ? (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{selectedLesson.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">第 {selectedLesson.order_index} 课</span>
                {selectedLesson.completed ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已完成</span>
                ) : null}
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedLesson.content}
                </ReactMarkdown>
              </div>
            </div>

            {selectedLesson.example_sql && (
              <div className="mt-8 p-4 bg-slate-900 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">示例查询</span>
                  <Link
                    href={`/playground?sql=${encodeURIComponent(selectedLesson.example_sql)}`}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    在练习区运行 →
                  </Link>
                </div>
                <pre className="text-sm text-green-400 overflow-x-auto">
                  <code>{selectedLesson.example_sql}</code>
                </pre>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={handleComplete}
                disabled={selectedLesson.completed === 1}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLesson.completed
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedLesson.completed ? '✅ 已完成' : '标记为已完成'}
              </button>

              <Link
                href={`/quiz/${selectedLesson.id}`}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                开始测验
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-4">📖</div>
            <p>请从左侧选择一课开始学习</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModuleDetailPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ModuleDetailContent />
      </AppShell>
    </AuthProvider>
  );
}
