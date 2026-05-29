/**
 * Escapa HTML para exportaciones y evita XSS en contenido de IA.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convierte **negrita** markdown en nodos React sin innerHTML.
 */
export function renderBoldSegments(line: string): (string | { bold: string })[] {
  const segments: (string | { bold: string })[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push(line.slice(lastIndex, match.index));
    }
    segments.push({ bold: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    segments.push(line.slice(lastIndex));
  }

  return segments.length > 0 ? segments : [line];
}
