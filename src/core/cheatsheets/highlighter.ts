import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { escapeHtml, isSafeUrl } from '../markdown';
import { highlightCodeSnippet } from '../highlighter';

export function highlightInElement(root: HTMLElement, query: string): void {
  if (!query || !query.trim()) return;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip already-highlighted marks and KaTeX screen-reader MathML
      if (parent.tagName === 'MARK' || parent.closest('.katex-mathml')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const text = node.nodeValue;
    if (!text) continue;

    regex.lastIndex = 0;
    if (!regex.test(text)) continue;

    regex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const mark = document.createElement('mark');
      mark.className = 'search-highlight';
      mark.textContent = match[0];
      fragment.appendChild(mark);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode?.replaceChild(fragment, node);
  }
}

const previewMarked = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const highlighted = highlightCodeSnippet(text, lang || '');
      return `<pre class="palette-preview-code my-2.5"><code class="hljs">${highlighted}</code></pre>`;
    },
    heading({ text, depth }: { text: string; depth: number }) {
      const sizeClass = depth === 1 ? 'text-lg font-bold' : depth === 2 ? 'text-base font-bold' : 'text-sm font-semibold';
      return `<h${depth} class="${sizeClass} text-fg-primary my-2">${text}</h${depth}>`;
    },
    link({ href, text }: { href: string; text: string }) {
      const safeHref = isSafeUrl(href) ? href : '#';
      return `<a href="${escapeHtml(safeHref)}" class="text-brand underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

export function renderCheatsheetPreview(
  title: string,
  rawMarkdown: string
): string {
  const parsed = previewMarked.parse(rawMarkdown || '') as string;
  const cleanHtml = DOMPurify.sanitize(parsed, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'b', 'em', 'i', 's', 'del', 'mark',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
  });

  const headerHtml = title
    ? `<div class="mb-3"><h3 class="text-base font-semibold tracking-tight text-fg-primary">${escapeHtml(title)}</h3></div>`
    : '';

  return `<div class="prose prose-sm max-w-none text-fg-primary">${headerHtml}${cleanHtml}</div>`;
}
