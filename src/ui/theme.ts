import { Compartment } from '@codemirror/state';
import { catppuccinLatte, catppuccinMocha } from '@catppuccin/codemirror';

/**
 * A compartment to handle dynamic theme switching.
 */
export const themeCompartment = new Compartment();

/**
 * Gets the CodeMirror theme extension based on the mode.
 * @param isDark - Whether to load the dark theme (Mocha).
 */
export function getTheme(isDark: boolean) {
    return isDark ? catppuccinMocha : catppuccinLatte;
}
