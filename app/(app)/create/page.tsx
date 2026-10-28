'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleDashed,
  FileText,
  FolderPlus,
  LayoutList,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import { createCourse, listFolders } from '@/lib/api/library';
import type { Course } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const nextSteps = [
  { icon: FileText, title: '放进素材', copy: '从讲义、PDF 或一段手动输入开始。' },
  { icon: LayoutList, title: '确认大纲', copy: '先看结构，再决定让模型写到哪里。' },
  { icon: Sparkles, title: '预演课堂', copy: '场景、讲解、互动与声音一次成型。' },
];

export default function CreatePage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);
  const foldersQuery = useQuery({ queryKey: ['folders'], queryFn: listFolders });

  const createMutation = useMutation({
    mutationFn: () =>
      createCourse({
        title: title.trim(),
        description: description.trim() || null,
        folder_id: folderId || null,
      }),
    onSuccess: async (course) => {
      setCreatedCourse(course);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
      ]);
      toast.success('课程草稿已创建');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : '课程创建失败，请稍后重试');
    },
  });

  return (
    <div className='mx-auto max-w-5xl'>
      <section className='grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.72fr)]'>
        <div className='paper-card relative overflow-hidden p-7 sm:p-9'>
          <div className='pointer-events-none absolute inset-0 notebook-rule opacity-30' />
          <div className='relative'>
            <div className='flex items-center justify-between gap-4'>
              <p className='eyebrow'>New lesson / 课程草稿</p>
              <Badge tone='ember'>Phase 2</Badge>
            </div>

            {createdCourse ? (
              <div className='mt-10'>
                <span className='flex h-12 w-12 items-center justify-center border border-sage/60 bg-sage/15 text-ink/65'>
                  <Check className='h-5 w-5' />
                </span>
                <h2 className='mt-7 max-w-lg font-display text-display-md font-normal text-ink'>
                  草稿已经
                  <span className='italic text-ember'>落座</span>。
                </h2>
                <p className='mt-4 max-w-xl text-sm leading-7 text-ink/50'>
                  《{createdCourse.title}》已经进入课程书架。现在可以上传第一份讲义，或继续整理其他课程。
                </p>
                <div className='mt-8 flex flex-wrap gap-3'>
                  <Link href='/knowledge' className={buttonVariants({ variant: 'ember', size: 'lg' })}>
                    <FileText className='h-4 w-4' />
                    上传课程素材
                  </Link>
                  <Link href='/library' className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                    回到课程档案
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setCreatedCourse(null);
                    setTitle('');
                    setDescription('');
                    setFolderId('');
                  }}
                  className='mt-7 text-xs text-ink/35 underline-offset-4 hover:text-ink hover:underline'
                >
                  再准备一门课程
                </button>
              </div>
            ) : (
              <>
                <h2 className='mt-9 max-w-lg font-display text-display-md font-normal text-ink'>
                  从一句话开始，
                  <br />
                  把课<span className='italic text-ember'>写出来</span>。
                </h2>
                <p className='mt-4 max-w-xl text-sm leading-7 text-ink/50'>
                  先说明要讲什么，再用文件夹把课程归位。创建后的草稿会立即进入课程书架，下一步再补素材与大纲。
                </p>

                <form
                  className='mt-9 space-y-6 border-t border-ink/15 pt-6'
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (title.trim()) {
                      createMutation.mutate();
                    }
                  }}
                >
                  <div>
                    <label htmlFor='create-title' className='flex items-center gap-2 text-xs text-ink/65'>
                      <span className='font-mono text-[0.5rem] text-ember/80'>01</span>
                      你想讲什么？
                    </label>
                    <Input
                      id='create-title'
                      value={title}
                      maxLength={200}
                      autoFocus
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder='例如：导数的几何意义'
                      className='mt-2 text-lg'
                    />
                  </div>
                  <div>
                    <label htmlFor='create-description' className='flex items-center gap-2 text-xs text-ink/65'>
                      <span className='font-mono text-[0.5rem] text-ember/80'>02</span>
                      这节课要解决什么？
                    </label>
                    <textarea
                      id='create-description'
                      value={description}
                      maxLength={2000}
                      rows={4}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder='学生已有基础、最想澄清的误区，或这堂课的核心问题。'
                      className='mt-3 w-full resize-none border-b border-ink/20 bg-transparent py-2 text-sm leading-6 text-ink placeholder:text-ink/25 focus:border-ember focus:outline-none'
                    />
                  </div>
                  <div>
                    <label htmlFor='create-folder' className='flex items-center gap-2 text-xs text-ink/65'>
                      <span className='font-mono text-[0.5rem] text-ember/80'>03</span>
                      放进哪个文件夹？
                    </label>
                    <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
                      <select
                        id='create-folder'
                        value={folderId}
                        onChange={(event) => setFolderId(event.target.value)}
                        className='h-11 flex-1 border border-ink/15 bg-paper/50 px-3 text-sm text-ink focus:border-ember focus:outline-none'
                      >
                        <option value=''>未归档</option>
                        {(foldersQuery.data ?? []).map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                      <Link
                        href='/library'
                        className='inline-flex h-11 items-center justify-center gap-2 border border-ink/15 px-4 text-xs text-ink/50 transition-colors hover:border-ink/30 hover:text-ink'
                      >
                        <FolderPlus className='h-3.5 w-3.5' />
                        管理文件夹
                      </Link>
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center gap-3 pt-1'>
                    <Button
                      type='submit'
                      variant='ember'
                      size='lg'
                      disabled={!title.trim() || createMutation.isLoading}
                    >
                      {createMutation.isLoading ? '正在创建…' : '创建课程草稿'}
                      <ArrowUpRight className='h-4 w-4' />
                    </Button>
                    <span className='text-xs text-ink/35'>素材与大纲在下一步继续</span>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <aside className='flex flex-col justify-between border border-ink/10 bg-paper/35 p-6 sm:p-7'>
          <div>
            <div className='flex items-center justify-between'>
              <p className='eyebrow'>After that / 接下来</p>
              <CircleDashed className='h-4 w-4 text-ink/25' strokeWidth={1.4} />
            </div>
            <div className='mt-7 space-y-7'>
              {nextSteps.map(({ icon: Icon, title: stepTitle, copy }, index) => (
                <div key={stepTitle} className='grid grid-cols-[auto_1fr] gap-4'>
                  <div className='flex flex-col items-center'>
                    <span className='flex h-9 w-9 items-center justify-center border border-ink/15 bg-paper/70 text-ink/50'>
                      <Icon className='h-4 w-4' strokeWidth={1.5} />
                    </span>
                    {index < nextSteps.length - 1 && <span className='mt-2 h-8 w-px bg-ink/10' />}
                  </div>
                  <div className='pt-1'>
                    <p className='text-sm text-ink/70'>{stepTitle}</p>
                    <p className='mt-1.5 text-xs leading-5 text-ink/35'>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-8 border-l border-ember/50 pl-4'>
            <p className='font-display text-base italic leading-6 text-ink/50'>
              “结构先于句子。先决定学生要经过什么，再决定你要说什么。”
            </p>
          </div>
        </aside>
      </section>

      <div className='mt-6 flex flex-col justify-between gap-4 border border-dashed border-ink/15 px-5 py-4 text-xs text-ink/45 sm:flex-row sm:items-center'>
        <p>阶段 2 已接通课程草稿、文件夹、素材管理与中文检索。</p>
        <Link href='/library' className={cn('inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink/50 hover:text-ember')}>
          <ArrowLeft className='h-3.5 w-3.5' />
          回到课程档案
        </Link>
      </div>
    </div>
  );
}
