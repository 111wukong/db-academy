import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { SearchResult } from '@/types';

// GET /api/search?q=xxx — full-text search on lesson titles and content
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const searchTerm = `%${q.trim()}%`;
  const db = getDb();

  const results = db.prepare(`
    SELECT
      l.id as lesson_id,
      l.title as lesson_title,
      m.id as module_id,
      m.title as module_title,
      l.content,
      l.order_index
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE l.title LIKE ? OR l.content LIKE ?
    ORDER BY m.order_index, l.order_index
    LIMIT 30
  `).all(searchTerm, searchTerm) as SearchResult[];

  // Build snippets (first ~200 chars of relevant content)
  const formatted = results.map(r => {
    const lowerContent = r.content.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lowerContent.indexOf(lowerQ);

    let snippet = '';
    if (idx >= 0) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(r.content.length, idx + lowerQ.length + 120);
      snippet = (start > 0 ? '...' : '') + r.content.slice(start, end) + (end < r.content.length ? '...' : '');
    } else {
      snippet = r.content.slice(0, 200) + (r.content.length > 200 ? '...' : '');
    }

    // Clean markdown from snippet
    snippet = snippet.replace(/[#*`_\[\]]/g, '').replace(/\n+/g, ' ').trim();

    return {
      lesson_id: r.lesson_id,
      lesson_title: r.lesson_title,
      module_id: r.module_id,
      module_title: r.module_title,
      snippet,
    };
  });

  return NextResponse.json({ results: formatted, total: formatted.length });
}
