import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatMarkdown } from '@/components/classroom/chat-markdown';

describe('ChatMarkdown', () => {
  it('renders headings, lists, code blocks and inline styles', () => {
    render(
      <ChatMarkdown
        content={'## 标题\n\n- 项目一\n- 项目二\n\n```\nconst a = 1;\n```\n\n*斜体* 与 _下划线_'}
      />,
    );

    expect(screen.getByText('标题').tagName).toBe('P');
    expect(screen.getByText('项目一').tagName).toBe('LI');
    expect(screen.getByText('const a = 1;', { exact: false }).tagName).toBe('CODE');
    expect(screen.getByText('斜体').tagName).toBe('EM');
  });

  it('renders ordered lists and blockquotes', () => {
    render(<ChatMarkdown content={'1. 第一步\n2. 第二步\n\n> 引用内容'} />);

    expect(screen.getByText('第一步').tagName).toBe('LI');
    expect(screen.getByText('第一步').parentElement?.tagName).toBe('OL');
    expect(screen.getByText('引用内容').tagName).toBe('BLOCKQUOTE');
  });

  it('escapes raw HTML and rejects unsafe links', () => {
    const { container } = render(
      <ChatMarkdown content={'<script>alert(1)</script> 文本 [坏链接](javascript:alert(1))'} />,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders http links safely', () => {
    render(<ChatMarkdown content={'参考 [文档](https://example.com/a)'} />);

    const link = screen.getByRole('link', { name: '文档' });
    expect(link).toHaveAttribute('href', 'https://example.com/a');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
