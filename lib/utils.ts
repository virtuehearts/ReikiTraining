/**
 * Normalizes environment variables by trimming whitespace and stripping leading/trailing quotes.
 * This ensures consistency across different deployment environments and .env file formats.
 */
export const normalizeEnv = (val: string | undefined): string | undefined => {
  if (!val) return val;
  let trimmed = val.trim();

  // 1. Handle matching quotes (preserve content exactly)
  const quoteMatch = trimmed.match(/^(['"])(.*)\1$/);
  if (quoteMatch) {
    return quoteMatch[2];
  }

  // 2. For unquoted values, strip trailing comments ONLY if preceded by whitespace
  // This avoids breaking passwords that contain # internally (like Pass#word)
  const hashIndex = trimmed.search(/\s#/);
  if (hashIndex !== -1) {
    trimmed = trimmed.substring(0, hashIndex).trim();
  }

  return trimmed;
};
