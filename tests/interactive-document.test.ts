import { describe, expect, it } from 'vitest';

import { buildInteractiveDocument } from '@/lib/classroom/interactive-document';

describe('buildInteractiveDocument', () => {
  it('injects the offline CSP into a full document', () => {
    const output = buildInteractiveDocument(
      '<!doctype html><html><head><title>x</title></head><body><p>hi</p></body></html>',
    );

    expect(output).toContain('Content-Security-Policy');
    expect(output).toContain("default-src 'none'");
    expect(output).toContain("connect-src 'none'");
    expect(output).toContain('<title>x</title>');
    expect(output).toContain('<p>hi</p>');
    expect(output.indexOf('Content-Security-Policy')).toBeLessThan(
      output.indexOf('<title>'),
    );
  });

  it('wraps a bare fragment in a styled document', () => {
    const output = buildInteractiveDocument('<button>start</button>');

    expect(output.startsWith('<!doctype html>')).toBe(true);
    expect(output).toContain('<body><button>start</button></body>');
    expect(output).toContain('background:#0B1714');
  });

  it('adds a head when the document only has an html tag', () => {
    const output = buildInteractiveDocument(
      '<html lang="zh"><body><canvas></canvas></body></html>',
    );

    expect(output).toContain('<html lang="zh"><head>');
    expect(output).toContain('<canvas></canvas>');
  });

  it('keeps inline scripts while still blocking network access', () => {
    const output = buildInteractiveDocument(
      '<html><head></head><body><script>window.ready=true;</script></body></html>',
    );

    expect(output).toContain('<script>window.ready=true;</script>');
    expect(output).toContain("script-src 'unsafe-inline'");
    expect(output).toContain("connect-src 'none'");
  });

  it('returns an empty shell for blank input', () => {
    const output = buildInteractiveDocument('   ');

    expect(output).toContain('Content-Security-Policy');
    expect(output).toContain('<body></body>');
  });
});
