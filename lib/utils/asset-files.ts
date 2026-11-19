import { BookOpen, FileText, FileType2, Presentation } from 'lucide-react';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const supportedExtensions = new Set(['pdf', 'docx', 'pptx', 'md', 'markdown', 'txt']);

export function isSupportedFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return supportedExtensions.has(extension);
}

export function isOversizedFile(file: File): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

export function fileIcon(extension: string) {
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
