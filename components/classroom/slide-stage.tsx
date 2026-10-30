'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { downloadMediaBlob } from '@/lib/api/media';
import type {
  ClassroomIllustration,
  ClassroomSlideCanvas,
} from '@/lib/api/types';
import { sanitizeSlideHtml } from '@/lib/classroom/sanitize-slide-html';
import { extractSlideText } from '@/lib/classroom/slide-text';
import { useFitScale } from '@/lib/classroom/use-fit-scale';
import { cn } from '@/lib/utils/cn';

function useIllustrationUrl(illustration?: ClassroomIllustration | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setFailed(false);
    if (!illustration?.mediaId) {
      return () => {
        cancelled = true;
      };
    }
    downloadMediaBlob(illustration.mediaId)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    illustration?.mediaId,
    illustration?.sha256,
    illustration?.updatedAt,
  ]);

  return {
    url,
    failed,
    loading: Boolean(illustration?.mediaId) && !url && !failed,
  };
}

export function SlideStage({
  canvas,
  illustration = null,
  hiddenElementIds = [],
  highlightedElementId = null,
}: {
  canvas: ClassroomSlideCanvas;
  illustration?: ClassroomIllustration | null;
  hiddenElementIds?: string[];
  highlightedElementId?: string | null;
}) {
  const viewportWidth = canvas.viewportSize || 1280;
  const viewportHeight = Math.round(
    viewportWidth * (canvas.viewportRatio || 0.5625),
  );
  const { containerRef, scale } = useFitScale(viewportWidth, viewportHeight);
  const background =
    canvas.background?.color ?? canvas.theme?.backgroundColor ?? '#0B1714';
  const fontColor = canvas.theme?.fontColor ?? '#EDF4E9';
  const elements = Array.isArray(canvas.elements) ? canvas.elements : [];
  const fontFamily = canvas.theme?.fontName
    ? `"${canvas.theme.fontName}", "Microsoft YaHei", "PingFang SC", sans-serif`
    : '"Microsoft YaHei", "PingFang SC", sans-serif';
  const mobile = extractSlideText(elements);
  const artwork = useIllustrationUrl(illustration);

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
          {illustration && !artwork.failed ? (
            <figure className='relative mt-5 aspect-[16/9] overflow-hidden border border-chalk/10 bg-classroom/70'>
              {artwork.url ? (
                <Image
                  src={artwork.url}
                  alt={illustration.alt || mobile.title}
                  fill
                  unoptimized
                  sizes='(max-width: 767px) 100vw, 60vw'
                  className='object-cover'
                />
              ) : (
                <div className='absolute inset-0 animate-soft-pulse bg-[radial-gradient(circle_at_72%_28%,rgba(169,189,168,0.22),transparent_52%)]' />
              )}
              <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,14,0.04),transparent_50%,rgba(7,17,14,0.72))]' />
              <figcaption className='absolute bottom-2 right-3 font-mono text-[0.42rem] uppercase tracking-[0.14em] text-chalk/45'>
                {artwork.url && illustration.providerId
                  ? `${illustration.providerId} · ${illustration.width}×${illustration.height}`
                  : 'Illustrating'}
              </figcaption>
            </figure>
          ) : null}
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
        className='relative hidden w-full items-center justify-center overflow-hidden bg-[#07110e] md:flex'
        style={{
          aspectRatio: `${viewportWidth} / ${viewportHeight}`,
          maxHeight: 'calc(100vh - 13rem)',
        }}
      >
      <div
        className='relative shrink-0 origin-center overflow-hidden'
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale > 0 ? scale : 1})`,
          visibility: scale > 0 ? 'visible' : 'hidden',
          backgroundColor: background,
          color: fontColor,
          fontFamily,
        }}
      >
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(169,189,168,0.1),transparent_46%)]' />
        {artwork.url ? (
          <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
            <Image
              src={artwork.url}
              alt=''
              fill
              unoptimized
              sizes='1280px'
              className='object-cover opacity-80'
            />
            <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(11,23,20,0.99)_0%,rgba(11,23,20,0.95)_32%,rgba(11,23,20,0.66)_62%,rgba(11,23,20,0.24)_100%)]' />
            <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(11,23,20,0.4),transparent_28%,transparent_68%,rgba(11,23,20,0.72))]' />
            <div className='absolute inset-y-8 left-[61%] w-px bg-chalk/15' />
          </div>
        ) : artwork.loading ? (
          <div className='pointer-events-none absolute inset-y-0 right-0 w-[42%] animate-soft-pulse bg-sage/[0.045]' />
        ) : null}
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
