'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import {
  createCourse,
  createFolder,
  updateAsset,
  updateCourse,
  updateFolder,
} from '@/lib/api/library';
import type { Asset, Course, Folder } from '@/lib/api/types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function fieldClassName(): string {
  return 'h-11 w-full rounded-none border border-ink/15 bg-paper/50 px-3 font-sans text-sm text-ink focus:border-ember focus:outline-none';
}

interface FolderDialogProps {
  open: boolean;
  folder?: Folder | null;
  onClose: () => void;
}

export function FolderDialog({ open, folder, onClose }: FolderDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(folder?.name ?? '');
      setError(null);
    }
  }, [folder, open]);

  const mutation = useMutation({
    mutationFn: () => (folder ? updateFolder(folder.id, name.trim()) : createFolder(name.trim())),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
      ]);
      toast.success(folder ? '文件夹已重命名' : '文件夹已创建');
      onClose();
    },
    onError: (mutationError) => {
      setError(errorMessage(mutationError, '文件夹保存失败'));
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={folder ? '重命名文件夹' : '新建文件夹'}
      description='文件夹用于整理课程与素材；删除文件夹时，内容会回到未归档区。'
      footer={
        <>
          <Button variant='outline' onClick={onClose} disabled={mutation.isLoading}>
            取消
          </Button>
          <Button type='submit' form='folder-form' disabled={!name.trim() || mutation.isLoading}>
            {mutation.isLoading ? '保存中…' : '保存'}
          </Button>
        </>
      }
    >
      <form
        id='folder-form'
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) {
            mutation.mutate();
          }
        }}
      >
        <label htmlFor='folder-name' className='text-xs text-ink/60'>
          文件夹名称
        </label>
        <Input
          id='folder-name'
          autoFocus
          value={name}
          maxLength={120}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder='例如：高一数学 / 函数单元'
          className='mt-2'
        />
        {error ? <p className='mt-3 text-xs text-ember'>{error}</p> : null}
      </form>
    </Dialog>
  );
}

interface CourseDialogProps {
  open: boolean;
  folders: Folder[];
  course?: Course | null;
  onClose: () => void;
}

export function CourseDialog({ open, folders, course, onClose }: CourseDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(course?.title ?? '');
      setDescription(course?.description ?? '');
      setFolderId(course?.folder_id ?? '');
      setError(null);
    }
  }, [course, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        folder_id: folderId || null,
      };
      return course ? updateCourse(course.id, payload) : createCourse(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
      ]);
      toast.success(course ? '课程信息已更新' : '课程草稿已创建');
      onClose();
    },
    onError: (mutationError) => {
      setError(errorMessage(mutationError, '课程保存失败'));
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={course ? '编辑课程' : '新建课程'}
      description='先给课程一个清晰的名字与边界，素材和大纲会在后续步骤继续补充。'
      footer={
        <>
          <Button variant='outline' onClick={onClose} disabled={mutation.isLoading}>
            取消
          </Button>
          <Button type='submit' form='course-form' disabled={!title.trim() || mutation.isLoading}>
            {mutation.isLoading ? '保存中…' : course ? '保存修改' : '创建草稿'}
          </Button>
        </>
      }
    >
      <form
        id='course-form'
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) {
            mutation.mutate();
          }
        }}
      >
        <div>
          <label htmlFor='course-title' className='text-xs text-ink/60'>
            课程名称
          </label>
          <Input
            id='course-title'
            autoFocus
            value={title}
            maxLength={200}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            placeholder='例如：导数的几何意义'
            className='mt-2'
          />
        </div>
        <div>
          <label htmlFor='course-description' className='text-xs text-ink/60'>
            一句话说明 <span className='text-ink/30'>（可选）</span>
          </label>
          <textarea
            id='course-description'
            value={description}
            maxLength={2000}
            rows={4}
            onChange={(event) => setDescription(event.target.value)}
            placeholder='学生需要先知道什么？这节课最想解决哪一个问题？'
            className='mt-2 w-full resize-none border border-ink/15 bg-paper/50 px-3 py-3 text-sm leading-6 text-ink placeholder:text-ink/25 focus:border-ember focus:outline-none'
          />
        </div>
        <div>
          <label htmlFor='course-folder' className='text-xs text-ink/60'>
            放入文件夹
          </label>
          <select
            id='course-folder'
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
            className={`${fieldClassName()} mt-2`}
          >
            <option value=''>未归档</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className='text-xs text-ember'>{error}</p> : null}
      </form>
    </Dialog>
  );
}

interface AssetEditDialogProps {
  open: boolean;
  asset: Asset | null;
  folders: Folder[];
  courses: Course[];
  onClose: () => void;
}

export function AssetEditDialog({
  open,
  asset,
  folders,
  courses,
  onClose,
}: AssetEditDialogProps) {
  const queryClient = useQueryClient();
  const [filename, setFilename] = useState('');
  const [folderId, setFolderId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && asset) {
      setFilename(asset.filename);
      setFolderId(asset.folder_id ?? '');
      setCourseId(asset.course_id ?? '');
      setError(null);
    }
  }, [asset, open]);

  const mutation = useMutation({
    mutationFn: () =>
      updateAsset(asset?.id ?? '', {
        filename: filename.trim(),
        folder_id: folderId || null,
        course_id: courseId || null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['asset'] }),
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);
      toast.success('素材信息已更新');
      onClose();
    },
    onError: (mutationError) => {
      setError(errorMessage(mutationError, '素材保存失败'));
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title='整理素材'
      description='文件名用于展示；原文件扩展名保持不变。'
      footer={
        <>
          <Button variant='outline' onClick={onClose} disabled={mutation.isLoading}>
            取消
          </Button>
          <Button
            type='submit'
            form='asset-edit-form'
            disabled={!filename.trim() || mutation.isLoading}
          >
            {mutation.isLoading ? '保存中…' : '保存修改'}
          </Button>
        </>
      }
    >
      <form
        id='asset-edit-form'
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault();
          if (filename.trim()) {
            mutation.mutate();
          }
        }}
      >
        <div>
          <label htmlFor='asset-filename' className='text-xs text-ink/60'>
            文件名
          </label>
          <Input
            id='asset-filename'
            autoFocus
            value={filename}
            maxLength={255}
            onChange={(event) => {
              setFilename(event.target.value);
              setError(null);
            }}
            className='mt-2'
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label htmlFor='asset-folder' className='text-xs text-ink/60'>
              文件夹
            </label>
            <select
              id='asset-folder'
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              className={`${fieldClassName()} mt-2`}
            >
              <option value=''>未归档</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor='asset-course' className='text-xs text-ink/60'>
              关联课程
            </label>
            <select
              id='asset-course'
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className={`${fieldClassName()} mt-2`}
            >
              <option value=''>不关联</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? <p className='text-xs text-ember'>{error}</p> : null}
      </form>
    </Dialog>
  );
}
