'use client';

import { Badge } from '@/components/ui/badge';

export function KnowledgeHero({
  total,
  folderCount,
  courseCount,
}: {
  total: number;
  folderCount: number;
  courseCount: number;
}) {
  return (
    <div className='paper-card relative overflow-hidden p-7 sm:p-9'>
      <div className='pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-sage/25' />
      <div className='relative flex h-full flex-col justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <p className='eyebrow'>Sources / 素材书架</p>
            <Badge tone='sage'>已接通</Badge>
          </div>
          <h2 className='mt-6 max-w-xl font-display text-display-md font-normal text-ink'>
            让材料先有个
            <span className='italic text-ember'>位置</span>。
          </h2>
          <p className='mt-4 max-w-xl text-sm leading-7 text-ink/50'>
            上传、解析、检索，再把引用带进课程。原文件进入本地受控目录，解析结果支持中文关键词检索与来源定位。
          </p>
        </div>
        <div className='mt-9 grid grid-cols-3 gap-3 border-t border-ink/10 pt-5'>
          <div>
            <p className='font-display text-2xl text-ink'>{total}</p>
            <p className='mt-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/30'>Materials</p>
          </div>
          <div>
            <p className='font-display text-2xl text-ink'>{folderCount}</p>
            <p className='mt-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/30'>Folders</p>
          </div>
          <div>
            <p className='font-display text-2xl text-ink'>{courseCount}</p>
            <p className='mt-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/30'>Courses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
