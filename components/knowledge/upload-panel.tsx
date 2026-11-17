'use client';

import { Loader2, UploadCloud } from 'lucide-react';
import type { DragEvent, RefObject } from 'react';

import { ACCEPTED_UPLOAD_TYPES } from '@/lib/api/library';
import type { Course, Folder } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

export function UploadPanel({
  courses,
  folders,
  uploadCourse,
  uploadFolder,
  uploading,
  dragActive,
  fileInputRef,
  onCourseChange,
  onFolderChange,
  onDragActiveChange,
  onFiles,
  onDrop,
}: {
  courses: Course[];
  folders: Folder[];
  uploadCourse: string;
  uploadFolder: string;
  uploading: boolean;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onCourseChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  onDragActiveChange: (value: boolean) => void;
  onFiles: (incoming: FileList | File[]) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className='stage-grid relative overflow-hidden border border-ink/10 p-6 text-chalk shadow-stage sm:p-7'>
      <div className='pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full border border-sage/10' />
      <div className='relative flex items-center justify-between gap-4'>
        <div>
          <p className='font-mono text-[0.52rem] uppercase tracking-[0.2em] text-chalk/35'>Ingest / 01</p>
          <h3 className='mt-2 font-display text-xl text-chalk/85'>投递一份材料</h3>
        </div>
        <UploadCloud className='h-5 w-5 text-sage/55' strokeWidth={1.4} />
      </div>

      <div className='relative mt-5 grid grid-cols-2 gap-2'>
        <select
          value={uploadCourse}
          disabled={uploading}
          onChange={(event) => onCourseChange(event.target.value)}
          aria-label='关联课程'
          className='h-10 min-w-0 border border-chalk/15 bg-classroom/60 px-2.5 text-xs text-chalk/70 outline-none focus:border-sage/50'
        >
          <option value=''>不关联课程</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          value={uploadFolder}
          disabled={uploading}
          onChange={(event) => onFolderChange(event.target.value)}
          aria-label='文件夹'
          className='h-10 min-w-0 border border-chalk/15 bg-classroom/60 px-2.5 text-xs text-chalk/70 outline-none focus:border-sage/50'
        >
          <option value=''>未归档</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      <div
        role='button'
        tabIndex={0}
        onClick={() => {
          if (!uploading) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          onDragActiveChange(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) {
            onDragActiveChange(false);
          }
        }}
        onDrop={onDrop}
        className={cn(
          'relative mt-4 flex min-h-[10.5rem] cursor-pointer flex-col items-center justify-center border border-dashed px-5 text-center transition-colors',
          dragActive ? 'border-sage/70 bg-sage/[0.08]' : 'border-chalk/20 hover:border-sage/50 hover:bg-chalk/[0.03]',
          uploading && 'cursor-wait opacity-70',
        )}
      >
        {uploading ? (
          <Loader2 className='h-6 w-6 animate-spin text-sage' />
        ) : (
          <UploadCloud className='h-6 w-6 text-sage/65' strokeWidth={1.4} />
        )}
        <p className='mt-3 text-sm text-chalk/75'>
          {uploading ? '正在解析并写入书架…' : '拖入文件，或点击选择'}
        </p>
        <p className='mt-2 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-chalk/30'>
          PDF · DOCX · PPTX · MD · TXT
        </p>
      </div>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept={ACCEPTED_UPLOAD_TYPES}
        className='hidden'
        onChange={(event) => {
          if (event.target.files) {
            onFiles(event.target.files);
          }
        }}
      />
      <p className='relative mt-3 text-[0.65rem] leading-5 text-chalk/30'>
        上传即解析，单个文件上限 50 MB。文件写入本地磁盘，下载必须经过鉴权。
      </p>
    </div>
  );
}
