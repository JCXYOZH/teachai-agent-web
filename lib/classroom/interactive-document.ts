const INTERACTIVE_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  'img-src data:',
  'font-src data:',
  'media-src data:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

const BASE_STYLES = [
  'html,body{margin:0;min-height:100%;background:#0B1714;color:#EDF4E9;}',
  'body{font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif;}',
  '*,*::before,*::after{box-sizing:border-box;}',
].join('');

function buildHead(): string {
  return [
    `<meta http-equiv="Content-Security-Policy" content="${INTERACTIVE_CSP}">`,
    '<meta name="referrer" content="no-referrer">',
    `<style>${BASE_STYLES}</style>`,
  ].join('');
}

/**
 * 包装模型生成的交互组件 HTML，使其始终在隔离、离线的环境中运行：
 * 严格 CSP 阻断全部网络通道，iframe 以 sandbox 挂载，允许执行脚本
 * 但不授予同源权限，无法访问宿主页面。
 */
export function buildInteractiveDocument(html: string): string {
  const head = buildHead();
  const source = html.trim();

  if (!source) {
    return `<!doctype html><html><head>${head}</head><body></body></html>`;
  }

  const headMatch = /<head[^>]*>/i.exec(source);
  if (headMatch) {
    const index = headMatch.index + headMatch[0].length;
    return `${source.slice(0, index)}${head}${source.slice(index)}`;
  }

  const htmlMatch = /<html[^>]*>/i.exec(source);
  if (htmlMatch) {
    const index = htmlMatch.index + htmlMatch[0].length;
    return `${source.slice(0, index)}<head>${head}</head>${source.slice(index)}`;
  }

  return `<!doctype html><html><head>${head}</head><body>${source}</body></html>`;
}
