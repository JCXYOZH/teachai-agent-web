'use client';

import { ArrowUpRight, Database, FileText, HardDrive } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';

export function KnowledgeAside() {
  return (
    <aside className='space-y-4'>
      <div className='border border-ink/10 bg-paper/35 p-5'>
        <p className='eyebrow'>Retrieval / 检索</p>
        <p className='mt-3 text-sm leading-6 text-ink/55'>
          中文内容使用 PostgreSQL 关键词与模糊匹配
        </p>
        <div className='mt-5 flex flex-wrap gap-2'>
          <Badge>FULL TEXT</Badge>
          <Badge>ILIKE</Badge>
          <Badge>OWNER SCOPED</Badge>
        </div>
      </div>
      <div className='border border-ink/10 bg-paper/35 p-5'>
        <p className='eyebrow'>Storage / 存储</p>
        <ul className='mt-4 space-y-3 text-xs text-ink/45'>
          <li className='flex items-center gap-2.5'>
            <HardDrive className='h-3.5 w-3.5 text-ink/30' />
            资产本地磁盘进行保存
          </li>
          <li className='flex items-center gap-2.5'>
            <Database className='h-3.5 w-3.5 text-ink/30' />
            数据库保存元数据、归属与解析文本
          </li>
          <li className='flex items-center gap-2.5'>
            <FileText className='h-3.5 w-3.5 text-ink/30' />
            下载必须经过鉴权
          </li>
        </ul>
      </div>
      <Link href='/library' className='flex items-center justify-between border border-ink/10 px-5 py-4 text-xs text-ink/50 transition-colors hover:border-ink/25 hover:text-ink'>
        回到课程档案
        <ArrowUpRight className='h-3.5 w-3.5' />
      </Link>
    </aside>
  );
}
