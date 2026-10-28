'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BookOpenText,
  FileStack,
  Folder as FolderIcon,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { CourseDialog, FolderDialog } from '@/components/library/library-dialogs';
import { StageCard } from '@/components/library/stage-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { deleteCourse, deleteFolder, listCourses, listFolders } from '@/lib/api/library';
import type { Course, Folder } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

const process = [
  {
    index: '01',
    title: '收集材料',
    description: 'PDF、DOCX、PPTX，或一段还没整理的 Markdown。',
  },
  {
    index: '02',
    title: '确认大纲',
    description: '先看结构，再让模型继续往下写。',
  },
  {
    index: '03',
    title: '走进课堂',
    description: '场景、讲解、互动与一次完整的预演。',
  },
];

const statusLabels: Record<Course['status'], string> = {
  draft: '草稿',
  ready: '已就绪',
  archived: '已归档',
};

type DeleteTarget = { kind: 'course'; course: Course } | { kind: 'folder'; folder: Folder };

function CourseCard({
  course,
  index,
  onEdit,
  onDelete,
}: {
  course: Course;
  index: number;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}) {
  return (
    <article className='paper-card group relative flex min-h-[15rem] flex-col overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-6'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
      <div className='flex items-start justify-between gap-4'>
        <span className='font-mono text-[0.52rem] tracking-[0.18em] text-ember/80'>
          {String(index + 1).padStart(2, '0')} / LESSON
        </span>
        <span className='border border-ink/10 bg-paper/60 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/40'>
          {statusLabels[course.status]}
        </span>
      </div>

      <h3 className='mt-6 font-display text-[1.45rem] font-medium leading-tight tracking-[-0.025em] text-ink'>
        {course.title}
      </h3>
      <p className='mt-3 line-clamp-3 text-sm leading-6 text-ink/45'>
        {course.description || '还没有写下课程说明，先保留一个清晰的问题。'}
      </p>

      <div className='mt-auto pt-6'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-ink/35'>
          <span>{course.folder_name ?? '未归档'}</span>
          <span className='h-1 w-1 rounded-full bg-ink/20' />
          <span>{course.asset_count} 份素材</span>
          <span className='h-1 w-1 rounded-full bg-ink/20' />
          <span>{formatDate(course.updated_at)}</span>
        </div>
        <div className='mt-4 flex items-center justify-between border-t border-ink/10 pt-3'>
          <Link
            href='/knowledge'
            className='inline-flex items-center gap-1.5 text-xs text-ink/45 transition-colors hover:text-ember'
          >
            素材书架
            <ArrowUpRight className='h-3.5 w-3.5' />
          </Link>
          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={() => onEdit(course)}
              className='flex h-8 w-8 items-center justify-center text-ink/35 transition-colors hover:bg-ink/[0.04] hover:text-ink'
              aria-label={`编辑 ${course.title}`}
            >
              <Pencil className='h-3.5 w-3.5' />
            </button>
            <button
              type='button'
              onClick={() => onDelete(course)}
              className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ember/[0.06] hover:text-ember'
              aria-label={`删除 ${course.title}`}
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 260);
  const [folderDialog, setFolderDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; folder: Folder } | null
  >(null);
  const [courseDialog, setCourseDialog] = useState<{ course: Course | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const foldersQuery = useQuery({ queryKey: ['folders'], queryFn: listFolders });
  const coursesQuery = useQuery({
    queryKey: ['courses', selectedFolder, debouncedSearch],
    queryFn: () =>
      listCourses({
        folderId: selectedFolder === 'all' ? undefined : selectedFolder,
        q: debouncedSearch || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) {
        return;
      }
      if (deleteTarget.kind === 'course') {
        await deleteCourse(deleteTarget.course.id);
      } else {
        await deleteFolder(deleteTarget.folder.id);
      }
    },
    onSuccess: async () => {
      const deletedFolder = deleteTarget?.kind === 'folder';
      if (deletedFolder && selectedFolder !== 'all') {
        setSelectedFolder('all');
      }
      setDeleteTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
      ]);
      toast.success(deletedFolder ? '文件夹已删除，内容已回到未归档区' : '课程已删除');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : '删除失败，请稍后重试');
    },
  });

  const folders = foldersQuery.data ?? [];
  const courses = coursesQuery.data?.items ?? [];
  const selectedFolderRecord = folders.find((folder) => folder.id === selectedFolder);
  const totalCourses = coursesQuery.data?.total ?? 0;

  return (
    <div className='space-y-9'>
      <section className='grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]'>
        <div className='paper-card relative overflow-hidden p-7 sm:p-9 xl:p-10'>
          <div className='pointer-events-none absolute inset-0 bg-paper-grid bg-grid-32 opacity-30' />
          <div className='pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-ember/10' />

          <div className='relative flex items-center justify-between gap-4'>
            <p className='eyebrow'>From first thought to first room</p>
            <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
              {totalCourses} courses
            </span>
          </div>

          <div className='relative mt-10 max-w-2xl'>
            <h2 className='font-display text-display-lg font-normal text-ink'>
              今天，想把哪一节课
              <br />
              讲得
              <span className='italic text-ember'>更好？</span>
            </h2>
            <p className='mt-6 max-w-xl text-sm leading-7 text-ink/55 sm:text-[0.95rem]'>
              先放下一份资料，或者只写下那个还没想清楚的问题。TeachAI 会把它整理成大纲、场景，和一场可以提前走进去的课堂。
            </p>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link href='/create' className={buttonVariants({ variant: 'ember', size: 'lg' })}>
                <Plus className='h-4 w-4' />
                准备新课程
              </Link>
              <Link href='/knowledge' className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <BookOpenText className='h-4 w-4' />
                整理素材
              </Link>
            </div>

            <p className='margin-note mt-10 max-w-sm'>
              备课不是把一页写满，而是先找到值得被问出来的那个问题。
            </p>
          </div>

          <div className='relative mt-9 flex items-center justify-between border-t border-ink/10 pt-4 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
            <span>TeachAI / Lesson studio</span>
            <span>Qwen · llama.cpp</span>
          </div>
        </div>

        <StageCard />
      </section>

      <section>
        <div className='flex flex-col justify-between gap-5 border-b border-ink/10 pb-5 lg:flex-row lg:items-end'>
          <div>
            <p className='eyebrow'>Courses / 最近课程</p>
            <div className='mt-2 flex items-center gap-3'>
              <h2 className='font-display text-2xl font-medium tracking-[-0.03em] text-ink'>书架</h2>
              <span className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink/30'>
                All / {String(totalCourses).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex h-10 min-w-[15rem] flex-1 items-center gap-2 border border-ink/15 bg-paper/55 px-3 lg:w-64 lg:flex-none'>
              <Search className='h-3.5 w-3.5 text-ink/30' />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='搜索课程标题或说明'
                className='min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink/25'
              />
            </div>
            <Button variant='primary' size='sm' onClick={() => setCourseDialog({ course: null })}>
              <Plus className='h-3.5 w-3.5' />
              新建课程
            </Button>
          </div>
        </div>

        <div className='mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <button
              type='button'
              onClick={() => setSelectedFolder('all')}
              className={cn(
                'flex shrink-0 items-center gap-2 border px-3 py-2 text-xs transition-colors',
                selectedFolder === 'all'
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 bg-paper/40 text-ink/50 hover:border-ink/30 hover:text-ink',
              )}
            >
              全部课程
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type='button'
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 border px-3 py-2 text-xs transition-colors',
                  selectedFolder === folder.id
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-paper/40 text-ink/50 hover:border-ink/30 hover:text-ink',
                )}
              >
                <FolderIcon className='h-3.5 w-3.5' strokeWidth={1.5} />
                {folder.name}
                <span className='font-mono text-[0.52rem] opacity-55'>{folder.course_count}</span>
              </button>
            ))}
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            {selectedFolderRecord ? (
              <>
                <button
                  type='button'
                  onClick={() => setFolderDialog({ mode: 'edit', folder: selectedFolderRecord })}
                  className='flex items-center gap-1.5 px-2 py-1.5 text-xs text-ink/40 transition-colors hover:text-ink'
                >
                  <Pencil className='h-3.5 w-3.5' />
                  重命名
                </button>
                <button
                  type='button'
                  onClick={() => setDeleteTarget({ kind: 'folder', folder: selectedFolderRecord })}
                  className='flex items-center gap-1.5 px-2 py-1.5 text-xs text-ink/40 transition-colors hover:text-ember'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                  删除
                </button>
              </>
            ) : null}
            <Button variant='ghost' size='sm' onClick={() => setFolderDialog({ mode: 'create' })}>
              <FolderPlus className='h-3.5 w-3.5' />
              新建文件夹
            </Button>
          </div>
        </div>

        {coursesQuery.isError ? (
          <div className='mt-5 border border-dashed border-ember/30 bg-ember/[0.04] px-5 py-8 text-center'>
            <p className='text-sm text-ink/55'>课程加载失败，请检查后端服务后重试。</p>
            <Button variant='outline' size='sm' className='mt-4' onClick={() => coursesQuery.refetch()}>
              重新加载
            </Button>
          </div>
        ) : coursesQuery.isLoading ? (
          <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {[0, 1, 2].map((item) => (
              <div key={item} className='h-60 animate-pulse border border-ink/10 bg-paper/35' />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onEdit={(item) => setCourseDialog({ course: item })}
                onDelete={(item) => setDeleteTarget({ kind: 'course', course: item })}
              />
            ))}
          </div>
        ) : (
          <div className='mt-5 border border-dashed border-ink/15 px-5 py-8 sm:px-8 sm:py-9'>
            <div className='grid items-center gap-6 md:grid-cols-[auto_1fr_auto]'>
              <div className='relative h-16 w-20' aria-hidden='true'>
                <span className='absolute left-0 top-3 h-12 w-16 rotate-[-4deg] border border-ink/15 bg-paper/50' />
                <span className='absolute left-2 top-1 h-12 w-16 rotate-[2deg] border border-ink/20 bg-paper-deep/40' />
                <FileStack className='absolute bottom-0 right-1 h-6 w-6 text-ink/35' strokeWidth={1.4} />
              </div>
              <div>
                <h3 className='font-display text-xl font-medium text-ink'>
                  {debouncedSearch ? '没有找到匹配课程' : '书架还是空的'}
                </h3>
                <p className='mt-2 max-w-xl text-sm leading-6 text-ink/45'>
                  {debouncedSearch
                    ? '换一个关键词，或在素材书架中搜索讲义内容。'
                    : '先从一段文本、一个问题，或一份现成讲义开始。第一门课程会出现在这里。'}
                </p>
              </div>
              <Link
                href='/create'
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'justify-between md:justify-center')}
              >
                准备第一门课程
                <ArrowUpRight className='h-3.5 w-3.5' />
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className='border-y border-ink/10 py-8'>
        <div className='rule-label'>From source to classroom / 从材料到课堂</div>
        <div className='mt-6 grid gap-6 md:grid-cols-3'>
          {process.map((item) => (
            <div key={item.index} className='relative md:border-l md:border-ink/10 md:pl-5'>
              <span className='font-mono text-[0.54rem] tracking-[0.16em] text-ember'>{item.index}</span>
              <h3 className='mt-3 font-display text-xl text-ink'>{item.title}</h3>
              <p className='mt-2 max-w-xs text-xs leading-6 text-ink/40'>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <FolderDialog
        open={folderDialog !== null}
        folder={folderDialog?.mode === 'edit' ? folderDialog.folder : null}
        onClose={() => setFolderDialog(null)}
      />
      <CourseDialog
        open={courseDialog !== null}
        folders={folders}
        course={courseDialog?.course ?? null}
        onClose={() => setCourseDialog(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.kind === 'folder' ? '删除这个文件夹？' : '删除这门课程？'}
        description={
          deleteTarget?.kind === 'folder'
            ? '文件夹中的课程与素材会回到未归档区，不会被删除。'
            : '课程会从书架移除，关联素材会保留在素材书架中。'
        }
        confirmLabel={deleteTarget?.kind === 'folder' ? '删除文件夹' : '删除课程'}
        pending={deleteMutation.isLoading}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
