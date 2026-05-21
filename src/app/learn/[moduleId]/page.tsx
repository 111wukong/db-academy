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
  const [showLessonList, setShowLessonList] = useState(false);
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
    beginner: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonList(false);
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

  // Lesson list component (shared between sidebar and mobile dropdown)
  const lessonListContent = (
    <>
      {/* Module title (desktop only in sidebar) */}
      <div className="hidden md:block">
        <Link href="/learn" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← 全部课程
        </Link>
        <h2 className="font-bold text-slate-800 dark:text-white mb-1">{module_.title as string}</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[module_.difficulty as string] || ''}`}>
            {difficultyLabels[module_.difficulty as string] || module_.difficulty as string}
          </span>
          <span className="text-xs text-slate-400">⏱️ {module_.estimated_minutes as string} 分钟</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>进度</span>
          <span>{completedCount}/{lessons.length}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
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
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {lesson.completed ? (
                <span className="text-green-500 text-xs shrink-0">✅</span>
              ) : (
                <span className="text-slate-300 dark:text-slate-500 text-xs shrink-0">{i + 1}</span>
              )}
              <span className="flex-1 truncate">{lesson.title}</span>
              {lesson.quiz_score !== null && (
                <span className="text-xs text-blue-500 shrink-0">{lesson.quiz_score}分</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-0">
      {/* Mobile: Select dropdown for lesson list */}
      <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-2">
          <Link href="/learn" className="text-sm text-blue-600 hover:text-blue-700">
            ← 全部课程
          </Link>
          <button
            onClick={() => setShowLessonList(!showLessonList)}
            className="text-sm text-blue-600 font-medium"
          >
            {showLessonList ? '收起课程列表 ▲' : '课程列表 ▼'}
          </button>
        </div>
        <h2 className="font-bold text-slate-800 dark:text-white text-lg">{module_.title as string}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[module_.difficulty as string] || ''}`}>
            {difficultyLabels[module_.difficulty as string] || module_.difficulty as string}
          </span>
          <span className="text-xs text-slate-400">⏱️ {module_.estimated_minutes as string} 分钟</span>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>进度</span>
            <span>{completedCount}/{lessons.length}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Collapsible lesson list on mobile */}
        {showLessonList && (
          <div className="mt-3 max-h-48 overflow-y-auto">
            {lessonListContent}
          </div>
        )}
      </div>

      {/* Desktop: Lesson Sidebar */}
      <div className="hidden md:block w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0 p-4">
        {lessonListContent}
      </div>

      {/* Lesson Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {selectedLesson ? (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedLesson.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">第 {selectedLesson.order_index} 课</span>
                {selectedLesson.completed ? (
                  <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">已完成</span>
                ) : null}
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="markdown-content dark:text-slate-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedLesson.content}
                </ReactMarkdown>
              </div>
            </div>

            {selectedLesson.example_sql && (
              <div className="mt-8 p-4 bg-slate-900 dark:bg-slate-950 rounded-xl">
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

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleComplete}
                disabled={selectedLesson.completed === 1}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-center ${
                  selectedLesson.completed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedLesson.completed ? '✅ 已完成' : '标记为已完成'}
              </button>

              <Link
                href={`/quiz/${selectedLesson.id}`}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-center"
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
