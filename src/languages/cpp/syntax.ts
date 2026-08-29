import { StreamLanguage } from '@codemirror/language';
import { cpp } from '@codemirror/legacy-modes/mode/clike';
import type { Extension } from '@codemirror/state';

export const syntaxExtension: Extension = StreamLanguage.define(cpp);
export default syntaxExtension;
