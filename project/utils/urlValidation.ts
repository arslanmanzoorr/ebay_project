
/**
 * Utility to validate URLs against allowed patterns.
 * Patterns are comma-separated in the environment variable NEXT_PUBLIC_ALLOWED_URL_PATTERNS.
 * Default pattern: https://hibid.com/lot/
 */
export const ALLOWED_PATTERNS = process.env.NEXT_PUBLIC_ALLOWED_URL_PATTERNS
  ? process.env.NEXT_PUBLIC_ALLOWED_URL_PATTERNS.split(',').map(p => p.trim())
  : ['https://hibid.com/lot/'];

export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  // Check if URL matches any of the allowed patterns
  const isMatch = ALLOWED_PATTERNS.some(pattern => url.startsWith(pattern));

  if (!isMatch) {
    return {
      isValid: false,
      error: `URL must start with one of the following: ${ALLOWED_PATTERNS.join(', ')}`
    };
  }

  return { isValid: true };
};
