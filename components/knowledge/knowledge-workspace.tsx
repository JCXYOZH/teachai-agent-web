'use client';

import { AssetDetailDialog } from '@/components/knowledge/asset-detail-dialog';
import { AssetFilters } from '@/components/knowledge/asset-filters';
import { AssetList } from '@/components/knowledge/asset-list';
import { KnowledgeAside } from '@/components/knowledge/knowledge-aside';
import { KnowledgeHero } from '@/components/knowledge/knowledge-hero';
import { UploadPanel } from '@/components/knowledge/upload-panel';
import { AssetEditDialog } from '@/components/library/library-dialogs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useKnowledgeWorkspace } from '@/lib/hooks/use-knowledge-workspace';

export function KnowledgeWorkspace() {
  const {
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
  } = useKnowledgeWorkspace();

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <section className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]'>
        <KnowledgeHero
          total={total}
          folderCount={folders.length}
          courseCount={courses.length}
        />

        <UploadPanel
          courses={courses}
          folders={folders}
          uploadCourse={uploadCourse}
          uploadFolder={uploadFolder}
          uploading={uploadMutation.isLoading}
          dragActive={dragActive}
          fileInputRef={fileInputRef}
          onCourseChange={setUploadCourse}
          onFolderChange={setUploadFolder}
          onDragActiveChange={setDragActive}
          onFiles={handleFiles}
          onDrop={handleDrop}
        />
      </section>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='border border-ink/10 bg-paper/30'>
          <AssetFilters
            search={search}
            selectedCourse={selectedCourse}
            selectedFolder={selectedFolder}
            courses={courses}
            folders={folders}
            onSearchChange={setSearch}
            onCourseChange={setSelectedCourse}
            onFolderChange={setSelectedFolder}
          />
          <AssetList
            assets={assets}
            total={total}
            isSearchActive={Boolean(debouncedSearch)}
            isLoading={assetsQuery.isLoading}
            isError={assetsQuery.isError}
            onRetry={() => assetsQuery.refetch()}
            onPreview={setPreviewAssetId}
            onDownload={handleDownload}
            onEdit={setEditingAsset}
            onDelete={setDeleteTarget}
          />
        </div>

        <KnowledgeAside />
      </section>

      <AssetDetailDialog
        open={previewAssetId !== null}
        asset={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        error={detailQuery.isError}
        onClose={() => setPreviewAssetId(null)}
        onDownload={handleDownload}
      />

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
