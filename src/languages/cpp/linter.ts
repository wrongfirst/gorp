import { createDynamicLanguageLinter } from '../lint-helper';
 
export const lintExtension = createDynamicLanguageLinter('cpp');
export default lintExtension;
