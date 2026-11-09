import type { ReactNode } from 'react';

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;

function inlineNodes(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b-${match.index}`} className='font-semibold text-chalk'>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`c-${match.index}`}
          className='rounded-[2px] bg-chalk/10 px-1 py-0.5 font-mono text-[0.8em] text-chalk/90'
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      nodes.push(
        <em key={`i-${match.index}`} className='italic text-chalk/80'>
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <a
            key={`a-${match.index}`}
            href={link[2]}
            target='_blank'
            rel='noopener noreferrer'
            className='text-ember underline decoration-ember/40 underline-offset-2'
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function isBlockStart(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('```') ||
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
