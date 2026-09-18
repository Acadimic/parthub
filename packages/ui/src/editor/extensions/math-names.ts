/**
 * The two equation node names, as the schema, the serializers and the reading view all spell
 * them. One place, because the same strings appear in `@repo/shared`'s plain-text projection and
 * Markdown importer — a rename here is a stored-document migration, not a refactor.
 */
export const INLINE_MATH_NAME = 'inlineMath';
export const BLOCK_MATH_NAME = 'blockMath';
