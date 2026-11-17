import type {
  ClassroomInteractiveContent,
  ClassroomPblContent,
  ClassroomQuizContent,
  ClassroomSceneContent,
  ClassroomSceneType,
  ClassroomSlideContent,
} from '@/lib/api/types';

export const sceneTypeLabels: Record<ClassroomSceneType, string> = {
  slide: 'Slide',
  quiz: 'Check',
  interactive: 'Lab',
  pbl: 'Project',
};

export const sceneStageMeta: Record<ClassroomSceneType, string> = {
  slide: '1280 × 720',
  quiz: 'Assessment',
  interactive: 'Sandboxed · 1280 × 720',
  pbl: 'Project brief',
};


export function isSlideContent(
  content: ClassroomSceneContent,
): content is ClassroomSlideContent {
  return content.type === 'slide' && 'canvas' in content;
}

export function isQuizContent(
  content: ClassroomSceneContent,
): content is ClassroomQuizContent {
  return content.type === 'quiz' && 'questions' in content;
}

export function isInteractiveContent(
  content: ClassroomSceneContent,
): content is ClassroomInteractiveContent {
  return content.type === 'interactive' && 'html' in content;
}

export function isPblContent(
  content: ClassroomSceneContent,
): content is ClassroomPblContent {
  return content.type === 'pbl' && 'project' in content;
}

export function retryAction(
  jobId: string | null,
  retry: (jobId: string) => void | Promise<void>,
): { action: { label: string; onClick: () => void } } | undefined {
  if (!jobId) {
    return undefined;
  }
  return {
    action: {
      label: '重试',
      onClick: () => {
        void retry(jobId);
      },
    },
  };
}
