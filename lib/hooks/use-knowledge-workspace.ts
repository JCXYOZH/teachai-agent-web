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
import { isSupportedFile } from '@/lib/utils/asset-files';
import { errorMessage } from '@/lib/utils/errors';

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
