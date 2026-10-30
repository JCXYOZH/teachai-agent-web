'use client';

import { MousePointerClick, RotateCcw, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ClassroomInteractiveContent, ClassroomWidgetType } from '@/lib/api/types';
import { buildInteractiveDocument } from '@/lib/classroom/interactive-document';

const widgetTypeLabels: Record<ClassroomWidgetType, string> = {
  simulation: '模拟实验',
  diagram: '结构图',
  code: '代码演练',
  game: '互动挑战',
  visualization3d: '立体可视化',
  'procedural-skill': '操作流程',
};

export function InteractiveStage({
  content,
}: {
  content: ClassroomInteractiveContent;
}) {
  const [nonce, setNonce] = useState(0);
  const html = typeof content.html === 'string' ? content.html : '';
  const source = useMemo(() => buildInteractiveDocument(html), [html]);
  const widgetType = content.widgetType ?? 'simulation';
  const widgetLabel = widgetTypeLabels[widgetType] ?? '互动组件';

  return (
    <div className='relative overflow-hidden border border-chalk/10 bg-[#0B1714]'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_6%,rgba(217,88,61,0.12),transparent_36%),radial-gradient(circle_at_6%_94%,rgba(169,189,168,0.1),transparent_40%)]' />
      <div className='relative flex flex-wrap items-end justify-between gap-4 border-b border-chalk/10 p-4 sm:p-6'>
        <div className='min-w-0'>
          <p className='font-mono text-[0.52rem] uppercase tracking-[0.22em] text-sage/60'>
            Lab / {widgetLabel}
          </p>
          <h2 className='mt-2 flex items-center gap-2 font-display text-xl font-medium tracking-[-0.02em] text-chalk sm:text-2xl'>
            <MousePointerClick className='h-5 w-5 shrink-0 text-ember' strokeWidth={1.6} />
            <span className='min-w-0'>{content.prompt || '动手试一试'}</span>
          </h2>
        </div>
        <button
          type='button'
          onClick={() => setNonce((value) => value + 1)}
          className='inline-flex h-9 shrink-0 items-center gap-2 border border-chalk/15 px-3 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-chalk/60 transition-colors hover:border-sage/40 hover:text-chalk'
        >
          <RotateCcw className='h-3.5 w-3.5' />
          重置组件
        </button>
      </div>

      <div className='relative overflow-x-auto p-3 sm:p-4'>
        <div className='h-[720px] w-[1280px] shrink-0 overflow-hidden border border-chalk/10 bg-[#07110e] md:h-auto md:aspect-video md:w-full'>
          <iframe
            key={`${widgetType}-${nonce}`}
            title={`互动组件：${content.prompt || widgetLabel}`}
            srcDoc={source}
            sandbox='allow-scripts'
            referrerPolicy='no-referrer'
            loading='eager'
            className='h-full w-full border-0'
          />
        </div>
      </div>

      <div className='relative flex items-start gap-2 border-t border-chalk/10 px-4 py-3 text-[0.7rem] leading-6 text-chalk/35 sm:px-6'>
        <ShieldCheck className='mt-1 h-3.5 w-3.5 shrink-0 text-sage/60' strokeWidth={1.6} />
        <p>
          组件在隔离沙箱中离线运行，无法访问本站数据或发起网络请求。移动端可左右拖动查看完整画布。
        </p>
      </div>
    </div>
  );
}
