import { elements } from '../core/elements';

const TEXT_BASE = 'text-xs text-right max-w-40 truncate';
const DOT_BASE = 'w-2 h-2 rounded-full shrink-0';

function applyStatus(label: string, textClasses: string, dotClasses: string) {
    const el = elements.status;
    if (el) {
        el.textContent = label;
        el.className = `${TEXT_BASE} ${textClasses}`;
    }
    const dot = elements.statusDot;
    if (dot) {
        dot.className = `${DOT_BASE} ${dotClasses}`;
        dot.title = label;
    }
}

export const status = {
    setLoading(message = 'Loading...') {
        applyStatus(message, 'font-mono text-yellow-500', 'bg-yellow-500 animate-pulse');
    },
    setRunning() {
        applyStatus('Running...', 'font-mono text-yellow-500 animate-pulse', 'bg-yellow-500 animate-pulse');
    },
    setPassed() {
        applyStatus('PASSED', 'font-bold text-green-500', 'bg-green-500');
    },
    setFailed() {
        applyStatus('FAILED', 'font-bold text-red-500', 'bg-red-500');
    },
    setError(message = 'ERROR') {
        applyStatus(message, 'font-bold text-red-600', 'bg-red-600');
    },
    setReady() {
        applyStatus('Ready', 'font-mono text-green-600', 'bg-green-600');
    },
};
