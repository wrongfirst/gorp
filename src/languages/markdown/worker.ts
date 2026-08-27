import { createWorkerHandler } from '../base-worker';

createWorkerHandler({
  async execute(userCode: string, testCode: string = '') {
    if (!testCode.trim()) {
      return {
        success: true,
        output: 'Practice session completed successfully!',
      };
    }

    const normalize = (s: string) => s.replace(/\r\n/g, '\n').trimEnd();
    const isMatch = normalize(userCode) === normalize(testCode);

    if (isMatch) {
      return {
        success: true,
        output: 'Target text matched perfectly!',
      };
    } else {
      return {
        success: false,
        output: `Buffer does not match target text yet.\n\n--- Your Buffer ---\n${userCode}\n\n--- Expected Target ---\n${testCode}`,
        error: 'Target text mismatch',
      };
    }
  },
});
