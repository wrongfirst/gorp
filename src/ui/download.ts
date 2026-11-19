/**
 * Formats a Date object into a sortable timestamp string: YYYY-MM-DD_HH-mm-ss
 */
export function formatDateTimestamp(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/**
 * Triggers a browser file download for JSON content with an automated timestamp in the filename.
 * Accepts either a pre-serialized JSON string or any serializable data object.
 */
export function downloadJsonFile(filenamePrefix: string, data: unknown): void {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = formatDateTimestamp();

  a.href = url;
  a.download = `${filenamePrefix}-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
