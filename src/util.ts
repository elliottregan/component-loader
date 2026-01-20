/**
 * Generate a random 8-character hex ID
 */
export function id(): string {
  function s4(): string {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4()}${s4()}`;
}

/**
 * Validate a CSS selector string
 */
export function isValidSelector(selector: string): boolean {
  if (!selector) return false;
  const queryCheck = (s: string): Element | null =>
    document.createDocumentFragment().querySelector(s);
  try {
    queryCheck(selector);
  } catch {
    return false;
  }
  return true;
}
