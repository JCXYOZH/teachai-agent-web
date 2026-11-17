'use client';

import { Folder as FolderIcon, Search } from 'lucide-react';

import type { Course, Folder } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

export function AssetFilters({
  search,
  selectedCourse,
  selectedFolder,
  courses,
  folders,
  onSearchChange,
  onCourseChange,
  onFolderChange,
}: {
  search: string;
  selectedCourse: string;
  selectedFolder: string;
  courses: Course[];
  folders: Folder[];
  onSearchChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onFolderChange: (value: string) => void;
}) {
  return (
    <div className='border-b border-ink/10 p-4 sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='flex h-11 flex-1 items-center gap-2 border border-ink/15 bg-paper/55 px-3'>
          <Search className='h-4 w-4 text-ink/30' />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder='搜索文件名、讲义内容或一句课堂笔记…'
            className='min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/25'
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(event) => onCourseChange(event.target.value)}
          className='h-11 border border-ink/15 bg-paper/55 px-3 text-xs text-ink/60 outline-none focus:border-ember'
          aria-label='按课程筛选素材'
        >
          <option value='all'>全部课程</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className='mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        <button
          type='button'
          onClick={() => onFolderChange('all')}
          className={cn(
            'shrink-0 border px-2.5 py-1.5 text-[0.68rem] transition-colors',
            selectedFolder === 'all'
              ? 'border-ink bg-ink text-paper'
              : 'border-ink/15 text-ink/45 hover:border-ink/30 hover:text-ink',
          )}
        >
          全部文件夹
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type='button'
            onClick={() => onFolderChange(folder.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[0.68rem] transition-colors',
              selectedFolder === folder.id
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/15 text-ink/45 hover:border-ink/30 hover:text-ink',
            )}
          >
            <FolderIcon className='h-3 w-3' strokeWidth={1.5} />
            {folder.name}
            <span className='font-mono text-[0.48rem] opacity-55'>{folder.asset_count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
