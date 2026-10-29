'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { ClassroomOpening } from '@/components/classroom/classroom-opening';
import { ClassroomPlayer } from '@/components/classroom/classroom-player';
import { Brand } from '@/components/layout/brand';
import { ApiError } from '@/lib/api/client';
import { getClassroom } from '@/lib/api/classroom';
import { getCourse } from '@/lib/api/library';
import type { Classroom, Course } from '@/lib/api/types';
import { classroomErrorMessage } from '@/lib/classroom/messages';
import { useAuthStore } from '@/lib/stores/auth-store';

function ClassroomHeader({
  course,
  classroom,
  isFullscreen,
  onToggleFullscreen,
}: {
  course?: Course;
  classroom?: Classroom;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <header className='sticky top-0 z-30 border-b border-chalk/10 bg-classroom/85 backdrop-blur-xl'>
      <div className='mx-auto flex h-16 max-w-[1720px] items-center gap-3 px-4 sm:h-[72px] sm:px-6'>
        <Link
          href='/library'
          aria-label='返回课程档案'
          className='flex h-9 w-9 shrink-0 items-center justify-center border border-chalk/10 text-chalk/45 transition-colors hover:border-chalk/25 hover:text-chalk'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <Brand inverted className='hidden md:flex' />
        <span className='hidden h-8 w-px bg-chalk/10 md:block' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-mono text-[0.46rem] uppercase tracking-[0.18em] text-chalk/30'>
            {classroom ? `Classroom / ${classroom.name}` : 'Classroom / 课堂'}
          </p>
          <h1 className='mt-0.5 truncate font-display text-[0.98rem] font-medium tracking-[-0.02em] text-chalk/90'>
            {course?.title ?? '课堂'}
          </h1>
        </div>
        {classroom ? (
          <div className='hidden items-center gap-3 font-mono text-[0.46rem] uppercase tracking-[0.14em] text-chalk/30 lg:flex'>
            <span>{classroom.scene_count} scenes</span>
            <span className='h-1 w-1 rounded-full bg-chalk/20' />
            <span>v{classroom.version}</span>
            <span className='h-1 w-1 rounded-full bg-chalk/20' />
            <span>DSL {classroom.dsl_version}</span>
          </div>
        ) : null}
        <button
          type='button'
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
          title={isFullscreen ? '退出全屏' : '进入全屏'}
          className='flex h-9 w-9 shrink-0 items-center justify-center border border-chalk/10 text-chalk/40 transition-colors hover:border-chalk/25 hover:text-chalk'
        >
          {isFullscreen ? (
            <Minimize2 className='h-4 w-4' />
          ) : (
            <Maximize2 className='h-4 w-4' />
          )}
        </button>
      </div>
    </header>
  );
}

function ClassroomLoading() {
  return (
    <div
      aria-label='正在加载课堂'
      aria-busy='true'
      className='mx-auto max-w-[1500px] px-4 py-6 sm:px-6'
    >
      <div className='grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_310px]'>
        <div className='hidden h-[30rem] animate-pulse border border-chalk/10 bg-chalk/[0.025] lg:block' />
        <div className='aspect-video animate-pulse border border-chalk/10 bg-chalk/[0.035]' />
        <div className='hidden h-[22rem] animate-pulse border border-chalk/10 bg-chalk/[0.025] xl:block' />
      </div>
    </div>
  );
}

function ClassroomError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className='mx-auto flex min-h-[calc(100vh-72px)] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center'>
      <span className='flex h-12 w-12 items-center justify-center border border-ember/40 bg-ember/[0.06] font-display text-xl italic text-ember'>
        !
      </span>
      <h2 className='mt-6 font-display text-3xl text-chalk'>{title}</h2>
      <p className='mt-3 max-w-md text-sm leading-7 text-chalk/45'>{message}</p>
      <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
        {onRetry ? (
          <button
            type='button'
            onClick={onRetry}
            className='inline-flex h-10 items-center gap-2 bg-chalk px-4 text-sm text-classroom transition-colors hover:bg-white'
          >
            <Loader2 className='h-3.5 w-3.5' />
            重新加载
          </button>
        ) : null}
        <Link
          href='/library'
          className='inline-flex h-10 items-center border border-chalk/15 px-4 text-sm text-chalk/60 transition-colors hover:border-chalk/30 hover:text-chalk'
        >
          返回课程档案
        </Link>
      </div>
    </div>
  );
}

export function ClassroomExperience({ courseId }: { courseId: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `/login?next=${encodeURIComponent(`/classroom/${courseId}`)}`,
      );
    }
  }, [courseId, router, status]);

  const courseQuery = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    retry: false,
    enabled: status === 'authenticated',
  });
  const classroomQuery = useQuery<Classroom>({
    queryKey: ['classroom', courseId],
    queryFn: () => getClassroom(courseId),
    retry: false,
    enabled: status === 'authenticated' && courseQuery.isSuccess,
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        return;
      }
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return;
      }
      toast.error('当前浏览器不支持全屏');
    } catch {
      toast.error('无法切换全屏，请检查浏览器权限');
    }
  };

  const course = courseQuery.data;
  const classroom = classroomQuery.data;
  const classroomMissing =
    classroomQuery.error instanceof ApiError &&
    classroomQuery.error.code === 'CLASSROOM_NOT_FOUND';

  let body: ReactNode;
  if (courseQuery.isLoading) {
    body = <ClassroomLoading />;
  } else if (courseQuery.isError || !course) {
    const error = courseQuery.error;
    body = (
      <ClassroomError
        title={
          error instanceof ApiError && error.code === 'COURSE_NOT_FOUND'
            ? '找不到这门课程'
            : '课堂加载失败'
        }
        message={classroomErrorMessage(error)}
        onRetry={() => courseQuery.refetch()}
      />
    );
  } else if (classroomQuery.isLoading) {
    body = <ClassroomLoading />;
  } else if (classroomMissing) {
    body = <ClassroomOpening course={course} courseId={courseId} />;
  } else if (classroomQuery.isError || !classroom) {
    body = (
      <ClassroomError
        title='课堂加载失败'
        message={classroomErrorMessage(classroomQuery.error)}
        onRetry={() => classroomQuery.refetch()}
      />
    );
  } else {
    body = <ClassroomPlayer classroom={classroom} />;
  }

  return (
    <div className='stage-grid relative min-h-screen overflow-x-hidden text-chalk'>
      <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(169,189,168,0.11),transparent_55%)]' />
      <div className='relative'>
        <ClassroomHeader
          course={course}
          classroom={classroom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
        {body}
      </div>
    </div>
  );
}
