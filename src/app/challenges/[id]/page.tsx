'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple SQL editor component
function SimpleSQLEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
      });
    }
  };

  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full h-48 p-4 bg-slate-900 text-green-400 text-sm font-mono border-none outline-none resize-y rounded-lg"
      placeholder="SELECT ..."
      spellCheck={false}
    />
  );
}

function ChallengeDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Record<string, unknown> | null>(null);
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<{
    passed: boolean;
    actual_output: Record<string, unknown>[];
    expected_output: Record<string, unknown>[];
    columns: string[];
    error: string;
    xp_awarded: number;
    new_badges: { type: string; label: string; icon: string }[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    authFetch(`/api/challenges?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.challenge) {
          setChallenge(data.challenge);
          setSql((data.challenge as any).starter_sql || 'SELECT ');
          setPassed(!!data.passed);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = useCallback(async () => {
    if (!sql.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await authFetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: id, sql: sql.trim() }),
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) setPassed(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [id, sql, submitting]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard: 'bg-red-100 text-red-700 border-red-200',
  };
  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">加载中...</div>
    );
  }

  if (!challenge) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-slate-400">挑战不存在</p>
        <Link href="/challenges" className="text-blue-600 text-sm mt-2 inline-block">← 返回挑战列表</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" onKeyDown={handleKeyDown}>
      <Link href="/challenges" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
        ← 全部挑战
      </Link>

      {/* Challenge Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{challenge.title as string}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColors[challenge.difficulty as string] || ''}`}>
                {difficultyLabels[challenge.difficulty as string] || challenge.difficulty as string}
              </span>
              {passed && <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">✅ 已通过</span>}
            </div>
          </div>
        </div>

        <div className="markdown-content text-sm text-slate-700 dark:text-slate-300">
          <p>{challenge.description as string}</p>
        </div>

        {(challenge.hint as string) && (
          <details className="mt-4">
            <summary className="text-sm text-yellow-600 cursor-pointer hover:text-yellow-700">💡 查看提示</summary>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              {challenge.hint as string}
            </p>
          </details>
        )}
      </div>

      {/* Editor */}
      <div className="bg-slate-900 rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
          <span className="text-xs text-slate-400 font-mono">你的答案</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">⌘+Enter 提交</span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !sql.trim() || passed}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '提交中...' : passed ? '✅ 已通过' : '▶ 提交'}
            </button>
          </div>
        </div>
        <SimpleSQLEditor value={sql} onChange={setSql} />
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border overflow-hidden mb-6 ${
          result.passed
            ? 'border-green-200 dark:border-green-700'
            : result.error
              ? 'border-red-200 dark:border-red-700'
              : 'border-orange-200 dark:border-orange-700'
        }`}>
          <div className={`px-4 py-3 text-sm font-medium ${
            result.passed
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : result.error
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
          }`}>
            {result.passed ? (
              <div>
                ✅ 通过！{result.xp_awarded > 0 && ` +${result.xp_awarded} XP`}
                {result.new_badges?.map(b => (
                  <span key={b.type} className="ml-2">{b.icon} {b.label}</span>
                ))}
              </div>
            ) : result.error ? (
              <span>❌ 执行错误：{result.error}</span>
            ) : (
              <span>❌ 结果不匹配，再试一次</span>
            )}
          </div>

          {/* Compare results */}
          {!result.passed && !result.error && result.expected_output && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
              <div className="p-4">
                <h4 className="text-xs font-semibold text-red-600 mb-2">你的结果</h4>
                <div className="overflow-x-auto sql-result text-xs">
                  {result.actual_output && result.actual_output.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          {(result.columns || []).map((col: string) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.actual_output.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i}>
                            {(result.columns || []).map((col: string) => (
                              <td key={col}>{row[col] !== null ? String(row[col]) : 'NULL'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-400">无结果</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-xs font-semibold text-green-600 mb-2">期望结果</h4>
                <div className="overflow-x-auto sql-result text-xs">
                  {result.expected_output && result.expected_output.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          {(result.columns || []).map((col: string) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.expected_output.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i}>
                            {(result.columns || []).map((col: string) => (
                              <td key={col}>{row[col] !== null ? String(row[col]) : 'NULL'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-400">无结果</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {result?.passed && (
        <div className="text-center py-4">
          <Link href="/challenges" className="text-blue-600 hover:text-blue-700 text-sm">
            ← 返回挑战列表，继续下一个 →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ChallengeDetailPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ChallengeDetailContent />
      </AppShell>
    </AuthProvider>
  );
}
