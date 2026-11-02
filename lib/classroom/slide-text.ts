import type { ClassroomSlideElement } from '@/lib/api/types';

export interface SlideTextContent {
  kicker: string;
  title: string;
  bullets: string[];
}

export interface SlideBulletItem {
  elementId: string;
  text: string;
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

function contentElementsOf(elements: ClassroomSlideElement[]): ClassroomSlideElement[] {
  const bodyElements = elements.filter(
    (element) => element.textType === 'content',
  );
  const legacyBody = elements.find((element) => element.id.endsWith('-body'));
  return bodyElements.length > 0 ? bodyElements : legacyBody ? [legacyBody] : [];
}

export function extractSlideBulletItems(
  elements: ClassroomSlideElement[],
): SlideBulletItem[] {
  const items = contentElementsOf(elements).flatMap((element) =>
    paragraphsOf(element.content).map((text) => ({
      elementId: element.id,
      text,
    })),
  );
  const seen = new Set<string>();
  const uniqueItems: SlideBulletItem[] = [];
  for (const item of items) {
    const key = item.text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueItems.push(item);
    if (uniqueItems.length >= 6) {
      break;
    }
  }
  return uniqueItems;
}

export function extractSlideText(elements: ClassroomSlideElement[]): SlideTextContent {
  const titleElement =
    elements.find((element) => element.textType === 'title') ??
    elements.find((element) => element.id.endsWith('-title'));
  const kickerElement =
    elements.find((element) => element.textType === 'header') ??
    elements.find((element) => element.id.endsWith('-kicker'));

  const title = titleElement ? textOf(titleElement.content) : '';
  const kicker = kickerElement ? textOf(kickerElement.content) : '';
  const uniqueBullets = extractSlideBulletItems(elements).map((item) => item.text);

  return {
    kicker,
    title: title || '未命名场景',
    bullets: uniqueBullets,
  };
}
