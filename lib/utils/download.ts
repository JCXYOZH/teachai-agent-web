export function saveBlobAsFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // 在同一事件循环内立即释放会导致 Firefox 和 Safari 中断下载，
  // 因此先留出时间让浏览器开始读取 Blob，再释放对象 URL。
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
