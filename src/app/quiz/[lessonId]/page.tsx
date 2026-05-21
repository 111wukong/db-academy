'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuizData {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
}

function QuizContent() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [lessonTitle, setLessonTitle] = useState('');
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
    passed: boolean;
    details: { quizId: string; isCorrect: boolean; correctAnswer: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
    authFetch(`/api/quiz?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(data => {
        if (data.quizzes) {
          setLessonTitle(data.lessonTitle || '');
          setQuizzes(data.quizzes);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId, router]);

  const handleAnswer = (quizIndex: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [quizIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    // Check all answered
    if (Object.keys(answers).length < quizzes.length) {
      alert('请回答所有题目后再提交');
      return;
    }

    const res = await authFetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        answers: quizzes.map((_, i) => answers[i] ?? -1),
      }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitted(true);
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">加载中...</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/learn/${lessonId}`} className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← 返回课程
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">📝 课程测验</h1>
        <p className="text-slate-500">{lessonTitle} — {quizzes.length} 道题</p>
      </div>

      {/* Quiz Questions */}
      <div className="space-y-6">
        {quizzes.map((quiz, qi) => (
          <div
            key={quiz.id}
            className={`bg-white rounded-xl p-6 border ${
              submitted
                ? result?.details[qi]?.isCorrect
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-red-200 bg-red-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-2 mb-4">
              <span className="text-sm font-bold text-blue-600 shrink-0 mt-0.5">
                {qi + 1}.
              </span>
              <h3 className="text-sm font-medium text-slate-800">{quiz.question}</h3>
            </div>

            <div className="ml-6 space-y-2">
              {quiz.options.map((option, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrectAnswer = quiz.correct_answer === oi;
                let bgColor = 'bg-white border-slate-200';
                let textColor = 'text-slate-700';
                let indicator = '';

                if (submitted) {
                  if (isCorrectAnswer) {
                    bgColor = 'bg-green-50 border-green-300';
                    textColor = 'text-green-700';
                    indicator = '✅';
                  } else if (isSelected && !isCorrectAnswer) {
                    bgColor = 'bg-red-50 border-red-300';
                    textColor = 'text-red-700';
                    indicator = '❌';
                  } else {
                    bgColor = 'bg-slate-50 border-slate-200';
                    textColor = 'text-slate-400';
                  }
                } else if (isSelected) {
                  bgColor = 'bg-blue-50 border-blue-300';
                  textColor = 'text-blue-700';
                }

                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(qi, oi)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-2.5 border rounded-lg text-sm transition-colors ${bgColor} ${textColor} hover:border-blue-300 disabled:cursor-default`}
                  >
                    <span className="font-mono mr-2">{optionLabels[oi]}.</span>
                    {option}
                    {indicator && <span className="float-right">{indicator}</span>}
                  </button>
                );
              })}
            </div>

            {/* Show explanation after submission */}
            {submitted && (
              <div className="mt-3 ml-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                💡 {quiz.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit / Results */}
      <div className="mt-8">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quizzes.length}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            提交答案 ({Object.keys(answers).length}/{quizzes.length})
          </button>
        ) : result ? (
          <div className="text-center">
            <div className={`inline-block p-8 rounded-2xl ${
              result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-4xl mb-2">{result.passed ? '🎉' : '💪'}</div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {result.score} 分
              </div>
              <p className="text-slate-500 mb-1">
                答对 {result.correct}/{result.total} 题
              </p>
              <p className={`text-sm ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
                {result.passed ? '✅ 通过！继续下一课' : '未通过，再试一次？'}
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setResult(null);
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                重新测验
              </button>
              <Link
                href={`/learn/${lessonId}`}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                返回课程
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <AuthProvider>
      <AppShell>
        <QuizContent />
      </AppShell>
    </AuthProvider>
  );
}
