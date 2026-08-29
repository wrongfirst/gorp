import { createDynamicLanguageLinter } from '../lint-helper';
 
export const lintExtension = createDynamicLanguageLinter('go');
export default lintExtension;
