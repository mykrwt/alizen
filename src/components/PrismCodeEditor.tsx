'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  language: string;
  onChange: (v: string) => void;
}

export function PrismCodeEditor({ value, language, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft, value]);

  const highlighted = useHighlighted(value, language);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-alizen-bg font-mono text-[12.5px]">
      {/* Line numbers gutter */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 m-0 p-0 overflow-auto pointer-events-none leading-[1.65]',
          `language-${language}`
        )}
        style={{ tabSize: 2 }}
      >
        <code
          className={`language-${language}`}
          style={{
            display: 'block',
            padding: '12px 16px 12px 48px',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
      </pre>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          setScrollTop(e.currentTarget.scrollTop);
          setScrollLeft(e.currentTarget.scrollLeft);
        }}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        className="absolute inset-0 w-full h-full m-0 p-0 bg-transparent text-transparent caret-alizen-accent resize-none outline-none font-mono leading-[1.65] selection:bg-alizen-accent/20 whitespace-pre overflow-auto"
        style={{ tabSize: 2, padding: '12px 16px 12px 48px' }}
      />
    </div>
  );
}

function useHighlighted(code: string, language: string): string {
  try {
    const grammar = Prism.languages[language] ?? Prism.languages.text;
    return Prism.highlight(code, grammar, language);
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
