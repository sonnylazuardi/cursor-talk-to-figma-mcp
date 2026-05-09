/**
 * Schema coercion for top-level MCP tool parameters.
 *
 * Some MCP clients JSON-stringify complex arguments before dispatch (arrays as
 * "[...]", numbers as "2", etc.). Zod then rejects with invalid_type. This
 * module walks the top-level schema, unwraps Optional/Nullable/Default, and
 * inserts a preprocess step that parses JSON-encoded strings back into the
 * expected shape before validation runs.
 *
 * Applied centrally via tool-proxy so per-tool schemas stay untouched.
 */

import { z } from 'zod';

const parseArrayString = (val: unknown): unknown => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : val;
    } catch {
      return val;
    }
  }
  return val;
};

const parseNumberString = (val: unknown): unknown => {
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    return Number.isNaN(parsed) ? val : parsed;
  }
  return val;
};

function preserveDescription(original: any, wrapped: z.ZodTypeAny): z.ZodTypeAny {
  const description = original?._def?.description;
  if (description && !(wrapped as any)?._def?.description) {
    return wrapped.describe(description);
  }
  return wrapped;
}

function coerceField(field: any): any {
  if (!field || typeof field !== 'object' || !field._def) {
    return field;
  }

  const typeName = field._def.typeName;

  if (typeName === 'ZodOptional') {
    const inner = field._def.innerType;
    const coercedInner = coerceField(inner);
    if (coercedInner === inner) return field;
    return preserveDescription(field, coercedInner.optional());
  }

  if (typeName === 'ZodNullable') {
    const inner = field._def.innerType;
    const coercedInner = coerceField(inner);
    if (coercedInner === inner) return field;
    return preserveDescription(field, coercedInner.nullable());
  }

  if (typeName === 'ZodDefault') {
    const inner = field._def.innerType;
    const coercedInner = coerceField(inner);
    if (coercedInner === inner) return field;
    const defaultGetter = field._def.defaultValue;
    const defaultVal = typeof defaultGetter === 'function' ? defaultGetter() : defaultGetter;
    return preserveDescription(field, coercedInner.default(defaultVal));
  }

  if (typeName === 'ZodArray') {
    return preserveDescription(field, z.preprocess(parseArrayString, field));
  }

  if (typeName === 'ZodNumber') {
    return preserveDescription(field, z.preprocess(parseNumberString, field));
  }

  return field;
}

/**
 * Walks a top-level MCP tool schema (Record<string, ZodType>) and returns a
 * new Record where ZodArray/ZodNumber fields (including those wrapped in
 * Optional/Nullable/Default) accept JSON-stringified input.
 */
export function coerceSchemaFields(
  schema: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = coerceField(value);
  }
  return result;
}
