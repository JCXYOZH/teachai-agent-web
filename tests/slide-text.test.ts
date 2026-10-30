import { describe, expect, it } from 'vitest';

import type { ClassroomSlideElement } from '@/lib/api/types';
import { extractSlideText } from '@/lib/classroom/slide-text';

const elements: ClassroomSlideElement[] = [
  {
    id: 'scene-1-kicker',
    left: 90,
    top: 64,
    width: 600,
    height: 32,
    type: 'text',
    textType: 'header',
    content: '<p style="font-size:15px;">LESSON / 01</p>',
  },
  {
    id: 'scene-1-title',
    left: 90,
    top: 112,
    width: 1100,
    height: 150,
    type: 'text',
    textType: 'title',
    content: '<p style="font-size:54px;">从变化率出发</p>',
  },
  {
    id: 'scene-1-body',
    left: 90,
    top: 300,
    width: 1100,
    height: 300,
    type: 'text',
    textType: 'content',
    content:
      '<p style="font-size:28px;">• 平均变化率</p><p style="font-size:28px;">• 趋近过程</p>',
  },
];

describe('extractSlideText', () => {
  it('extracts kicker, title, and clean bullets from DSL elements', () => {
    expect(extractSlideText(elements)).toEqual({
      kicker: 'LESSON / 01',
      title: '从变化率出发',
      bullets: ['平均变化率', '趋近过程'],
    });
  });

  it('removes duplicate bullets and caps the list', () => {
    const body = Array.from({ length: 8 }, (_, index) => `<p>• 要点 ${index % 4}</p>`).join('');
    const result = extractSlideText([
      elements[1],
      { ...elements[2], content: body },
    ]);

    expect(result.bullets).toEqual(['要点 0', '要点 1', '要点 2', '要点 3']);
  });

  it('collects bullets from one element per point', () => {
    const result = extractSlideText([
      elements[0],
      elements[1],
      {
        ...elements[2],
        id: 'scene-1-bullet-1',
        content: '<p style="font-size:30px;">• 第一条</p>',
      },
      {
        ...elements[2],
        id: 'scene-1-bullet-2',
        content: '<p style="font-size:30px;">• 第二条</p>',
      },
    ]);

    expect(result.bullets).toEqual(['第一条', '第二条']);
  });
});
