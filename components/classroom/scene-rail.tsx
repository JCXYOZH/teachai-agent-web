'use client';

import { SceneTypeIcon } from '@/components/classroom/scene-type-icon';
import type { ClassroomScene } from '@/lib/api/types';
import { sceneTypeLabels } from '@/lib/utils/classroom-scene';
import { cn } from '@/lib/utils/cn';

export function SceneRail({
  scenes,
  activeIndex,
  onSelect,
  className,
}: {
  scenes: ClassroomScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <aside
      aria-label='课堂场景列表'
      className={cn(
        'flex-col border border-chalk/10 bg-classroom/45 p-3 backdrop-blur-sm',
        className,
      )}
    >
      <div className='flex items-center justify-between px-2 pb-3 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-chalk/35'>
        <span>Scenes</span>
        <span>{String(scenes.length).padStart(2, '0')}</span>
      </div>
      <div className='min-h-0 flex-1 space-y-1 overflow-y-auto pr-1'>
        {scenes.map((scene, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={scene.id}
              type='button'
              onClick={() => onSelect(index)}
              aria-pressed={active}
              className={cn(
                'group relative flex w-full items-start gap-2.5 px-2.5 py-2.5 text-left transition-colors',
                active ? 'bg-chalk/[0.07]' : 'hover:bg-chalk/[0.04]',
              )}
            >
              <span
                className={cn(
                  'absolute bottom-2 left-0 top-2 w-[2px] bg-ember transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'mt-0.5 font-mono text-[0.5rem] tracking-[0.1em]',
                  active ? 'text-ember/80' : 'text-chalk/25',
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    'block truncate text-xs leading-5',
                    active ? 'text-chalk' : 'text-chalk/55',
                  )}
                >
                  {scene.title}
                </span>
                <span className='mt-0.5 flex items-center gap-1.5 font-mono text-[0.46rem] uppercase tracking-[0.1em] text-chalk/25'>
                  <SceneTypeIcon
                    type={scene.type}
                    className='h-2.5 w-2.5'
                  />
                  {sceneTypeLabels[scene.type]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function MobileSceneRail({
  scenes,
  activeIndex,
  onSelect,
}: {
  scenes: ClassroomScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className='-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden'>
      {scenes.map((scene, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={scene.id}
            type='button'
            onClick={() => onSelect(index)}
            aria-pressed={active}
            className={cn(
              'flex shrink-0 items-center gap-2 border px-2.5 py-2 text-left transition-colors',
              active
                ? 'border-ember/45 bg-ember/[0.08] text-chalk'
                : 'border-chalk/10 text-chalk/45',
            )}
          >
            <span className='font-mono text-[0.48rem] text-chalk/30'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className='max-w-[8.5rem] truncate text-[0.7rem]'>
              {scene.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
