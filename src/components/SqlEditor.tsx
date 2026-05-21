'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab, history, historyKeymap, defaultKeymap, deleteGroupBackward } from '@codemirror/commands';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  darkMode?: boolean;
}

// Manual basic setup equivalent - no bundled deps
function lightTheme() {
  return EditorView.theme({
    '&': { backgroundColor: '#1e293b', color: '#e2e8f0' },
    '.cm-content': {
      caretColor: '#4ade80',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '13px',
    },
    '.cm-gutters': {
      backgroundColor: '#1e293b',
      color: '#64748b',
      border: 'none',
    },
    '.cm-activeLineGutter': { backgroundColor: '#334155' },
    '.cm-cursor': { borderLeftColor: '#4ade80' },
    '.cm-selectionBackground': { backgroundColor: '#334155' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#475569' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#4ade80' },
    '.cm-selectionMatch': { backgroundColor: '#1e3a5f' },
  });
}

export default function SqlEditor({ value, onChange, darkMode }: SqlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeComp = useRef(new Compartment());

  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        sql(),
        themeComp.current.of(darkMode ? oneDark : lightTheme()),
        updateListener,
        EditorView.lineWrapping,
        EditorState.tabSize.of(2),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Switch theme
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeComp.current.reconfigure(darkMode ? oneDark : lightTheme()),
    });
  }, [darkMode]);

  return (
    <div
      ref={editorRef}
      className="border-0 overflow-y-auto text-sm"
      style={{ minHeight: '10rem', maxHeight: '24rem' }}
    />
  );
}

// Import these from the right places
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';
