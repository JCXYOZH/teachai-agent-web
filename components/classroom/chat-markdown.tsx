import katex from 'katex';
import type { ReactNode } from 'react';

const LINK_PATTERN = /^\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/;

const MATH_DELIMITERS = [
  { opener: '$$', closer: '$$' },
  { opener: '\\[', closer: '\\]' },
];

const MATH_INLINE_FALLBACK = 'font-mono text-[0.85em] text-chalk/70';
const MATH_BLOCK_FALLBACK =
  'my-1 block whitespace-pre-wrap break-words font-mono text-[0.85em] text-chalk/70';

function isEscaped(text: string, index: number): boolean {
  let backslashes = 0;
  let cursor = index - 1;
  while (cursor >= 0 && text[cursor] === '\\') {
    backslashes += 1;
    cursor -= 1;
  }
  return backslashes % 2 === 1;
}

function findClosing(text: string, from: number, closer: string): number {
  let cursor = from;
  while (cursor <= text.length - closer.length) {
    const found = text.indexOf(closer, cursor);
    if (found === -1) {
      return -1;
    }
    if (!isEscaped(text, found)) {
      return found;
    }
    cursor = found + 1;
  }
  return -1;
}

function findInlineMathClose(text: string, from: number): number {
  let cursor = from;
  while (cursor < text.length) {
    const found = text.indexOf('$', cursor);
    if (found === -1) {
      return -1;
    }
    const previous = text[found - 1] ?? '';
    const next = text[found + 1] ?? '';
    if (isEscaped(text, found) || next === '$' || previous === '$' || /\s/.test(previous)) {
      cursor = found + 1;
      continue;
    }
    return found;
  }
  return -1;
}

function mathFallback(expression: string, displayMode: boolean, key: string): ReactNode {
  return (
    <span key={key} className={displayMode ? MATH_BLOCK_FALLBACK : MATH_INLINE_FALLBACK}>
      {displayMode ? `$$${expression}$$` : `$${expression}$`}
    </span>
  );
}

function mathNode(expression: string, displayMode: boolean, key: string): ReactNode {
  const source = expression.trim();
  if (!source) {
    return mathFallback(expression, displayMode, key);
  }
  try {
    const html = katex.renderToString(source, {
      displayMode,
      throwOnError: true,
      strict: 'ignore',
      trust: false,
    });
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return mathFallback(expression, displayMode, key);
  }
}

function blockMathStart(trimmed: string): { closer: string; rest: string } | null {
  for (const delimiter of MATH_DELIMITERS) {
    if (!trimmed.startsWith(delimiter.opener)) {
      continue;
    }
    const rest = trimmed.slice(delimiter.opener.length);
    const closingAt = rest.indexOf(delimiter.closer);
    if (closingAt === -1 || rest.slice(closingAt + delimiter.closer.length).trim() === '') {
      return { closer: delimiter.closer, rest };
    }
    return null;
  }
  return null;
}

function inlineNodes(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = '';
  let index = 0;

  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = '';
    }
  };

  while (index < text.length) {
    const char = text[index];

    if (char === '\\' && text[index + 1] === '(') {
      const closing = findClosing(text, index + 2, '\\)');
      if (closing !== -1) {
        flush();
        nodes.push(mathNode(text.slice(index + 2, closing), false, `m-${index}`));
        index = closing + 2;
        continue;
      }
    }

    if (char === '\\' && text[index + 1] === '[') {
      const closing = findClosing(text, index + 2, '\\]');
      if (closing !== -1) {
        flush();
        nodes.push(mathNode(text.slice(index + 2, closing), true, `md-${index}`));
        index = closing + 2;
        continue;
      }
    }

    if (char === '\\' && index + 1 < text.length) {
      const next = text[index + 1];
      if (next === '$' || next === '\\') {
        buffer += next;
        index += 2;
        continue;
      }
    }

    if (char === '`') {
      const closing = text.indexOf('`', index + 1);
      if (closing !== -1 && !text.slice(index + 1, closing).includes('\n')) {
        flush();
        nodes.push(
          <code
            key={`c-${index}`}
            className='rounded-[2px] bg-chalk/10 px-1 py-0.5 font-mono text-[0.8em] text-chalk/90'
          >
            {text.slice(index + 1, closing)}
          </code>,
        );
        index = closing + 1;
        continue;
      }
    }

    if (char === '$') {
      if (text[index + 1] === '$') {
        const closing = findClosing(text, index + 2, '$$');
        if (closing !== -1) {
          flush();
          nodes.push(mathNode(text.slice(index + 2, closing), true, `md-${index}`));
          index = closing + 2;
          continue;
        }
      } else {
        const next = text[index + 1];
        if (next !== undefined && !/\s/.test(next)) {
          const closing = findInlineMathClose(text, index + 1);
          if (closing !== -1) {
            flush();
            nodes.push(mathNode(text.slice(index + 1, closing), false, `m-${index}`));
            index = closing + 1;
            continue;
          }
        }
      }
    }

    if (text.startsWith('**', index)) {
      const closing = findClosing(text, index + 2, '**');
      if (closing !== -1 && closing > index + 2 && text[index + 2] !== '*' && text[closing - 1] !== '*') {
        flush();
        nodes.push(
          <strong key={`b-${index}`} className='font-semibold text-chalk'>
            {inlineNodes(text.slice(index + 2, closing))}
          </strong>,
        );
        index = closing + 2;
        continue;
      }
    }

    if (char === '*') {
      const closing = findClosing(text, index + 1, '*');
      if (closing !== -1 && closing > index + 1) {
        flush();
        nodes.push(
          <em key={`i-${index}`} className='italic text-chalk/80'>
            {inlineNodes(text.slice(index + 1, closing))}
          </em>,
        );
        index = closing + 1;
        continue;
      }
    }

    if (char === '[') {
      const link = LINK_PATTERN.exec(text.slice(index));
      if (link) {
        flush();
        nodes.push(
          <a
            key={`a-${index}`}
            href={link[2]}
            target='_blank'
            rel='noopener noreferrer'
            className='text-ember underline decoration-ember/40 underline-offset-2'
          >
            {link[1]}
          </a>,
        );
        index += link[0].length;
        continue;
      }
    }

    buffer += char;
    index += 1;
  }

  flush();
  return nodes;
}

