interface SvgOptions {
  className?: string;
  strokeWidth?: number;
  /** When true, omit width/height="1em" so Tailwind w-/h- classes in className size the SVG. */
  sizeClass?: boolean;
}

function svg(
  body: string,
  { className, strokeWidth = 2, sizeClass = false }: SvgOptions = {}
): string {
  const sizeAttrs = sizeClass ? '' : ' width="1em" height="1em"';
  const clsAttr = className ? ` class="${className}"` : '';
  return `<svg${sizeAttrs}${clsAttr} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const ROTATE_CCW_PATHS =
  '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>';

export const ICONS = {
  CHECK: svg('<path d="M20 6 9 17l-5-5"/>', {
    className: 'text-green-500 shrink-0',
    strokeWidth: 2.5,
  }),

  LEFT_ARROW: svg('<path d="m15 18-6-6 6-6"/>'),

  RIGHT_ARROW: svg('<path d="m9 18 6-6-6-6"/>'),

  PLAY: svg(
    '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>'
  ),

  STOP: svg('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'),

  TRASH: svg(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>'
  ),

  RESET: svg(ROTATE_CCW_PATHS),

  PANEL_CLOSE: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>'
  ),

  PANEL_OPEN: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/>'
  ),

  WHITE_CHECK: svg('<path d="M20 6 9 17l-5-5"/>', {
    className: 'w-2.5 h-2.5 text-white shrink-0',
    strokeWidth: 3.5,
    sizeClass: true,
  }),

  CLOSE: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),

  SEARCH: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),

  KEYBOARD: svg(
    '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>'
  ),

  SETTINGS: svg(
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
  ),

  ROCKET: svg(
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'
  ),

  SEND: svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),

  DOWNLOAD: svg(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
  ),

  UPLOAD: svg(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
  ),

  SORT: svg(
    '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>'
  ),

  CHEVRON_DOWN: svg('<path d="m6 9 6 6 6-6"/>', {
    className: 'w-3 h-3 text-fg-muted pointer-events-none shrink-0',
    sizeClass: true,
  }),

  CHEVRON_RIGHT: svg('<path d="m9 18 6-6-6-6"/>', {
    className: 'w-2.5 h-2.5 text-fg-muted pointer-events-none shrink-0',
    strokeWidth: 2.25,
    sizeClass: true,
  }),

  PLUS: svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),

  CLOSE_SM: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', {
    className: 'w-2.5 h-2.5 shrink-0',
    strokeWidth: 2.5,
    sizeClass: true,
  }),

  RETRY: svg(ROTATE_CCW_PATHS),

  COPY: svg(
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
  ),

  FORMAT: svg(
    '<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'
  ),

  GITHUB:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.27a11 11 0 0 0-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2.16 2.16 0 0 1 .64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 0 1 0-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 0 1 0 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0 0 12 1.27Z"/></svg>',
};
