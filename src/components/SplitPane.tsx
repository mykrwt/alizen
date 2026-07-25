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
  /** Initial size percentages per child (e.g. [30, 70]) */
  sizes?: number[];
  minSizes?: number[]; // px
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const kids = Array.isArray(children) ? children : [children];
  const count = kids.length;

  const [sizes, setSizes] = useState<number[]>(() => {
    if (initSizes && initSizes.length === count) return initSizes;
    return new Array(count).fill(100 / count);
  });

  // Reset size tracking when child count changes
  useEffect(() => {
    setSizes((prev) => {
      if (prev.length === count) return prev;
      return new Array(count).fill(100 / count);
    });
  }, [count]);

  const dragState = useRef<{
    idx: number;
    startPos: number;
    startSizes: number[]; // in pixels
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

      // Compute new percentages for all panes — only idx and idx+1 change
      const newPctPanes = paneRefs.current.map((el, i) => {
        const r = el?.getBoundingClientRect();
        const px =
          i === d.idx ? newA : i === d.idx + 1 ? newB : d.startSizes[i];
        return (px / d.totalPx) * 100;
      });

      // Apply directly to DOM for smoothness; state updates after drag
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
        <Fragment key={`pane-group-${i}`}>
          <div
            ref={(el) => {
              paneRefs.current[i] = el;
            }}
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
                'flex-shrink-0 z-10 transition-colors hover:!bg-alizen-accent',
                isH
                  ? 'w-[3px] cursor-col-resize'
                  : 'h-[3px] cursor-row-resize'
              )}
              style={{ background: '#232336' }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
