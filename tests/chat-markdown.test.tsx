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


describe('ChatMarkdown math', () => {
  it('renders inline math through katex', () => {
    const { container } = render(
      <ChatMarkdown content={'分式 $\\frac{1}{n(n+k)}$ 可拆分'} />,
    );

    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.textContent).not.toContain('$');
  });

  it('renders a display math block', () => {
    const { container } = render(
      <ChatMarkdown
        content={'$$\n\\arctan x - \\arctan y = \\arctan \\frac{x-y}{1+xy}\n$$'}
      />,
    );

    expect(container.querySelector('.katex-display')).not.toBeNull();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a single line display math block', () => {
    const { container } = render(
      <ChatMarkdown content={'$$ \\sum \\frac{1}{n(n+1)} = 1 $$'} />,
    );

    expect(container.querySelector('.katex-display')).not.toBeNull();
    expect(container.textContent).not.toContain('$$');
  });

  it('renders math inside list items', () => {
    const { container } = render(
      <ChatMarkdown content={'- $\\tan^{-1} \\frac{1}{2n^2}$\n- 普通文本'} />,
    );

    expect(container.querySelectorAll('.katex').length).toBe(1);
    expect(screen.getByText('普通文本').tagName).toBe('LI');
  });

  it('falls back to raw text for unterminated math', () => {
    const { container } = render(<ChatMarkdown content={'流式 $\\frac{1}{n'} />);

    expect(container.querySelector('.katex')).toBeNull();
    expect(container.textContent).toContain('$\\frac{1}{n');
  });

  it('falls back to raw text for invalid latex', () => {
    const { container } = render(<ChatMarkdown content={'坏公式 $\\frac{1}{$ 结束'} />);

    expect(container.querySelector('.katex')).toBeNull();
    expect(container.textContent).toContain('坏公式');
  });

  it('keeps currency amounts as plain text', () => {
    const { container } = render(<ChatMarkdown content={'价格 $5 和 $10 元'} />);

    expect(container.querySelector('.katex')).toBeNull();
    expect(container.textContent).toContain('$5 和 $10 元');
  });

  it('renders math delimited with brackets and parentheses', () => {
    const { container } = render(
      <ChatMarkdown content={'行内 \\(a^2+b^2\\)\n\n\\[\n\\frac{1}{2}\n\\]'} />,
    );

    expect(container.querySelectorAll('.katex').length).toBe(2);
  });

  it('keeps code blocks free of math rendering', () => {
    const { container } = render(
      <ChatMarkdown content={'```\n$\\frac{1}{2}$\n```'} />,
    );

    expect(container.querySelector('.katex')).toBeNull();
    expect(container.textContent).toContain('$\\frac{1}{2}$');
  });
});

describe('ChatMarkdown math sample', () => {
  it('renders a real teacher answer with inline and display formulas', () => {
    const sample = [
      '**一、 裂项相消（Telescoping Series）核心公式**',
      '',
      '裂项的核心是将通项 $u_n$ 写成 $f(n) - f(n+1)$ 的形式，求部分和 $S_N$ 时中间项相互抵消。',
      '',
      '1. **代数裂项（最基础）**',
      '',
      '- $\\frac{1}{n(n+k)} = \\frac{1}{k} \\left( \\frac{1}{n} - \\frac{1}{n+k} \\right)$',
      '- 例：$\\sum \\frac{1}{n(n+1)} = 1$',
      '',
      '$$ \\arctan x - \\arctan y = \\arctan \\frac{x-y}{1+xy} $$',
      '',
      '令 $x = n+1, y = n-1$，则 $\\frac{x-y}{1+xy} = \\frac{2}{n^2}$。',
      '',
      '$$ \\arctan \\frac{2}{n^2} = \\arctan(n+1) - \\arctan(n-1) $$',
      '',
      '- $\\ln \\frac{n}{n+1} = \\ln n - \\ln(n+1)$',
      '- 常用恒等式：$\\tan^{-1} \\frac{1}{2n^2} = \\tan^{-1}(2n+1) - \\tan^{-1}(2n-1)$',
    ].join('\\n');

    const { container } = render(<ChatMarkdown content={sample} />);

    expect(container.querySelectorAll('.katex').length).toBe(11);
    expect(container.querySelectorAll('.katex-display').length).toBe(2);
    expect(container.textContent).not.toContain('$');
  });
});
