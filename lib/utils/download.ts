export function saveBlobAsFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking in the same tick aborts the download in Firefox and Safari, so
  // give the browser a moment to start reading the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
