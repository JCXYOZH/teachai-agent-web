import type { ClassroomSlideElement } from '@/lib/api/types';

export interface SlideTextContent {
  kicker: string;
  title: string;
  bullets: string[];
}

function parseBody(html: string): HTMLElement | null {
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return null;
  }
  const parser = new window.DOMParser();
  return parser.parseFromString(`<body>${html}</body>`, 'text/html').body;
}

function textOf(html: string): string {
  const body = parseBody(html);
  return body?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function paragraphsOf(html: string): string[] {
  const body = parseBody(html);
  if (!body) {
    return [];
  }
  const nodes = Array.from(body.querySelectorAll('p, li'));
  const rawValues = nodes.length > 0
    ? nodes.map((node) => node.textContent ?? '')
    : (body.textContent ?? '').split('\n');
  return rawValues
    .map((value) => value.replace(/^[•●\-–—]\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function extractSlideText(elements: ClassroomSlideElement[]): SlideTextContent {
  const titleElement =
    elements.find((element) => element.textType === 'title') ??
    elements.find((element) => element.id.endsWith('-title'));
  const bodyElement =
    elements.find((element) => element.textType === 'content') ??
    elements.find((element) => element.id.endsWith('-body'));
  const kickerElement =
    elements.find((element) => element.textType === 'header') ??
    elements.find((element) => element.id.endsWith('-kicker'));

  const title = titleElement ? textOf(titleElement.content) : '';
  const kicker = kickerElement ? textOf(kickerElement.content) : '';
  const bullets = bodyElement ? paragraphsOf(bodyElement.content) : [];
  const seen = new Set<string>();
  const uniqueBullets: string[] = [];
  for (const bullet of bullets) {
    const key = bullet.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueBullets.push(bullet);
    if (uniqueBullets.length >= 6) {
      break;
    }
  }

  return {
    kicker,
    title: title || '未命名场景',
    bullets: uniqueBullets,
  };
}
