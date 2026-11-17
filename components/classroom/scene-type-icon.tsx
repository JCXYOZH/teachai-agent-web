'use client';

import {
  CircleHelp,
  FolderKanban,
  MousePointerClick,
  Presentation,
  type LucideIcon,
} from 'lucide-react';

import type { ClassroomSceneType } from '@/lib/api/types';

const sceneTypeIcons: Record<ClassroomSceneType, LucideIcon> = {
  slide: Presentation,
  quiz: CircleHelp,
  interactive: MousePointerClick,
  pbl: FolderKanban,
};

export function SceneTypeIcon({
  type,
  className,
}: {
  type: ClassroomSceneType;
  className?: string;
}) {
  const Icon = sceneTypeIcons[type] ?? Presentation;
  return <Icon className={className} strokeWidth={1.6} />;
}