function isBlockStart(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('```') ||
    blockMathStart(trimmed) !== null ||
    /^#{1,4}\s/.test(trimmed) ||
    /^[-*+]\s/.test(trimmed) ||
    /^\d+[.)]\s/.test(trimmed) ||
    trimmed.startsWith('>') ||
    /^(-{3,}|\*{3,})$/.test(trimmed)
  );
}

export function ChatMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre
          key={`pre-${index}`}
          className='my-2 overflow-x-auto border border-chalk/12 bg-classroom/50 p-3 font-mono text-[0.75rem] leading-5 text-chalk/80'
        >
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const mathBlock = blockMathStart(trimmed);
    if (mathBlock) {
      const closingOnSameLine = mathBlock.rest.indexOf(mathBlock.closer);
      if (closingOnSameLine !== -1) {
        blocks.push(mathNode(mathBlock.rest.slice(0, closingOnSameLine), true, `mb-${index}`));
        index += 1;
        continue;
      }
      const source: string[] = mathBlock.rest ? [mathBlock.rest] : [];
      index += 1;
      while (index < lines.length) {
        const current = lines[index];
        const closingAt = current.indexOf(mathBlock.closer);
        if (closingAt !== -1) {
          source.push(current.slice(0, closingAt));
          index += 1;
          break;
        }
        source.push(current);
        index += 1;
      }
      blocks.push(mathNode(source.join('\n'), true, `mb-${index}`));
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const size =
        level <= 2
          ? 'mt-3 text-base font-semibold text-chalk'
          : 'mt-3 text-sm font-semibold text-chalk/90';
      blocks.push(
        <p key={`h-${index}`} className={size}>
          {inlineNodes(heading[2])}
        </p>,
      );
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${index}`} className='my-3 border-chalk/15' />);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoted: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith('>')) {
        quoted.push(lines[index].trimStart().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`q-${index}`}
          className='my-2 border-l-2 border-ember/40 pl-3 text-chalk/65'
        >
          {inlineNodes(quoted.join(' '))}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*+]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      const ordered = /^\d+[.)]\s/.test(trimmed);
      const items: string[] = [];
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
      while (index < lines.length && pattern.test(lines[index].trimStart())) {
        items.push(lines[index].trimStart().replace(pattern, ''));
        index += 1;
      }
      const listClass = ordered ? 'my-2 list-decimal space-y-1 pl-5' : 'my-2 list-disc space-y-1 pl-5';
      const children = items.map((item, itemIndex) => (
        <li key={`li-${itemIndex}`}>{inlineNodes(item)}</li>
      ));
      blocks.push(
        ordered ? (
          <ol key={`ol-${index}`} className={listClass}>
            {children}
          </ol>
        ) : (
          <ul key={`ul-${index}`} className={listClass}>
            {children}
          </ul>
        ),
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length === 0) {
      index += 1;
      continue;
    }
    blocks.push(
      <p key={`p-${index}`} className='my-1.5 first:mt-0 last:mb-0'>
        {inlineNodes(paragraph.join(' '))}
      </p>,
    );
  }

  return <div className='space-y-0 text-sm leading-6'>{blocks}</div>;
}
