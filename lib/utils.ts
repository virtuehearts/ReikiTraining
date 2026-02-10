/**
 * Normalizes environment variables by trimming whitespace and stripping leading/trailing quotes.
 * This ensures consistency across different deployment environments and .env file formats.
 */
export const normalizeEnv = (val: string | undefined): string | undefined => {
  if (!val) return val;
  return val.trim().replace(/^['"](.*)['"]$/, '$1').trim();
};
