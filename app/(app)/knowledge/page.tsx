import {
  ArrowUpRight,
  BookOpen,
  FileText,
  FileType2,
  Presentation,
  Search,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const shelves = [
  { label: 'PDF', detail: '讲义 / 论文', icon: FileText },
  { label: 'DOCX', detail: '教案 / 文档', icon: FileType2 },
  { label: 'PPTX', detail: '课件 / 演示', icon: Presentation },
  { label: 'MD', detail: '笔记 / 草稿', icon: BookOpen },
  { label: 'TXT', detail: '纯文本', icon: FileText },
];

export default function KnowledgePage() {
  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <section className='paper-card relative overflow-hidden p-7 sm:p-9'>
        <div className='pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-sage/25' />
        <div className='relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end'>
          <div>
            <div className='flex items-center gap-3'>
              <p className='eyebrow'>Sources / 素材书架</p>
              <Badge tone='ember'>Phase 2</Badge>
            </div>
            <h2 className='mt-6 max-w-xl font-display text-display-md font-normal text-ink'>
              让材料先有个
              <span className='italic text-ember'>位置</span>。
            </h2>
            <p className='mt-4 max-w-xl text-sm leading-7 text-ink/50'>
              上传、解析、检索，再把引用带进课程。阶段 2 会先接通文件上传与中文关键词检索，不让素材散落在桌面上。
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            <span className={cn(buttonVariants({ variant: 'ember', size: 'lg' }), 'cursor-not-allowed opacity-45')}>
              <UploadCloud className='h-4 w-4' />
              上传素材
            </span>
            <span className='text-xs text-ink/35'>即将开放</span>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='border border-ink/10 bg-paper/30'>
          <div className='flex items-center gap-3 border-b border-ink/10 px-5 py-4'>
            <Search className='h-4 w-4 text-ink/30' />
            <span className='flex-1 text-sm text-ink/25'>搜索讲义、知识点或一句课堂笔记…</span>
            <span className='font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/20'>⌘ K</span>
          </div>
          <div className='p-5 sm:p-6'>
            <div className='flex items-center justify-between'>
              <p className='rule-label flex-1'>All formats / 全部格式</p>
              <span className='ml-4 font-mono text-[0.48rem] text-ink/25'>00 items</span>
            </div>
            <div className='mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
              {shelves.map(({ label, detail, icon: Icon }) => (
                <div
                  key={label}
                  className='group relative flex min-h-[8.5rem] flex-col justify-between border border-ink/10 bg-paper/55 p-4 transition-colors hover:border-ember/30 hover:bg-paper/80'
                >
                  <div className='flex items-start justify-between'>
                    <Icon className='h-5 w-5 text-ink/35' strokeWidth={1.4} />
                    <ArrowUpRight className='h-3.5 w-3.5 text-ink/15 transition-colors group-hover:text-ember/60' />
                  </div>
                  <div>
                    <p className='font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink/65'>{label}</p>
                    <p className='mt-1 text-[0.65rem] text-ink/30'>{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className='notebook-rule mt-6 flex min-h-[12rem] flex-col items-center justify-center border-t border-ink/10 px-5 text-center'>
              <p className='font-display text-xl text-ink/55'>第一份材料，会放在这里</p>
              <p className='mt-2 max-w-sm text-xs leading-6 text-ink/35'>
                上传后会自动提取文本与页码。原文件与解析结果存放在服务端受控目录，课程引用会保留来源位置。
              </p>
            </div>
          </div>
        </div>

        <aside className='space-y-4'>
          <div className='border border-ink/10 bg-paper/35 p-5'>
            <p className='eyebrow'>Retrieval / 检索</p>
            <p className='mt-3 text-sm leading-6 text-ink/55'>
              中文内容先用关键词与模糊匹配，不额外依赖向量扩展。后续可替换为混合检索。
            </p>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Badge>FULL TEXT</Badge>
              <Badge>FUZZY</Badge>
              <Badge>OWNER SCOPED</Badge>
            </div>
          </div>
          <div className='border border-ink/10 bg-paper/35 p-5'>
            <p className='eyebrow'>In this phase</p>
            <ul className='mt-4 space-y-3 text-xs text-ink/45'>
              <li className='flex gap-2.5'><span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ember' />文件上传与解析</li>
              <li className='flex gap-2.5'><span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ember' />中文关键词检索</li>
              <li className='flex gap-2.5'><span className='mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ember' />课程引用与来源定位</li>
            </ul>
          </div>
          <Link href='/library' className='flex items-center justify-between border border-ink/10 px-5 py-4 text-xs text-ink/50 transition-colors hover:border-ink/25 hover:text-ink'>
            回到课程档案
            <ArrowUpRight className='h-3.5 w-3.5' />
          </Link>
        </aside>
      </section>
    </div>
  );
}
