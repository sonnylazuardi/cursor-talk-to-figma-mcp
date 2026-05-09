/**
 * Utility functions for Figma data processing
 */

/**
 * Convert RGBA color object to hex string
 * @param color - Color object with r, g, b, a values (0-1 range) or hex string
 * @returns Hex color string (#RRGGBB or #RRGGBBAA)
 */
export function rgbaToHex(color: any): string {
  // Skip if color is already hex
  if (typeof color === 'string' && color.startsWith('#')) {
    return color;
  }

  if (!color || typeof color !== 'object') {
    return '#000000';
  }

  const r = Math.round((color.r ?? 0) * 255);
  const g = Math.round((color.g ?? 0) * 255);
  const b = Math.round((color.b ?? 0) * 255);
  const a = Math.round((color.a ?? 1) * 255);

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  // Only add alpha if not fully opaque
  return a === 255 ? hex : `${hex}${a.toString(16).padStart(2, '0')}`;
}

/**
 * Check if a value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned as T;
}
