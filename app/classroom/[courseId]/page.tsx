'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { ClassroomExperience } from '@/components/classroom/classroom-experience';

export default function ClassroomPage({
  params,
}: {
  params: { courseId: string };
}) {
  return (
    <AuthGuard>
      <ClassroomExperience courseId={params.courseId} />
    </AuthGuard>
  );
}
