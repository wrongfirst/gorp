/**
 * Generates a collision-resistant unique identifier prefixed with a descriptive namespace.
 * Format: `${prefix}-${timestamp}-${randomHash}`
 */
export function createUniqueId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
