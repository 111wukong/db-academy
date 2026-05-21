'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryResult } from '@/types';

// CodeMirror imports
import { EditorView, EditorState, basicSetup } from '@codemirror/basic-setup';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

interface SavedQuery {
  id: string;
  item_id: string;
  item_title: string | null;
  item_type: string;
  created_at: string;
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sqlText, setSqlText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<{ query: string }[]>([]);
  const [showTables, setShowTables] = useState(false);
  const [favorites, setFavorites] = useState<SavedQuery[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [darkMode, setDarkModeState] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleExecute = useCallback(async () => {
    const currentSql = sqlText.trim();
    if (!currentSql) return;
    setError('');
    setExecuting(true);

    try {
      const res = await authFetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: currentSql }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('请求失败');
    } finally {
      setExecuting(false);
    }

    // Update history
    const newHistory = [{ query: currentSql }, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('db_academy_query_history', JSON.stringify(newHistory));
  }, [sqlText, history]);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }

    const sqlParam = searchParams.get('sql');
    if (sqlParam) {
      setSqlText(decodeURIComponent(sqlParam));
    }

    // Check dark mode
    const isDark = document.documentElement.classList.contains('dark');
    setDarkModeState(isDark);

    // Load history
    const saved = localStorage.getItem('db_academy_query_history');
    if (saved) {
      try { setHistory(JSON.parse(saved).slice(0, 20)); } catch {}
    }
    loadFavorites();

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      setDarkModeState(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [searchParams, router]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    // Destroy previous editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        setSqlText(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: sqlText,
      extensions: [
        basicSetup,
        sql(),
        darkMode ? oneDark : [],
        keymap.of([indentWithTab]),
        updateListener,
        EditorView.theme({
          '&': { backgroundColor: darkMode ? '#0f172a' : '#1e293b' },
          '.cm-content': {
            caretColor: darkMode ? '#e2e8f0' : '#4ade80',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '13px',
          },
          '.cm-gutters': {
            backgroundColor: darkMode ? '#0f172a' : '#1e293b',
            color: darkMode ? '#475569' : '#64748b',
            border: 'none',
          },
          '.cm-activeLineGutter': {
            backgroundColor: darkMode ? '#1e293b' : '#334155',
          },
          '.cm-cursor': {
            borderLeftColor: darkMode ? '#e2e8f0' : '#4ade80',
          },
        }),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [darkMode]); // Recreate when dark mode changes

  const loadFavorites = async () => {
    try {
      const res = await authFetch('/api/favorites');
      const data = await res.json();
      if (data.favorites) {
        setFavorites(data.favorites.filter((f: SavedQuery) => f.item_type === 'query'));
      }
    } catch {}
  };

  const handleSaveQuery = async () => {
    if (!sqlText.trim()) return;
    setSaveMsg(null);
    try {
      const favRes = await authFetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'query',
          item_id: `q_${sqlText.trim().slice(0, 20).replace(/\s+/g, '_')}`,
        }),
      });

      if (favRes.ok) {
        setSaveMsg({ type: 'success', text: '✅ 查询已收藏' });
        loadFavorites();
      } else {
        const data = await favRes.json();
        setSaveMsg({ type: 'success', text: data.message === '已经收藏过了' ? '📌 已经收藏过了' : '❌ 收藏失败' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: '❌ 保存失败' });
    }

    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleClear = () => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
      });
    }
    setSqlText('');
    setResult(null);
    setError('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlText);
    setSaveMsg({ type: 'success', text: '📋 已复制到剪贴板' });
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleDownloadCSV = () => {
    if (!result || result.rows.length === 0) return;

    const headers = result.columns.join(',');
    const rows = result.rows.map(row =>
      result.columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveFavorite = async (favId: string) => {
    try {
      await authFetch(`/api/favorites?id=${favId}`, { method: 'DELETE' });
      loadFavorites();
    } catch {}
  };

  const tables = [
    { name: 'sandbox_employees', desc: '员工信息表', fields: ['id', 'name', 'department', 'salary', 'hire_date'] },
    { name: 'sandbox_products', desc: '商品表', fields: ['id', 'name', 'category', 'price', 'stock'] },
    { name: 'sandbox_customers', desc: '客户表', fields: ['id', 'name', 'email', 'city', 'signup_date'] },
    { name: 'sandbox_orders', desc: '订单表', fields: ['id', 'customer_id', 'product_id', 'quantity', 'order_date', 'total'] },
    { name: 'sandbox_courses', desc: '课程表', fields: ['id', 'name', 'teacher', 'credits', 'department'] },
    { name: 'sandbox_enrollments', desc: '选课成绩表', fields: ['id', 'student_id', 'course_id', 'grade', 'semester'] },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">💻 SQL 练习场</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">编写 SQL 查询语句并在沙箱环境中运行</p>
        </div>
        <div className="flex items-center gap-2">
          {result && result.rows.length > 0 && (
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center gap-1 min-h-[32px]"
            >
              📥 CSV
            </button>
          )}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 min-h-[32px] ${
              showFavorites
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-yellow-300 hover:text-yellow-600'
            }`}
          >
            ⭐ 收藏 {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Database Schema */}
          <div className="mb-4">
            <button
              onClick={() => setShowTables(!showTables)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
            >
              {showTables ? '收起' : '查看'}数据表结构 {showTables ? '▲' : '▼'}
            </button>
            {showTables && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {tables.map(table => (
                  <div key={table.name} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{table.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{table.desc}</div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      ({table.fields.join(', ')})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CodeMirror Editor */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-400 font-mono">SQL 查询</span>
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 bg-slate-700 text-white text-xs rounded-md hover:bg-slate-600 transition-colors"
                  title="复制"
                >
                  📋
                </button>
                <button
                  onClick={handleClear}
                  className="px-2 py-1 bg-slate-700 text-white text-xs rounded-md hover:bg-slate-600 transition-colors"
                  title="清空"
                >
                  🗑️
                </button>
                <button
                  onClick={handleSaveQuery}
                  disabled={!sqlText.trim()}
                  className="px-2 md:px-3 py-1 bg-slate-700 text-white text-xs rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⭐ 收藏
                </button>
                <span className="text-xs text-slate-500 hidden md:inline">⌘+Enter</span>
                <button
                  onClick={handleExecute}
                  disabled={executing || !sqlText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {executing ? '运行中...' : '▶ 运行'}
                </button>
              </div>
            </div>
            <div ref={editorRef} className="min-h-[160px]" />
          </div>

          {/* Save message toast */}
          {saveMsg && (
            <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
              saveMsg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400'
            }`}>
              {saveMsg.text}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: '查所有员工', sql: 'SELECT * FROM sandbox_employees;' },
              { label: '平均工资', sql: 'SELECT department, AVG(salary) as avg_salary FROM sandbox_employees GROUP BY department;' },
              { label: '客户订单', sql: 'SELECT c.name, p.name AS product, o.total FROM sandbox_orders o JOIN sandbox_customers c ON o.customer_id = c.id JOIN sandbox_products p ON o.product_id = p.id;' },
              { label: '热销商品', sql: "SELECT p.name, SUM(o.quantity) as total_sold FROM sandbox_products p JOIN sandbox_orders o ON p.id = o.product_id GROUP BY p.name ORDER BY total_sold DESC;" },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setSqlText(item.sql);
                  if (viewRef.current) {
                    viewRef.current.dispatch({
                      changes: { from: 0, to: viewRef.current.state.doc.length, insert: item.sql },
                    });
                  }
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 transition-colors min-h-[32px]"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
              <div className="font-medium mb-1">⚠️ 查询出错</div>
              <div className="font-mono text-xs">{error}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  查询结果 · {result.rowCount} 行 · {result.executionTime}ms
                </span>
              </div>
              <div className="overflow-x-auto sql-result">
                {result.columns.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th className="text-xs">#</th>
                        {result.columns.map(col => (
                          <th key={col} className="text-xs whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="text-xs text-slate-400">{i + 1}</td>
                          {result.columns.map(col => (
                            <td key={col} className="text-sm whitespace-nowrap">
                              {row[col] !== null ? String(row[col]) : <span className="text-slate-300 dark:text-slate-500">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">查询完成，无数据返回</div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">最近查询</h3>
              <div className="space-y-1">
                {history.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSqlText(item.query);
                      if (viewRef.current) {
                        viewRef.current.dispatch({
                          changes: { from: 0, to: viewRef.current.state.doc.length, insert: item.query },
                        });
                      }
                    }}
                    className="block w-full text-left px-3 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-colors truncate"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Favorites sidebar */}
        {showFavorites && (
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">⭐ 收藏的查询</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {favorites.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    还没有收藏的查询<br />
                    执行查询后点击「收藏」按钮
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="p-3 group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              setSqlText(fav.item_title || '');
                              if (viewRef.current && fav.item_title) {
                                viewRef.current.dispatch({
                                  changes: { from: 0, to: viewRef.current.state.doc.length, insert: fav.item_title },
                                });
                              }
                            }}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                              {fav.item_title || '查询'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(fav.created_at).toLocaleDateString('zh-CN')}
                            </p>
                          </button>
                          <button
                            onClick={() => handleRemoveFavorite(fav.id)}
                            className="text-xs text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="取消收藏"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaygroundPageInner() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">加载中...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}

export default function PlaygroundPage() {
  return (
    <AuthProvider>
      <AppShell>
        <PlaygroundPageInner />
      </AppShell>
    </AuthProvider>
  );
}
