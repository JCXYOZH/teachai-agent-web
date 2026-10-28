'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BookOpen,
  Database,
  Download,
  Eye,
  FileText,
  FileType2,
  Folder as FolderIcon,
  HardDrive,
  Loader2,
  Pencil,
  Presentation,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import { AssetEditDialog } from '@/components/library/library-dialogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api/client';
import {
  ACCEPTED_UPLOAD_TYPES,
  deleteAsset,
  downloadAsset,
  getAsset,
  listAssets,
  listCourses,
  listFolders,
  uploadAsset,
} from '@/lib/api/library';
import type { Asset } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { cn } from '@/lib/utils/cn';
import {
  assetStatusLabel,
  formatBytes,
  formatDate,
  formatFileKind,
} from '@/lib/utils/format';

const supportedExtensions = new Set(['pdf', 'docx', 'pptx', 'md', 'markdown', 'txt']);

function isSupportedFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return supportedExtensions.has(extension);
}

function fileIcon(extension: string) {
  if (extension === '.pptx') {
    return Presentation;
  }
  if (extension === '.docx') {
    return FileType2;
  }
  if (extension === '.md' || extension === '.markdown') {
    return BookOpen;
  }
  return FileText;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function KnowledgeWorkspace() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 280);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const foldersQuery = useQuery({ queryKey: ['folders'], queryFn: listFolders });
  const coursesQuery = useQuery({
    queryKey: ['courses', 'all-for-library'],
    queryFn: () => listCourses({ limit: 100 }),
  });
  const assetsQuery = useQuery({
    queryKey: ['assets', debouncedSearch, selectedFolder, selectedCourse],
    queryFn: () =>
      listAssets({
        q: debouncedSearch || undefined,
        folderId: selectedFolder === 'all' ? undefined : selectedFolder,
        courseId: selectedCourse === 'all' ? undefined : selectedCourse,
        limit: 100,
      }),
  });
  const detailQuery = useQuery({
    queryKey: ['asset', previewAssetId],
    queryFn: () => getAsset(previewAssetId as string),
    enabled: previewAssetId !== null,
  });

  const invalidateLibrary = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['assets'] }),
      queryClient.invalidateQueries({ queryKey: ['asset'] }),
      queryClient.invalidateQueries({ queryKey: ['folders'] }),
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        await uploadAsset(file, uploadCourse || undefined, uploadFolder || undefined);
      }
      return files.length;
    },
    onSuccess: async (count) => {
      await invalidateLibrary();
      toast.success(`${count} 份素材已解析并加入书架`);
    },
    onError: async (error) => {
      await invalidateLibrary();
      toast.error(errorMessage(error, '素材上传失败，请检查文件后重试'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (asset: Asset) => deleteAsset(asset.id),
    onSuccess: async () => {
      setDeleteTarget(null);
      if (previewAssetId === deleteTarget?.id) {
        setPreviewAssetId(null);
      }
      await invalidateLibrary();
      toast.success('素材已从书架移除');
    },
    onError: (error) => {
      toast.error(errorMessage(error, '删除失败，请稍后重试'));
    },
  });

  const handleFiles = (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    const supported = files.filter(isSupportedFile);
    if (supported.length !== files.length) {
      toast.error('仅支持 PDF、DOCX、PPTX、Markdown 与 TXT');
    }
    if (supported.length > 0) {
      uploadMutation.mutate(supported);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!uploadMutation.isLoading && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      await downloadAsset(asset);
    } catch (error) {
      toast.error(errorMessage(error, '下载失败，请稍后重试'));
    }
  };

  const folders = foldersQuery.data ?? [];
  const courses = coursesQuery.data?.items ?? [];
  const assets = assetsQuery.data?.items ?? [];
  const total = assetsQuery.data?.total ?? 0;

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <section className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]'>
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
                <p className='font-display text-2xl text-ink'>{folders.length}</p>
                <p className='mt-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/30'>Folders</p>
              </div>
              <div>
                <p className='font-display text-2xl text-ink'>{courses.length}</p>
                <p className='mt-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/30'>Courses</p>
              </div>
            </div>
          </div>
        </div>

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
              disabled={uploadMutation.isLoading}
              onChange={(event) => setUploadCourse(event.target.value)}
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
              disabled={uploadMutation.isLoading}
              onChange={(event) => setUploadFolder(event.target.value)}
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
              if (!uploadMutation.isLoading) {
                fileInputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !uploadMutation.isLoading) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) {
                setDragActive(false);
              }
            }}
            onDrop={handleDrop}
            className={cn(
              'relative mt-4 flex min-h-[10.5rem] cursor-pointer flex-col items-center justify-center border border-dashed px-5 text-center transition-colors',
              dragActive ? 'border-sage/70 bg-sage/[0.08]' : 'border-chalk/20 hover:border-sage/50 hover:bg-chalk/[0.03]',
              uploadMutation.isLoading && 'cursor-wait opacity-70',
            )}
          >
            {uploadMutation.isLoading ? (
              <Loader2 className='h-6 w-6 animate-spin text-sage' />
            ) : (
              <UploadCloud className='h-6 w-6 text-sage/65' strokeWidth={1.4} />
            )}
            <p className='mt-3 text-sm text-chalk/75'>
              {uploadMutation.isLoading ? '正在解析并写入书架…' : '拖入文件，或点击选择'}
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
                handleFiles(event.target.files);
              }
            }}
          />
          <p className='relative mt-3 text-[0.65rem] leading-5 text-chalk/30'>
            上传即解析，单个文件上限 50 MB。文件写入本地磁盘，下载必须经过鉴权。
          </p>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='border border-ink/10 bg-paper/30'>
          <div className='border-b border-ink/10 p-4 sm:p-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <div className='flex h-11 flex-1 items-center gap-2 border border-ink/15 bg-paper/55 px-3'>
                <Search className='h-4 w-4 text-ink/30' />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder='搜索文件名、讲义内容或一句课堂笔记…'
                  className='min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/25'
                />
              </div>
              <select
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
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
                onClick={() => setSelectedFolder('all')}
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
                  onClick={() => setSelectedFolder(folder.id)}
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

          <div className='flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5'>
            <p className='rule-label flex-1'>
              {debouncedSearch ? 'Search results / 检索结果' : 'All sources / 全部素材'}
            </p>
            <span className='ml-4 font-mono text-[0.48rem] uppercase tracking-[0.12em] text-ink/25'>
              {String(total).padStart(2, '0')} items
            </span>
          </div>

          {assetsQuery.isError ? (
            <div className='px-5 py-10 text-center'>
              <p className='text-sm text-ink/50'>素材加载失败，请检查后端服务。</p>
              <Button variant='outline' size='sm' className='mt-4' onClick={() => assetsQuery.refetch()}>
                重新加载
              </Button>
            </div>
          ) : assetsQuery.isLoading ? (
            <div className='space-y-px p-4 sm:p-5'>
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className='h-20 animate-pulse border border-ink/5 bg-paper/55' />
              ))}
            </div>
          ) : assets.length > 0 ? (
            <div>
              <div className='hidden grid-cols-[minmax(0,1fr)_7rem_8rem_7.5rem] gap-4 border-b border-ink/10 px-5 py-3 font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25 md:grid'>
                <span>Name</span>
                <span>Status</span>
                <span>Filed / 归位</span>
                <span className='text-right'>Actions</span>
              </div>
              <div className='divide-y divide-ink/10'>
                {assets.map((asset) => {
                  const Icon = fileIcon(asset.extension);
                  return (
                    <article
                      key={asset.id}
                      className='group grid gap-3 px-4 py-4 transition-colors hover:bg-paper/45 sm:px-5 md:grid-cols-[minmax(0,1fr)_7rem_8rem_7.5rem] md:items-center md:gap-4'
                    >
                      <div className='flex min-w-0 items-start gap-3'>
                        <span className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-ink/10 bg-paper/65 text-ink/40'>
                          <Icon className='h-4 w-4' strokeWidth={1.5} />
                        </span>
                        <div className='min-w-0'>
                          <button
                            type='button'
                            onClick={() => setPreviewAssetId(asset.id)}
                            className='block max-w-full truncate text-left text-sm text-ink/80 transition-colors hover:text-ember'
                          >
                            {asset.filename}
                          </button>
                          {asset.excerpt ? (
                            <p className='mt-1 line-clamp-2 text-[0.68rem] leading-5 text-ink/35'>{asset.excerpt}</p>
                          ) : (
                            <p className='mt-1 truncate font-mono text-[0.52rem] uppercase tracking-[0.1em] text-ink/25'>
                              {formatFileKind(asset.extension)} · {formatBytes(asset.size_bytes)}
                              {asset.page_count ? ` · ${asset.page_count} 页` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 md:block'>
                        <span
                          className={cn(
                            'inline-flex border px-2 py-1 font-mono text-[0.48rem] uppercase tracking-[0.12em]',
                            asset.extraction_status === 'ready'
                              ? 'border-sage/40 bg-sage/10 text-ink/55'
                              : 'border-ochre/30 bg-ochre/10 text-ink/45',
                          )}
                        >
                          {assetStatusLabel(asset.extraction_status)}
                        </span>
                      </div>

                      <div className='min-w-0 text-[0.68rem] leading-5 text-ink/40'>
                        <p className='truncate'>{asset.folder_name ?? '未归档'}</p>
                        <p className='truncate text-ink/25'>{asset.course_title ?? formatDate(asset.updated_at)}</p>
                      </div>

                      <div className='flex items-center gap-0.5 md:justify-end'>
                        <button
                          type='button'
                          onClick={() => setPreviewAssetId(asset.id)}
                          className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                          aria-label={`预览 ${asset.filename}`}
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDownload(asset)}
                          className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                          aria-label={`下载 ${asset.filename}`}
                        >
                          <Download className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => setEditingAsset(asset)}
                          className='flex h-8 w-8 items-center justify-center text-ink/30 transition-colors hover:bg-ink/[0.05] hover:text-ink'
                          aria-label={`整理 ${asset.filename}`}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => setDeleteTarget(asset)}
                          className='flex h-8 w-8 items-center justify-center text-ink/25 transition-colors hover:bg-ember/[0.06] hover:text-ember'
                          aria-label={`删除 ${asset.filename}`}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {total > assets.length ? (
                <p className='border-t border-ink/10 px-5 py-3 text-[0.65rem] text-ink/30'>
                  当前展示最近 {assets.length} 份素材，共 {total} 份。
                </p>
              ) : null}
            </div>
          ) : (
            <div className='notebook-rule flex min-h-[16rem] flex-col items-center justify-center border-t border-ink/10 px-5 text-center'>
              <p className='font-display text-xl text-ink/55'>
                {debouncedSearch ? '没有找到匹配的文件' : '第一份材料，会放在这里'}
              </p>
              <p className='mt-2 max-w-sm text-xs leading-6 text-ink/35'>
                {debouncedSearch
                  ? '尝试更短的关键词，或切换文件夹与课程范围。'
                  : '上传后会自动提取文本与页码。原文件存放在服务端受控目录，解析文本写入数据库，课程引用会保留来源位置。'}
              </p>
            </div>
          )}
        </div>

        <aside className='space-y-4'>
          <div className='border border-ink/10 bg-paper/35 p-5'>
            <p className='eyebrow'>Retrieval / 检索</p>
            <p className='mt-3 text-sm leading-6 text-ink/55'>
              中文内容使用 PostgreSQL 关键词与模糊匹配；当前环境未安装 pg_trgm，因此不做向量检索。
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
                本地磁盘 · E:\Backups\Data\TeachAIAgent
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
      </section>

      <Dialog
        open={previewAssetId !== null}
        onClose={() => setPreviewAssetId(null)}
        title={detailQuery.data?.filename ?? '素材详情'}
        description={
          detailQuery.data
            ? `${formatFileKind(detailQuery.data.extension)} · ${formatBytes(detailQuery.data.size_bytes)} · ${detailQuery.data.folder_name ?? '未归档'}`
            : '正在读取解析结果…'
        }
        size='lg'
        footer={
          detailQuery.data ? (
            <>
              <Button variant='outline' onClick={() => setPreviewAssetId(null)}>
                关闭
              </Button>
              <Button variant='primary' onClick={() => handleDownload(detailQuery.data)}>
                <Download className='h-3.5 w-3.5' />
                下载原文件
              </Button>
            </>
          ) : null
        }
      >
        {detailQuery.isLoading ? (
          <div className='flex min-h-[12rem] items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-ember' />
          </div>
        ) : detailQuery.isError ? (
          <p className='py-8 text-center text-sm text-ember'>素材详情加载失败。</p>
        ) : detailQuery.data ? (
          <div className='space-y-5'>
            <div className='grid grid-cols-2 gap-3 border border-ink/10 bg-paper/40 p-4 sm:grid-cols-4'>
              <div>
                <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Chars</p>
                <p className='mt-1 text-sm text-ink/65'>{detailQuery.data.char_count.toLocaleString()}</p>
              </div>
              <div>
                <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Pages</p>
                <p className='mt-1 text-sm text-ink/65'>{detailQuery.data.page_count ?? '—'}</p>
              </div>
              <div>
                <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Course</p>
                <p className='mt-1 truncate text-sm text-ink/65'>{detailQuery.data.course_title ?? '—'}</p>
              </div>
              <div>
                <p className='font-mono text-[0.46rem] uppercase tracking-[0.14em] text-ink/25'>Status</p>
                <p className='mt-1 text-sm text-ink/65'>{assetStatusLabel(detailQuery.data.extraction_status)}</p>
              </div>
            </div>
            {detailQuery.data.truncated ? (
              <p className='border-l-2 border-ochre/60 bg-ochre/[0.07] px-3 py-2 text-xs text-ink/45'>
                解析文本超过上限，已截断展示与索引。
              </p>
            ) : null}
            {detailQuery.data.extraction_error ? (
              <p className='border-l-2 border-ember/60 bg-ember/[0.05] px-3 py-2 text-xs text-ember'>
                {detailQuery.data.extraction_error}
              </p>
            ) : null}
            <div>
              <p className='rule-label'>Extracted text / 解析文本</p>
              <pre className='mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap border border-ink/10 bg-white/35 p-4 font-sans text-xs leading-6 text-ink/55'>
                {detailQuery.data.text_preview || '这份文件没有可提取的文本。'}
              </pre>
            </div>
            {detailQuery.data.sections.length > 0 ? (
              <div>
                <p className='rule-label'>Source locators / 来源定位</p>
                <div className='mt-3 space-y-2'>
                  {detailQuery.data.sections.slice(0, 12).map((section, index) => (
                    <div key={`${section.locator.kind}-${index}`} className='border border-ink/10 bg-paper/35 p-3'>
                      <p className='font-mono text-[0.48rem] uppercase tracking-[0.12em] text-ember/75'>
                        {section.locator.label ?? section.locator.kind}
                      </p>
                      <p className='mt-2 line-clamp-3 text-xs leading-5 text-ink/45'>{section.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <AssetEditDialog
        open={editingAsset !== null}
        asset={editingAsset}
        folders={folders}
        courses={courses}
        onClose={() => setEditingAsset(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title='从素材书架移除？'
        description={`《${deleteTarget?.filename ?? ''}》会从列表和检索结果中移除，原文件仍保留在受控磁盘目录中。`}
        confirmLabel='移除素材'
        pending={deleteMutation.isLoading}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
