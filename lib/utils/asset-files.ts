import { BookOpen, FileText, FileType2, Presentation } from 'lucide-react';

const supportedExtensions = new Set(['pdf', 'docx', 'pptx', 'md', 'markdown', 'txt']);

export function isSupportedFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return supportedExtensions.has(extension);
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
