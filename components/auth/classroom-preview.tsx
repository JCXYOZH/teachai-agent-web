import { Brand } from '@/components/layout/brand';

const beats = [18, 32, 24, 44, 28, 56, 38, 22, 46, 30, 52, 20];
const chapters = [
  { index: '01', title: '用一个问题开场', time: '00:00' },
  { index: '02', title: '让实验在眼前发生', time: '04:20' },
  { index: '03', title: '把理解留在出口', time: '12:40' },
];

export function ClassroomPreview() {
  return (
    <section className='stage-grid relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-chalk/10 p-8 lg:flex xl:p-12'>
      <div className='pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full border border-sage/10' />
      <div className='pointer-events-none absolute -right-20 top-[28%] h-72 w-72 rounded-full border border-sage/10' />

      <header className='relative z-10 flex items-center justify-between'>
        <Brand inverted />
        <div className='flex items-center gap-3 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-chalk/40'>
          <span className='h-1.5 w-1.5 animate-soft-pulse rounded-full bg-sage' />
          Classroom preview
        </div>
      </header>

      <div className='relative z-10 my-10 max-w-3xl animate-rise'>
        <p className='font-mono text-[0.62rem] uppercase tracking-[0.22em] text-sage/70'>
          TeachAI / 备课预演
        </p>
        <h1 className='mt-6 font-display text-[clamp(3.2rem,5.4vw,6.2rem)] font-normal leading-[0.93] tracking-[-0.055em] text-chalk'>
          把一节课，
          <br />
          写成可以
          <span className='italic text-ember'>走进去</span>
          <br />
          的空间。
        </h1>

        <div className='relative mt-12 max-w-xl border border-chalk/10 bg-classroom/55 p-5 backdrop-blur-md sm:p-6'>
          <span className='absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center border border-ember/40 bg-classroom font-mono text-[0.55rem] text-ember'>
            01
          </span>
          <div className='flex items-center justify-between font-mono text-[0.54rem] uppercase tracking-[0.18em] text-chalk/35'>
            <span>Live lecture room</span>
            <span>00:14:32</span>
          </div>
          <p className='mt-6 font-display text-2xl italic leading-snug text-chalk/90 sm:text-[1.75rem]'>
            “光在介质里改变了方向，
            <br className='hidden sm:block' />
            但它从未停止前进。”
          </p>
          <div className='mt-7 flex h-14 items-end gap-1.5 overflow-hidden'>
            {beats.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className='w-1.5 shrink-0 rounded-full bg-sage/45'
                style={{
                  height: `${height}px`,
                  opacity: index % 3 === 0 ? 0.95 : 0.42,
                }}
              />
            ))}
            <div className='ml-3 flex flex-1 items-center justify-between border-l border-chalk/10 pl-4 font-mono text-[0.5rem] uppercase tracking-[0.15em] text-chalk/30'>
              <span>Voice · 01</span>
              <span>Spotlight</span>
              <span>Whiteboard</span>
            </div>
          </div>
        </div>
      </div>

      <footer className='relative z-10 grid gap-6 border-t border-chalk/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end'>
        <div className='flex flex-wrap gap-x-8 gap-y-3'>
          {chapters.map((chapter) => (
            <div key={chapter.index} className='flex items-baseline gap-2.5'>
              <span className='font-mono text-[0.52rem] text-ember/80'>{chapter.index}</span>
              <div>
                <p className='text-xs text-chalk/65'>{chapter.title}</p>
                <p className='mt-0.5 font-mono text-[0.5rem] text-chalk/25'>{chapter.time}</p>
              </div>
            </div>
          ))}
        </div>
        <p className='font-mono text-[0.5rem] uppercase tracking-[0.16em] text-chalk/25'>
          Qwen3.6 · llama.cpp
        </p>
      </footer>
    </section>
  );
}
