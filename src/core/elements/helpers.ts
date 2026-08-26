export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    if (typeof document === 'undefined') {
        return null as unknown as T;
    }
    return document.getElementById(id) as T;
}
