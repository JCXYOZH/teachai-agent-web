'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import {
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
import { ApiError } from '@/lib/api/client';
import { MAX_UPLOAD_BYTES, isOversizedFile, isSupportedFile } from '@/lib/utils/asset-files';
import { errorMessage } from '@/lib/utils/errors';
import { formatBytes } from '@/lib/utils/format';

function uploadErrorReason(error: unknown): string {
  if (error instanceof ApiError && error.code === 'FILE_TOO_LARGE') {
    return `超过 ${formatBytes(MAX_UPLOAD_BYTES)} 上限`;
  }
  return errorMessage(error, '上传失败，请检查文件类型与大小');
}

export function useKnowledgeWorkspace() {
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
      const failed: { name: string; error: unknown }[] = [];
      let uploaded = 0;
      for (const file of files) {
        try {
          await uploadAsset(file, uploadCourse || undefined, uploadFolder || undefined);
          uploaded += 1;
        } catch (error) {
          failed.push({ name: file.name, error });
        }
      }
      return { uploaded, failed };
    },
    onSuccess: async ({ uploaded, failed }) => {
      await invalidateLibrary();
      if (failed.length === 0) {
        toast.success(`${uploaded} 份素材已解析并加入书架`);
        return;
      }
      const names = failed.map((item) => item.name).join('、');
      const reason = uploadErrorReason(failed[0].error);
      toast.error(
        uploaded === 0
          ? `${names}：${reason}`
          : `${uploaded} 份已加入书架，${failed.length} 份失败（${names}）：${reason}`,
      );
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (files.length === 0) {
      return;
    }
    if (uploadMutation.isLoading) {
      toast('正在上传上一批素材，请稍候再添加');
      return;
    }

    if (files.some((file) => !isSupportedFile(file))) {
      toast.error('仅支持 PDF、DOCX、PPTX、Markdown 与 TXT');
    }

    const candidates = files.filter(isSupportedFile);
    const oversized = candidates.filter(isOversizedFile);
    const uploadable = candidates.filter((file) => !isOversizedFile(file));
    if (oversized.length === 1) {
      const [file] = oversized;
      toast.error(
        `${file.name} 为 ${formatBytes(file.size)}，超过 ${formatBytes(MAX_UPLOAD_BYTES)} 上限`,
      );
    } else if (oversized.length > 1) {
      toast.error(`${oversized.length} 份文件超过 ${formatBytes(MAX_UPLOAD_BYTES)} 上限，未上传`);
    }

    if (uploadable.length > 0) {
      uploadMutation.mutate(uploadable);
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

  return {
    search,
    setSearch,
    debouncedSearch,
    selectedFolder,
    setSelectedFolder,
    selectedCourse,
    setSelectedCourse,
    uploadFolder,
    setUploadFolder,
    uploadCourse,
    setUploadCourse,
    dragActive,
    setDragActive,
    previewAssetId,
    setPreviewAssetId,
    editingAsset,
    setEditingAsset,
    deleteTarget,
    setDeleteTarget,
    fileInputRef,
    folders,
    courses,
    assets,
    total,
    assetsQuery,
    detailQuery,
    uploadMutation,
    deleteMutation,
    handleFiles,
    handleDrop,
    handleDownload,
  };
}

export type KnowledgeWorkspaceState = ReturnType<typeof useKnowledgeWorkspace>;
