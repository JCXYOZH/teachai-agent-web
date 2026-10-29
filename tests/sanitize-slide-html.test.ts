import { describe, expect, it } from 'vitest';

import { sanitizeSlideHtml } from '@/lib/classroom/sanitize-slide-html';

describe('sanitizeSlideHtml', () => {
  it('removes scripts, event handlers, and unsafe style values', () => {
    const unsafeScheme = ['java', 'script:'].join('');
    const unsafeColor = `${unsafeScheme}evil`;
    const unsafeUrl = ['url', '(', '#x', ')'].join('');
    const style = [
      'color:#fff',
      'font-size:20px',
      `color:${unsafeColor}`,
      'font-family:expression-1',
      `background-color:${unsafeUrl}`,
    ].join(';');
    const output = sanitizeSlideHtml(
      `<p onclick="alert(1)" style="${style}">Hello<script>alert(1)</script></p>`,
    );

    expect(output).not.toContain('<script');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('url(');
    expect(output).not.toContain('expression');
    expect(output).not.toContain('javascript');
    expect(output).not.toContain('background-color');
    expect(output).toContain('color: #fff');
    expect(output).toContain('font-size: 20px');
    expect(output).toContain('Hello');
  });

  it('keeps allowed teaching markup and drops unsupported tags', () => {
    const output = sanitizeSlideHtml(
      '<p style="line-height:1.5">要点 <strong>极限</strong><iframe src="https://example.com"></iframe></p>',
    );

    expect(output).toContain('<strong>极限</strong>');
    expect(output).toContain('line-height: 1.5');
    expect(output).not.toContain('<iframe');
  });
});
