// Input validation shared by client and server — API Part 6 §3.1 rules.
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 255;
// Character-name rule (Tín, 2026-11-12): names may contain ONLY letters
// (including Vietnamese diacritics) and digits, 3–20 chars — no special
// characters at all (no underscore, hyphen, spaces, punctuation, emoji).
export const NAME_PATTERN = /^[\p{L}\p{N}]{3,20}$/u;
export const isValidUsername = (v: string) => NAME_PATTERN.test(v);
export const isValidPassword = (v: string) => v.length >= 8 && v.length <= 128 && /[A-Za-z]/.test(v) && /\d/.test(v);
export const isValidDisplayName = (v: string) => NAME_PATTERN.test(v.trim());
export function fieldError(field: string, message: string) { return { field, message }; }
