'use client';

import type { ClassroomSlideCanvas } from '@/lib/api/types';
import { sanitizeSlideHtml } from '@/lib/classroom/sanitize-slide-html';
import { extractSlideText } from '@/lib/classroom/slide-text';
import { useFitScale } from '@/lib/classroom/use-fit-scale';
import { cn } from '@/lib/utils/cn';

export function SlideStage({
  canvas,
  hiddenElementIds = [],
  highlightedElementId = null,
}: {
  canvas: ClassroomSlideCanvas;
  hiddenElementIds?: string[];
  highlightedElementId?: string | null;
}) {
  const viewportWidth = canvas.viewportSize || 1280;
  const viewportHeight = Math.round(
    viewportWidth * (canvas.viewportRatio || 0.5625),
  );
  const { containerRef, scale } = useFitScale(viewportWidth);
  const background =
    canvas.background?.color ?? canvas.theme?.backgroundColor ?? '#0B1714';
  const fontColor = canvas.theme?.fontColor ?? '#EDF4E9';
  const elements = Array.isArray(canvas.elements) ? canvas.elements : [];
  const fontFamily = canvas.theme?.fontName
    ? `"${canvas.theme.fontName}", "Microsoft YaHei", "PingFang SC", sans-serif`
    : '"Microsoft YaHei", "PingFang SC", sans-serif';
  const mobile = extractSlideText(elements);

  return (
    <>
      <div className='relative flex min-h-[22rem] flex-col justify-between overflow-hidden bg-[#0B1714] p-5 md:hidden'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(169,189,168,0.12),transparent_42%),radial-gradient(circle_at_12%_92%,rgba(217,88,61,0.1),transparent_38%)]' />
        <div className='relative'>
          <p className='font-mono text-[0.5rem] uppercase tracking-[0.2em] text-sage/55'>
            {mobile.kicker || 'TeachAI / Lesson'}
          </p>
          <h3 className='mt-4 font-display text-[clamp(1.8rem,7.2vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.035em] text-chalk'>
            {mobile.title}
          </h3>
          {mobile.bullets.length > 0 ? (
            <ul className='mt-6 space-y-3'>
              {mobile.bullets.map((bullet, index) => (
                <li
                  key={`${index}-${bullet}`}
                  className='flex gap-3 text-sm leading-7 text-chalk/70'
                >
                  <span className='mt-3 h-px w-4 shrink-0 bg-ember/70' />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='mt-6 text-sm leading-7 text-chalk/45'>本页以讲解为主。</p>
          )}
        </div>
        <div className='relative mt-8 flex items-center justify-between border-t border-chalk/10 pt-3 font-mono text-[0.44rem] uppercase tracking-[0.14em] text-chalk/25'>
          <span>TeachAI Classroom</span>
          <span>Mobile view</span>
        </div>
      </div>

      <div
        ref={containerRef}
        data-testid='slide-stage'
        className='relative hidden w-full overflow-hidden bg-[#07110e] md:block'
        style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}
      >
      <div
        className='absolute left-0 top-0 origin-top-left overflow-hidden'
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale})`,
          backgroundColor: background,
          color: fontColor,
          fontFamily,
        }}
      >
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(169,189,168,0.1),transparent_46%)]' />
        {elements.map((element) => {
          const hidden = hiddenElementIds.includes(element.id);
          return (
            <div
              key={element.id}
              className={cn(
                'absolute overflow-hidden transition-opacity duration-500',
                hidden ? 'opacity-0' : 'opacity-100',
                highlightedElementId === element.id
                  ? 'outline outline-2 outline-offset-4 outline-ember/70'
                  : null,
              )}
              style={{
                left: element.left,
                top: element.top,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotate ?? 0}deg)`,
                color: element.defaultColor ?? fontColor,
                lineHeight: element.lineHeight ?? 1.4,
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeSlideHtml(element.content),
              }}
            />
          );
        })}
      </div>
      </div>
    </>
  );
}
