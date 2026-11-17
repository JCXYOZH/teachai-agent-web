'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ExportPanel } from '@/components/classroom/export-panel';
import { IllustrationPanel } from '@/components/classroom/illustration-panel';
import { NarrationPanel } from '@/components/classroom/narration-panel';
import { MobileSceneRail, SceneRail } from '@/components/classroom/scene-rail';
import { StageViewport } from '@/components/classroom/stage-viewport';
import { TeacherChat } from '@/components/classroom/teacher-chat';
import { getClassroomResponses } from '@/lib/api/classroom';
import { downloadMediaBlob } from '@/lib/api/media';
import type { Classroom, ClassroomResult } from '@/lib/api/types';
import { useClassroomPlayback } from '@/lib/classroom/use-classroom-playback';
import { useClassroomExport } from '@/lib/hooks/use-classroom-export';
import { useClassroomIllustration } from '@/lib/hooks/use-classroom-illustration';
import { useClassroomNarration } from '@/lib/hooks/use-classroom-narration';
import { isSlideContent } from '@/lib/utils/classroom-scene';

export function ClassroomPlayer({ classroom }: { classroom: Classroom }) {
  const [chatOpen, setChatOpen] = useState(false);
  const scenes = classroom.scenes;
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes[sceneIndex];
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  const clearAudioCache = useCallback(() => {
    for (const url of audioCacheRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    audioCacheRef.current.clear();
  }, []);

  const loadAudio = useCallback(async (audioId: string) => {
    const cached = audioCacheRef.current.get(audioId);
    if (cached) {
      return cached;
    }
    try {
      const blob = await downloadMediaBlob(audioId);
      const url = URL.createObjectURL(blob);
      audioCacheRef.current.set(audioId, url);
      return url;
    } catch {
      return null;
    }
  }, []);

  const playback = useClassroomPlayback(scene?.actions ?? [], scene?.id ?? '', {
    loadAudio,
  });

  const narration = useClassroomNarration({ classroom, clearAudioCache });
  const illustration = useClassroomIllustration({ classroom, scenes });
  const classroomExport = useClassroomExport({
    courseId: classroom.course_id,
  });

  const responsesQuery = useQuery({
    queryKey: ['classroom-responses', classroom.course_id],
    queryFn: () => getClassroomResponses(classroom.course_id),
    retry: false,
    staleTime: 30_000,
  });

  if (!scene) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-20 text-center'>
        <p className='font-display text-3xl text-chalk'>这间课堂还没有场景。</p>
      </div>
    );
  }

  const sceneRecords = (responsesQuery.data?.responses ?? []).filter(
    (record) => record.scene_id === scene.id,
  );
  const quizResults: ClassroomResult[] = sceneRecords
    .filter((record) => record.kind === 'question')
    .map((record) => ({
      target_id: record.target_id,
      kind: 'question',
      score: record.score,
      max_score: record.max_score,
      correct: record.correct,
      reference_answer: [],
      analysis: null,
    }));
  const completedTasks: Record<string, boolean> = {};
  for (const record of sceneRecords) {
    if (record.kind === 'microtask' && record.correct) {
      completedTasks[record.target_id] = true;
    }
  }
  const revealTargets = scene.actions
    .filter(
      (action) => action.type === 'reveal' && typeof action.elementId === 'string',
    )
    .map((action) => action.elementId as string);
  const hiddenElementIds =
    playback.revealed === null
      ? []
      : revealTargets.filter((id) => !playback.revealed?.includes(id));
  const responseKey = responsesQuery.isFetched ? 'ready' : 'loading';
  const currentIllustration = isSlideContent(scene.content)
    ? scene.content.illustration
    : null;

  return (
    <div className='mx-auto grid max-w-[1720px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_310px]'>
      <SceneRail
        scenes={scenes}
        activeIndex={sceneIndex}
        onSelect={setSceneIndex}
        className='sticky top-[84px] hidden max-h-[calc(100vh-104px)] lg:flex'
      />

      <section className='min-w-0'>
        <MobileSceneRail
          scenes={scenes}
          activeIndex={sceneIndex}
          onSelect={setSceneIndex}
        />
        <StageViewport
          scene={scene}
          scenes={scenes}
          sceneIndex={sceneIndex}
          classroom={classroom}
          playback={playback}
          hiddenElementIds={hiddenElementIds}
          quizResults={quizResults}
          completedTasks={completedTasks}
          responseKey={responseKey}
          onSelectIndex={setSceneIndex}
          onAskTeacher={() => setChatOpen(true)}
        />
      </section>

      <div className='space-y-5 xl:sticky xl:top-[84px] xl:self-start'>
        <NarrationPanel
          scene={scene}
          classroom={classroom}
          liveSpeech={playback.speech}
          hasAudio={playback.audioAvailable}
          busy={narration.busy}
          progress={narration.progress}
          onGenerateScene={() => narration.generateScene(scene.id)}
          onGenerateAll={narration.generateAll}
        />
        {isSlideContent(scene.content) ? (
          <IllustrationPanel
            illustration={currentIllustration}
            busy={illustration.busy}
            progress={illustration.progress}
            provider={illustration.provider}
            onProviderChange={illustration.setProvider}
            onGenerateScene={() => illustration.generateScene(scene.id)}
            onGenerateAll={illustration.generateAll}
          />
        ) : null}
        <ExportPanel
          exports={classroomExport.exports}
          busy={classroomExport.busy}
          progress={classroomExport.progress}
          downloadingFormat={classroomExport.downloadingFormat}
          onCreate={classroomExport.create}
          onDownload={classroomExport.download}
        />
      </div>

      <TeacherChat
        courseId={classroom.course_id}
        stageId={classroom.id}
        stageTitle={classroom.name}
        sceneId={scene.id}
        sceneTitle={scene.title}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
