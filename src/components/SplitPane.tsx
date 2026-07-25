'use client';

import { Fragment, ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'horizontal' | 'vertical';

export function SplitPane({
  direction = 'horizontal',
  children,
  className,
  sizes: initSizes,
  minSizes,
}: {
  direction?: Direction;
  children: ReactNode[];
  className?: string;
  sizes?: number[];
  minSizes?: number[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const kids = Array.isArray(children) ? children : [children];
  const count = kids.length;

  const [sizes, setSizes] = useState<number[]>(() => {
    if (initSizes && initSizes.length === count) return initSizes;
    return new Array(count).fill(100 / count);
  });

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setSizes((prev) => {
      if (prev.length === count) return prev;
      return new Array(count).fill(100 / count);
    });
  }, [count]);

  const dragState = useRef<{
    idx: number;
    startPos: number;
    startSizes: number[];
    totalPx: number;
  } | null>(null);

  const onMouseDown = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalPx = direction === 'horizontal' ? rect.width : rect.height;
      const startSizes = paneRefs.current.map((el, i) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return direction === 'horizontal' ? r.width : r.height;
      });
      dragState.current = {
        idx,
        startPos: direction === 'horizontal' ? e.clientX : e.clientY,
        startSizes,
        totalPx,
      };
      setDragging(true);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction]
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragState.current;
      if (!d) return;
      const delta = (direction === 'horizontal' ? e.clientX : e.clientY) - d.startPos;
      const minA = minSizes?.[d.idx] ?? 100;
      const minB = minSizes?.[d.idx + 1] ?? 100;
      const newA = d.startSizes[d.idx] + delta;
      const newB = d.startSizes[d.idx + 1] - delta;
      if (newA < minA || newB < minB) return;

      const newPctPanes = paneRefs.current.map((el, i) => {
        const px = i === d.idx ? newA : i === d.idx + 1 ? newB : d.startSizes[i];
        return (px / d.totalPx) * 100;
      });

      newPctPanes.forEach((pct, i) => {
        const el = paneRefs.current[i];
        if (el) {
          if (direction === 'horizontal') el.style.width = `${pct}%`;
          else el.style.height = `${pct}%`;
        }
      });
      setSizes(newPctPanes);
    }
    function onUp() {
      dragState.current = null;
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [direction, minSizes]);

  const isH = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={cn('flex w-full h-full', isH ? 'flex-row' : 'flex-col', className)}
    >
      {kids.map((child, i) => (
        <Fragment key={`pane-${i}`}>
          <div
            ref={(el) => { paneRefs.current[i] = el; }}
            className="min-w-0 min-h-0 overflow-hidden relative"
            style={
              isH
                ? { width: `${sizes[i]}%`, flex: '0 0 auto' }
                : { height: `${sizes[i]}%`, flex: '0 0 auto' }
            }
          >
            {child}
          </div>
          {i < count - 1 && (
            <div
              onMouseDown={(e) => onMouseDown(i, e)}
              className={cn(
                'flex-shrink-0 z-10 transition-colors duration-150',
                isH
                  ? 'w-px cursor-col-resize hover:w-[3px]'
                  : 'h-px cursor-row-resize hover:h-[3px]',
                dragging
                  ? 'bg-alizen-accent/50'
                  : 'bg-alizen-border hover:bg-alizen-accent/30'
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
