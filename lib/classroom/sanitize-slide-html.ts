const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'SPAN',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'CODE',
  'PRE',
  'H1',
  'H2',
  'H3',
  'H4',
]);

const ALLOWED_STYLE_PROPERTIES = new Set([
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'white-space',
  'word-break',
]);

function sanitizeStyle(value: string): string {
  const declarations: string[] = [];
  for (const raw of value.split(';')) {
    const separator = raw.indexOf(':');
    if (separator < 0) {
      continue;
    }
    const property = raw.slice(0, separator).trim().toLowerCase();
    const propertyValue = raw.slice(separator + 1).trim();
    if (!ALLOWED_STYLE_PROPERTIES.has(property) || !propertyValue) {
      continue;
    }
    const lowered = propertyValue.toLowerCase();
    if (
      lowered.includes('url(') ||
      lowered.includes('expression') ||
      lowered.includes('javascript:') ||
      lowered.includes('@import') ||
      lowered.includes('behavior:')
    ) {
      continue;
    }
    declarations.push(`${property}: ${propertyValue}`);
  }
  return declarations.join('; ');
}

function sanitizeChildren(element: Element): void {
  for (const child of Array.from(element.children)) {
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.remove();
      continue;
    }
    for (const attribute of Array.from(child.attributes)) {
      if (attribute.name.toLowerCase() === 'style') {
        const safeStyle = sanitizeStyle(attribute.value);
        if (safeStyle) {
          child.setAttribute('style', safeStyle);
        } else {
          child.removeAttribute('style');
        }
      } else {
        child.removeAttribute(attribute.name);
      }
    }
    sanitizeChildren(child);
  }
}

export function sanitizeSlideHtml(html: string): string {
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return '';
  }
  const parser = new window.DOMParser();
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  sanitizeChildren(document.body);
  return document.body.innerHTML;
}
