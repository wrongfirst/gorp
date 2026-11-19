export interface RenderMathOptions {
  throwOnError?: boolean;
}

const pendingElements = new Set<HTMLElement>();
let isWaitingForKatex = false;

function applyRenderMath(element: HTMLElement, options?: RenderMathOptions): void {
  try {
    (window as any).renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: options?.throwOnError ?? false,
    });
  } catch {
    // Ignore KaTeX rendering errors on malformed math
  }
}

function flushPendingElements(options?: RenderMathOptions): void {
  if (typeof (window as any).renderMathInElement !== 'function') return;
  for (const el of pendingElements) {
    if (el.isConnected) {
      applyRenderMath(el, options);
    }
  }
  pendingElements.clear();
}

function waitForKatex(options?: RenderMathOptions): void {
  if (isWaitingForKatex) return;
  isWaitingForKatex = true;

  const check = () => {
    if (typeof (window as any).renderMathInElement === 'function') {
      flushPendingElements(options);
      return true;
    }
    return false;
  };

  if (check()) return;

  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => check(), { once: true });
    document.addEventListener('DOMContentLoaded', () => check(), { once: true });

    const interval = setInterval(() => {
      if (check()) {
        clearInterval(interval);
      }
    }, 100);

    setTimeout(() => clearInterval(interval), 10000);
  }
}

export function renderMath(element: HTMLElement, options?: RenderMathOptions): void {
  if (!element) return;

  if (typeof (window as any).renderMathInElement === 'function') {
    applyRenderMath(element, options);
  } else {
    pendingElements.add(element);
    waitForKatex(options);
  }
}

