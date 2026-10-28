import { AudioLines, Image, MessagesSquare } from 'lucide-react';

const cues = [
  { icon: AudioLines, label: '声音' },
  { icon: Image, label: '画面' },
  { icon: MessagesSquare, label: '互动' },
];

export function StageCard() {
  return (
    <article className='stage-grid relative flex min-h-[390px] flex-col overflow-hidden border border-ink/10 p-6 shadow-stage sm:p-7'>
      <div className='pointer-events-none absolute -right-24 top-12 h-64 w-64 rounded-full border border-sage/10' />
      <div className='pointer-events-none absolute -right-12 top-24 h-44 w-44 rounded-full border border-sage/10' />

      <header className='relative flex items-center justify-between'>
        <div>
          <p className='font-mono text-[0.52rem] uppercase tracking-[0.2em] text-chalk/35'>
            Classroom / 01
          </p>
          <p className='mt-1 text-xs text-chalk/60'>课堂预演</p>
        </div>
        <span className='flex items-center gap-2 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-chalk/30'>
          <span className='h-1.5 w-1.5 animate-soft-pulse rounded-full bg-ember' />
          Waiting
        </span>
      </header>

      <div className='relative flex flex-1 items-center justify-center py-9'>
        <div className='relative flex h-44 w-44 items-center justify-center rounded-full border border-sage/15 sm:h-52 sm:w-52'>
          <div className='absolute inset-4 rounded-full border border-sage/10' />
          <div className='absolute inset-8 rounded-full border border-sage/[0.07]' />
          <div className='ambient-dot absolute h-2 w-2 rounded-full bg-sage/70' />
          <div className='relative text-center'>
            <p className='font-mono text-[0.48rem] uppercase tracking-[0.18em] text-sage/50'>
              The first room
            </p>
            <p className='mt-3 font-display text-[1.6rem] italic leading-tight text-chalk/80'>
              还在等你
              <br />
              开场
            </p>
          </div>
          <span className='absolute -bottom-3 right-3 flex h-8 w-8 items-center justify-center border border-ember/30 bg-classroom font-mono text-[0.5rem] text-ember'>
            01
          </span>
        </div>

        <p className='absolute bottom-0 left-0 max-w-[13rem] border-l border-ember/50 pl-3 text-[0.68rem] leading-5 text-chalk/35'>
          当第一门课程生成后，这里会成为它的沉浸式课堂入口。
        </p>
      </div>

      <footer className='relative flex items-center justify-between border-t border-chalk/10 pt-4'>
        <div className='flex items-center gap-2'>
          {cues.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className='flex items-center gap-1.5 border border-chalk/10 px-2 py-1.5 font-mono text-[0.48rem] text-chalk/35'
            >
              <Icon className='h-3 w-3' />
              {label}
            </span>
          ))}
        </div>
        <span className='font-mono text-[0.44rem] uppercase tracking-[0.15em] text-chalk/20'>
          Not started
        </span>
      </footer>
    </article>
  );
}
